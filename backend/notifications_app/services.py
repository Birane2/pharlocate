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


# ── Reservation ──────────────────────────────────────────────────────────────

def notify_reservation_created(reservation):
    """Notify the pharmacist that a new reservation has arrived."""
    try:
        user = getattr(reservation.pharmacie, 'user', None)
        if user:
            client_name = (
                reservation.utilisateur.get_full_name()
                or getattr(reservation.utilisateur, 'phone_number', '')
                or reservation.utilisateur.username
            )
            notify_user(
                user,
                title='Nouvelle réservation',
                message=f'Réservation #{reservation.id} reçue de {client_name}.',
                notification_type='reservation',
                display_type='info',
            )
    except Exception:
        pass


def notify_reservation_confirmed(reservation):
    """Notify the client that their reservation was confirmed."""
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
    """Notify the client that their reservation was cancelled."""
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


def notify_reservation_rejected(reservation):
    try:
        notify_user(
            reservation.utilisateur,
            title='Réservation refusée',
            message=f'Votre réservation #{reservation.id} a été refusée par la pharmacie.',
            notification_type='reservation',
            display_type='alerte',
        )
    except Exception:
        pass


def notify_reservation_preparing(reservation):
    try:
        notify_user(
            reservation.utilisateur,
            title='Commande en préparation',
            message=f'Votre commande #{reservation.id} est en cours de préparation.',
            notification_type='reservation',
            display_type='info',
        )
    except Exception:
        pass


def notify_reservation_ready_pickup(reservation):
    try:
        notify_user(
            reservation.utilisateur,
            title='Commande prête à retirer',
            message=f'Votre commande #{reservation.id} est prête. Vous pouvez passer la récupérer en pharmacie.',
            notification_type='reservation',
            display_type='confirmation',
        )
    except Exception:
        pass


def notify_reservation_ready(reservation):
    try:
        notify_user(
            reservation.utilisateur,
            title='Commande prête pour livraison',
            message=f'Votre commande #{reservation.id} est prête et sera bientôt prise en charge par un livreur.',
            notification_type='reservation',
            display_type='confirmation',
        )
    except Exception:
        pass


def notify_reservation_in_delivery(reservation):
    try:
        notify_user(
            reservation.utilisateur,
            title='Commande en cours de livraison',
            message=f'Votre commande #{reservation.id} est en route !',
            notification_type='delivery',
            display_type='info',
        )
    except Exception:
        pass


def notify_reservation_delivered(reservation):
    try:
        notify_user(
            reservation.utilisateur,
            title='Commande livrée',
            message=f'Votre commande #{reservation.id} a bien été livrée. Merci pour votre confiance !',
            notification_type='delivery',
            display_type='confirmation',
        )
    except Exception:
        pass


def notify_reservation_picked_up(reservation):
    try:
        notify_user(
            reservation.utilisateur,
            title='Commande retirée',
            message=f'Votre commande #{reservation.id} a été retirée avec succès.',
            notification_type='reservation',
            display_type='confirmation',
        )
    except Exception:
        pass


# ── Payment ───────────────────────────────────────────────────────────────────

def notify_payment_validated(payment):
    try:
        user = getattr(payment, 'user', None) or getattr(payment.reservation, 'utilisateur', None)
        if user:
            notify_user(
                user,
                title='Paiement validé',
                message=f'Votre paiement de {payment.montant_total} MRU a été validé.',
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


def notify_pharmacist_new_payment(payment):
    """Notify the pharmacist that a new payment requires validation."""
    try:
        pharmacy = getattr(payment, 'pharmacy', None)
        if not pharmacy:
            pharmacy = getattr(getattr(payment, 'reservation', None), 'pharmacie', None)
        user = getattr(pharmacy, 'user', None)
        if user:
            notify_user(
                user,
                title='Nouveau paiement reçu',
                message=f'Un paiement de {payment.montant_total} MRU est en attente de validation.',
                notification_type='payment',
                display_type='info',
            )
    except Exception:
        pass


# ── Pharmacy validation ───────────────────────────────────────────────────────

def notify_pharmacy_validated(pharmacy):
    try:
        notify_user(
            pharmacy.user,
            title='Pharmacie validée',
            message=f'Votre pharmacie "{pharmacy.nom}" a été validée par l\'administration. Vous pouvez maintenant recevoir des réservations.',
            notification_type='system',
            display_type='confirmation',
        )
    except Exception:
        pass


def notify_pharmacy_rejected(pharmacy):
    try:
        motif = pharmacy.motif_refus or 'Non précisé'
        notify_user(
            pharmacy.user,
            title='Pharmacie refusée',
            message=f'Votre pharmacie "{pharmacy.nom}" a été refusée. Motif : {motif}.',
            notification_type='system',
            display_type='alerte',
        )
    except Exception:
        pass


def notify_pharmacy_suspended(pharmacy):
    try:
        notify_user(
            pharmacy.user,
            title='Pharmacie suspendue',
            message=f'Votre pharmacie "{pharmacy.nom}" a été suspendue. Contactez l\'administration pour plus d\'informations.',
            notification_type='system',
            display_type='alerte',
        )
    except Exception:
        pass


# ── Subscription ──────────────────────────────────────────────────────────────

def notify_subscription_activated(subscription):
    try:
        user = subscription.pharmacy.user
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
        user = subscription.pharmacy.user
        notify_user(
            user,
            title='Abonnement bientôt expiré',
            message=f'Votre abonnement expire dans {days_left} jour(s). Pensez à le renouveler.',
            notification_type='subscription',
            display_type='alerte',
        )
    except Exception:
        pass


def notify_subscription_rejected(subscription):
    try:
        user = subscription.pharmacy.user
        notify_user(
            user,
            title='Abonnement refusé',
            message=f'Votre demande d\'abonnement "{subscription.plan.nom}" a été refusée.',
            notification_type='subscription',
            display_type='alerte',
        )
    except Exception:
        pass


# ── Commission ────────────────────────────────────────────────────────────────

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
