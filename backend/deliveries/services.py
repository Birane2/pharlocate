from decimal import Decimal, ROUND_HALF_UP
from math import asin, cos, radians, sin, sqrt

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction

from .models import Delivery, DeliveryStatusHistory


DEFAULT_DELIVERY_BASE_FEE = Decimal('0.00')
DEFAULT_DELIVERY_PRICE_PER_KM = Decimal('50.00')


def can_create_delivery_for_reservation(reservation):
    return reservation.type_reservation == reservation.TYPE_DELIVERY


def get_delivery_price_per_km():
    return Decimal(
        str(getattr(settings, 'DELIVERY_PRICE_PER_KM', DEFAULT_DELIVERY_PRICE_PER_KM))
    )


def get_delivery_base_fee():
    return Decimal(
        str(getattr(settings, 'DELIVERY_BASE_FEE', DEFAULT_DELIVERY_BASE_FEE))
    )


def round_money(value):
    return Decimal(value).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def calculate_distance_km(start_latitude, start_longitude, end_latitude, end_longitude):
    if (
        start_latitude is None
        or start_longitude is None
        or end_latitude is None
        or end_longitude is None
    ):
        return Decimal('0.00')

    lat1 = radians(float(start_latitude))
    lon1 = radians(float(start_longitude))
    lat2 = radians(float(end_latitude))
    lon2 = radians(float(end_longitude))

    d_lat = lat2 - lat1
    d_lon = lon2 - lon1

    a = sin(d_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(d_lon / 2) ** 2
    c = 2 * asin(sqrt(a))
    distance = Decimal(str(6371 * c))
    return distance.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def calculate_delivery_fee(reservation, latitude=None, longitude=None):
    if latitude is None or longitude is None:
        raise ValidationError(
            'La position GPS du client est obligatoire pour calculer la livraison.'
        )

    if (
        reservation.pharmacie.latitude is None
        or reservation.pharmacie.longitude is None
    ):
        raise ValidationError(
            'La pharmacie doit configurer sa position GPS avant de proposer la livraison.'
        )

    tarif_par_km = get_delivery_price_per_km()
    distance_km = calculate_distance_km(
        reservation.pharmacie.latitude,
        reservation.pharmacie.longitude,
        latitude,
        longitude,
    )

    frais_livraison = get_delivery_base_fee() + (distance_km * tarif_par_km)
    return distance_km, tarif_par_km, round_money(frais_livraison)


@transaction.atomic
def create_delivery_for_reservation(
    reservation,
    adresse_livraison,
    telephone,
    latitude=None,
    longitude=None,
    note='',
    frais_livraison=None,
):
    if not can_create_delivery_for_reservation(reservation):
        raise ValidationError(
            'Aucune livraison ne doit etre creee pour une reservation en retrait.'
        )

    distance_km, tarif_par_km, calculated_fee = calculate_delivery_fee(
        reservation=reservation,
        latitude=latitude,
        longitude=longitude,
    )
    final_delivery_fee = calculated_fee if frais_livraison is None else frais_livraison

    delivery = Delivery(
        reservation=reservation,
        user=reservation.user,
        pharmacy=reservation.pharmacie,
        adresse_livraison=adresse_livraison,
        telephone=telephone,
        latitude=latitude,
        longitude=longitude,
        note=note,
        distance_km=distance_km,
        tarif_par_km=tarif_par_km,
        frais_livraison=final_delivery_fee,
    )
    delivery.save()

    reservation.frais_livraison = delivery.frais_livraison
    reservation.calculate_amounts()

    DeliveryStatusHistory.objects.create(
        delivery=delivery,
        ancien_statut='',
        nouveau_statut=delivery.statut,
        changed_by=None,
        commentaire='Livraison creee.',
    )
    return delivery


@transaction.atomic
def change_delivery_status(delivery, nouveau_statut, changed_by=None, commentaire=''):
    valid_statuses = {status for status, _ in Delivery.STATUT_CHOICES}
    if nouveau_statut not in valid_statuses:
        raise ValidationError('Statut de livraison invalide.')

    ancien_statut = delivery.statut
    if ancien_statut == nouveau_statut:
        raise ValidationError('La livraison possede deja ce statut.')

    transitions = {
        Delivery.STATUS_PENDING: {
            Delivery.STATUS_IN_PROGRESS,
            Delivery.STATUS_CANCELLED,
        },
        Delivery.STATUS_IN_PROGRESS: {
            Delivery.STATUS_DELIVERED,
            Delivery.STATUS_CANCELLED,
        },
        Delivery.STATUS_DELIVERED: set(),
        Delivery.STATUS_CANCELLED: set(),
    }
    if nouveau_statut not in transitions.get(ancien_statut, set()):
        raise ValidationError(
            f'Transition de livraison interdite: {ancien_statut} -> {nouveau_statut}.'
        )

    delivery.statut = nouveau_statut
    delivery.save()

    DeliveryStatusHistory.objects.create(
        delivery=delivery,
        ancien_statut=ancien_statut,
        nouveau_statut=nouveau_statut,
        changed_by=changed_by,
        commentaire=commentaire,
    )
    return delivery
