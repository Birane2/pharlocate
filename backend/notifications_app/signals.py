"""
Django signals that auto-create notifications on business events.
Registered in NotificationsAppConfig.ready().

Pattern: pre_save caches the old field value on the instance so post_save
can detect actual changes without a second DB query.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver


# ── Reservation signals ───────────────────────────────────────────────────────

def _register_reservation_signals():
    from reservations.models import Reservation
    from .services import (
        notify_reservation_cancelled,
        notify_reservation_confirmed,
        notify_reservation_created,
        notify_reservation_delivered,
        notify_reservation_in_delivery,
        notify_reservation_picked_up,
        notify_reservation_preparing,
        notify_reservation_ready,
        notify_reservation_ready_pickup,
        notify_reservation_rejected,
    )

    _STATUS_HANDLERS = {
        Reservation.STATUS_CONFIRMED: notify_reservation_confirmed,
        Reservation.STATUS_CANCELLED: notify_reservation_cancelled,
        Reservation.STATUS_REJECTED: notify_reservation_rejected,
        Reservation.STATUS_PREPARING: notify_reservation_preparing,
        Reservation.STATUS_READY_PICKUP: notify_reservation_ready_pickup,
        Reservation.STATUS_READY: notify_reservation_ready,
        Reservation.STATUS_IN_DELIVERY: notify_reservation_in_delivery,
        Reservation.STATUS_DELIVERED: notify_reservation_delivered,
        Reservation.STATUS_PICKED_UP: notify_reservation_picked_up,
    }

    @receiver(pre_save, sender=Reservation, dispatch_uid='notif_reservation_pre_save')
    def _cache_reservation_statut(sender, instance, **kwargs):
        if not instance.pk:
            instance._prev_statut = None
            return
        try:
            instance._prev_statut = (
                sender.objects.values('statut').get(pk=instance.pk)['statut']
            )
        except sender.DoesNotExist:
            instance._prev_statut = None

    @receiver(post_save, sender=Reservation, dispatch_uid='notif_reservation_post_save')
    def _on_reservation_saved(sender, instance, created, **kwargs):
        if created:
            notify_reservation_created(instance)
            return
        prev = getattr(instance, '_prev_statut', None)
        if prev != instance.statut:
            handler = _STATUS_HANDLERS.get(instance.statut)
            if handler:
                handler(instance)


# ── Pharmacy signals ──────────────────────────────────────────────────────────

def _register_pharmacy_signals():
    from pharmacies.models import Pharmacy
    from .services import (
        notify_pharmacy_rejected,
        notify_pharmacy_suspended,
        notify_pharmacy_validated,
    )

    _VALIDATION_HANDLERS = {
        'validee': notify_pharmacy_validated,
        'refusee': notify_pharmacy_rejected,
        'suspendue': notify_pharmacy_suspended,
    }

    @receiver(pre_save, sender=Pharmacy, dispatch_uid='notif_pharmacy_pre_save')
    def _cache_pharmacy_statut(sender, instance, **kwargs):
        if not instance.pk:
            instance._prev_statut_validation = None
            return
        try:
            instance._prev_statut_validation = (
                sender.objects.values('statut_validation').get(pk=instance.pk)['statut_validation']
            )
        except sender.DoesNotExist:
            instance._prev_statut_validation = None

    @receiver(post_save, sender=Pharmacy, dispatch_uid='notif_pharmacy_post_save')
    def _on_pharmacy_saved(sender, instance, created, **kwargs):
        if created:
            return
        prev = getattr(instance, '_prev_statut_validation', None)
        if prev != instance.statut_validation:
            handler = _VALIDATION_HANDLERS.get(instance.statut_validation)
            if handler:
                handler(instance)


# ── Subscription signals ──────────────────────────────────────────────────────

def _register_subscription_signals():
    from subscriptions.models import PharmacySubscription
    from .services import notify_subscription_activated, notify_subscription_rejected

    _SUBSCRIPTION_HANDLERS = {
        PharmacySubscription.STATUS_ACTIVE: notify_subscription_activated,
        PharmacySubscription.STATUS_REJECTED: notify_subscription_rejected,
    }

    @receiver(pre_save, sender=PharmacySubscription, dispatch_uid='notif_subscription_pre_save')
    def _cache_subscription_statut(sender, instance, **kwargs):
        if not instance.pk:
            instance._prev_statut = None
            return
        try:
            instance._prev_statut = (
                sender.objects.values('statut').get(pk=instance.pk)['statut']
            )
        except sender.DoesNotExist:
            instance._prev_statut = None

    @receiver(post_save, sender=PharmacySubscription, dispatch_uid='notif_subscription_post_save')
    def _on_subscription_saved(sender, instance, created, **kwargs):
        prev = getattr(instance, '_prev_statut', None)
        if prev != instance.statut:
            handler = _SUBSCRIPTION_HANDLERS.get(instance.statut)
            if handler:
                handler(instance)


# ── Payment signals ───────────────────────────────────────────────────────────

def _register_payment_signals():
    from payments.models import Payment
    from .services import notify_pharmacist_new_payment

    @receiver(post_save, sender=Payment, dispatch_uid='notif_payment_post_save')
    def _on_payment_saved(sender, instance, created, **kwargs):
        if created:
            notify_pharmacist_new_payment(instance)


def register_all():
    """Call once from AppConfig.ready() to wire up all signal handlers."""
    _register_reservation_signals()
    _register_pharmacy_signals()
    _register_subscription_signals()
    _register_payment_signals()
