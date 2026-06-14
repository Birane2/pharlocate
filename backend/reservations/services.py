from django.core.exceptions import ValidationError
from django.db import transaction

from deliveries.models import Delivery
from deliveries.services import change_delivery_status
from medicaments.models import Stock
from notifications_app.models import Notification
from payments.models import Payment

from .models import Reservation


def calculate_reservation_amount(reservation):
    return reservation.calculate_amounts(save=True)


def _notify_pharmacist(reservation, message, notification_type='info'):
    pharmacist = getattr(reservation.pharmacie, 'user', None)
    if pharmacist:
        Notification.objects.create(
            user=pharmacist,
            message=message,
            type=notification_type,
        )


@transaction.atomic
def cancel_reservation_by_user(reservation, user):
    if reservation.user_id != user.id:
        raise ValidationError("Vous ne pouvez annuler que vos propres reservations.")

    blocked_reservation_statuses = {
        Reservation.STATUS_CONFIRMED,
        Reservation.STATUS_PREPARING,
        Reservation.STATUS_READY,
        Reservation.STATUS_DELIVERED,
        Reservation.STATUS_CANCELLED,
    }
    if reservation.statut in blocked_reservation_statuses:
        raise ValidationError("Cette reservation ne peut plus etre annulee.")

    payment = getattr(reservation, 'payment', None)
    if payment and payment.statut == Payment.STATUS_VALIDATED:
        raise ValidationError(
            'Paiement deja valide. Creez une demande de remboursement.'
        )

    if reservation.statut != Reservation.STATUS_PENDING:
        raise ValidationError("Cette reservation ne peut plus etre annulee.")

    if payment:
        payment.statut = Payment.STATUS_CANCELLED
        payment.save(update_fields=['statut'])

    delivery = getattr(reservation, 'delivery', None)
    if delivery and delivery.statut != Delivery.STATUS_CANCELLED:
        try:
            change_delivery_status(
                delivery,
                Delivery.STATUS_CANCELLED,
                changed_by=user,
                commentaire='Reservation annulee par le client.',
            )
        except ValidationError:
            delivery.statut = Delivery.STATUS_CANCELLED
            delivery.save(update_fields=['statut'])

    reservation.statut = Reservation.STATUS_CANCELLED
    reservation.statut_paiement = Reservation.PAYMENT_STATUS_CANCELLED
    reservation.save(
        update_fields=['statut', 'statut_paiement', 'date_modification']
    )

    _notify_pharmacist(
        reservation,
        f'La commande #{reservation.id} a ete annulee par le client.',
        notification_type='alerte',
    )
    return reservation


@transaction.atomic
def confirm_reservation(reservation, pharmacist):
    if getattr(reservation.pharmacie, 'user_id', None) != pharmacist.id:
        raise ValidationError("Vous ne pouvez confirmer que vos commandes.")

    payment = getattr(reservation, 'payment', None)
    if not payment or payment.statut != Payment.STATUS_VALIDATED:
        raise ValidationError('Le paiement doit etre valide avant confirmation.')

    if reservation.statut != Reservation.STATUS_PENDING:
        raise ValidationError('Cette commande ne peut plus etre confirmee.')

    for item in reservation.items.select_related('medicament'):
        try:
            stock = Stock.objects.select_for_update().get(
                pharmacie=reservation.pharmacie,
                medicament=item.medicament,
            )
        except Stock.DoesNotExist as exc:
            raise ValidationError(
                f"Stock introuvable pour {item.medicament.nom}."
            ) from exc

        if stock.quantite < item.quantite:
            raise ValidationError(
                f"Stock insuffisant pour {item.medicament.nom}."
            )

        stock.quantite -= item.quantite
        stock.save(update_fields=['quantite', 'date_modification'])

    reservation.statut = Reservation.STATUS_CONFIRMED
    reservation.save(update_fields=['statut', 'date_modification'])

    Notification.objects.create(
        user=reservation.user,
        message=f'Votre commande #{reservation.id} a ete confirmee.',
        type='confirmation',
    )
    return reservation
