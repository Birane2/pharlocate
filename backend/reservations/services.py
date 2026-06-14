from decimal import Decimal


def calculate_reservation_amount(reservation):
    montant_medicaments = Decimal('0.00')

    for item in reservation.items.all():
        montant_medicaments += item.sous_total

    reservation.montant_medicaments = montant_medicaments

    frais_livraison = reservation.frais_livraison or Decimal('0.00')

    reservation.montant_total = montant_medicaments + frais_livraison
    reservation.save()

    return reservation.montant_total