"""
Notification helper functions — import and call from any app.
Always wrapped in try/except so they never break the caller's flow.
"""
from .models import Notification


def notify_user(user, title, message, notification_type='system', display_type='info'):
    """Create a notification for a single user."""
    Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        type=display_type,
    )


def notify_reservation_created(reservation):
    try:
        pharmacist = getattr(getattr(reservation.pharmacie, 'user', None), '__self__', None)
        # pharmacie.user is the pharmacist account; fall back to reservation.pharmacie.user
        pharmacy = reservation.pharmacie
        user = getattr(pharmacy, 'user', None)
        if user:
            notify_user(
                user,
                title='Nouvelle réservation',
                message=f'Réservation #{reservation.id} reçue de {reservation.utilisateur.get_full_name() or reservation.utilisateur.username}.',
                notification_type='reservation',
                display_type='info',
            )
    except Exception:
        pass


def notify_reservation_confirmed(reservation):
    try:
        notify_user(
            reservation.utilisateur,
            title='Réservation confirmée',
            message=f'Votre réservation #{reservation.id} a été confirmée par la pharmacie.',
            notification_type='reservation',
            display_type='confirmation',
        )
    except Exception:
        pass


def notify_reservation_cancelled(reservation):
    try:
        notify_user(
            reservation.utilisateur,
            title='Réservation annulée',
            message=f'Votre réservation #{reservation.id} a été annulée.',
            notification_type='reservation',
            display_type='alerte',
        )
    except Exception:
        pass


def notify_payment_validated(payment):
    try:
        user = getattr(payment, 'user', None) or getattr(payment.reservation, 'utilisateur', None)
        if user:
            notify_user(
                user,
                title='Paiement validé',
                message=f'Votre paiement de {payment.montant} MRU a été validé.',
                notification_type='payment',
                display_type='confirmation',
            )
    except Exception:
        pass


def notify_payment_rejected(payment):
    try:
        user = getattr(payment, 'user', None) or getattr(payment.reservation, 'utilisateur', None)
        if user:
            notify_user(
                user,
                title='Paiement refusé',
                message='Votre paiement a été refusé. Veuillez réessayer ou contacter le support.',
                notification_type='payment',
                display_type='alerte',
            )
    except Exception:
        pass


def notify_subscription_activated(subscription):
    try:
        user = subscription.pharmacie.user
        notify_user(
            user,
            title='Abonnement activé',
            message=f'Votre abonnement "{subscription.plan.nom}" est maintenant actif.',
            notification_type='subscription',
            display_type='confirmation',
        )
    except Exception:
        pass


def notify_subscription_expiring(subscription, days_left):
    try:
        user = subscription.pharmacie.user
        notify_user(
            user,
            title='Abonnement bientôt expiré',
            message=f'Votre abonnement expire dans {days_left} jour(s). Pensez à le renouveler.',
            notification_type='subscription',
            display_type='alerte',
        )
    except Exception:
        pass


def notify_commission_collected(transaction):
    try:
        user = transaction.pharmacy.user
        notify_user(
            user,
            title='Commission prélevée',
            message=f'Commission de {transaction.commission} MRU prélevée sur la transaction {transaction.reference_transaction}.',
            notification_type='commission',
            display_type='info',
        )
    except Exception:
        pass
