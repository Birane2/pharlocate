from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from invoices.models import Invoice
from payments.models import Payment
from transactions.models import Transaction

from .models import Refund, RefundStatusHistory


def _get_payment_transaction(payment):
    transaction_obj = payment.transactions.filter(
        type_transaction=Transaction.TYPE_PAYMENT,
    ).first()
    if not transaction_obj:
        raise ValidationError('Aucune transaction de paiement validee trouvee.')
    return transaction_obj


def _get_invoice(payment):
    try:
        return payment.invoice
    except Invoice.DoesNotExist as exc:
        raise ValidationError('Aucune facture associee a ce paiement.') from exc


def _add_history(refund, old_status, new_status, changed_by=None, commentaire=''):
    RefundStatusHistory.objects.create(
        refund=refund,
        ancien_statut=old_status or '',
        nouveau_statut=new_status,
        changed_by=changed_by,
        commentaire=commentaire,
    )


@transaction.atomic
def create_refund_request(payment, user, montant_demande, motif):
    if payment.statut != Payment.STATUS_VALIDATED:
        raise ValidationError('Seuls les paiements valides peuvent etre rembourses.')

    if payment.user_id != user.id:
        raise ValidationError('Vous ne pouvez demander un remboursement que pour vos paiements.')

    if hasattr(payment, 'refund'):
        raise ValidationError('Ce paiement possede deja une demande de remboursement.')

    montant_demande = Decimal(str(montant_demande))
    if montant_demande <= 0 or montant_demande > payment.montant_total:
        raise ValidationError('Le montant demande doit etre compris entre 0 et le montant paye.')

    refund = Refund.objects.create(
        payment=payment,
        transaction=_get_payment_transaction(payment),
        invoice=_get_invoice(payment),
        reservation=payment.reservation,
        user=payment.user,
        pharmacy=payment.pharmacy,
        montant_demande=montant_demande,
        motif=motif,
        statut=Refund.STATUS_REQUESTED,
    )
    _add_history(refund, '', Refund.STATUS_REQUESTED, user, 'Demande de remboursement creee.')
    return refund


@transaction.atomic
def approve_refund(refund, approved_by, montant_approuve=None, commentaire_admin=''):
    if refund.statut in {Refund.STATUS_REJECTED, Refund.STATUS_EXECUTED}:
        raise ValidationError('Ce remboursement ne peut plus etre approuve.')

    montant = refund.montant_demande if montant_approuve is None else Decimal(str(montant_approuve))
    if montant <= 0 or montant > refund.payment.montant_total:
        raise ValidationError('Le montant approuve doit etre compris entre 0 et le montant paye.')

    old_status = refund.statut
    refund.statut = Refund.STATUS_APPROVED
    refund.montant_approuve = montant
    refund.commentaire_admin = commentaire_admin or refund.commentaire_admin
    refund.traite_par = approved_by
    refund.date_validation = timezone.now()
    refund.save()
    _add_history(refund, old_status, refund.statut, approved_by, commentaire_admin)
    return refund


@transaction.atomic
def reject_refund(refund, rejected_by, commentaire_admin):
    if not (commentaire_admin or '').strip():
        raise ValidationError('Le commentaire de refus est obligatoire.')

    if refund.statut == Refund.STATUS_EXECUTED:
        raise ValidationError('Impossible de refuser un remboursement deja effectue.')

    old_status = refund.statut
    refund.statut = Refund.STATUS_REJECTED
    refund.commentaire_admin = commentaire_admin.strip()
    refund.traite_par = rejected_by
    refund.date_validation = timezone.now()
    refund.save()
    _add_history(refund, old_status, refund.statut, rejected_by, commentaire_admin)
    return refund


@transaction.atomic
def execute_refund(refund, executed_by):
    if refund.statut != Refund.STATUS_APPROVED:
        raise ValidationError('Seul un remboursement approuve peut etre execute.')

    if refund.refund_transaction_id:
        raise ValidationError('Ce remboursement a deja ete execute.')

    refund_transaction = Transaction.objects.create(
        payment=refund.payment,
        reservation=refund.reservation,
        user=refund.user,
        pharmacy=refund.pharmacy,
        type_transaction=Transaction.TYPE_REFUND,
        montant_brut=refund.montant_approuve,
        commission=Decimal('0.00'),
        montant_pharmacie=refund.montant_approuve,
        description=f'Remboursement execute pour le paiement #{refund.payment_id}.',
        created_by=executed_by,
    )

    old_status = refund.statut
    refund.statut = Refund.STATUS_EXECUTED
    refund.refund_transaction = refund_transaction
    refund.traite_par = executed_by
    refund.date_remboursement = timezone.now()
    refund.save()

    refund.payment.statut = Payment.STATUS_REFUNDED
    refund.payment.save(update_fields=['statut', 'date_validation'])

    refund.invoice.statut = Invoice.STATUS_REFUNDED
    refund.invoice.save(update_fields=['statut'])

    _add_history(refund, old_status, refund.statut, executed_by, 'Remboursement execute.')
    return refund
