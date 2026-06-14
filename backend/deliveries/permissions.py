from rest_framework.permissions import BasePermission


def is_admin_user(user):
    return bool(
        user
        and user.is_authenticated
        and (
            user.is_staff
            or user.is_superuser
            or getattr(user, 'role', None) == 'admin'
        )
    )


class IsAdminOrDeliveryOwnerOrPharmacist(BasePermission):
    message = "Vous n'avez pas acces a cette livraison."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'is_active', True)
        )

    def has_object_permission(self, request, view, obj):
        user = request.user

        if is_admin_user(user):
            return True

        if obj.user_id == user.id:
            return True

        return getattr(user, 'role', None) == 'pharmacien' and obj.pharmacy.user_id == user.id


class IsDeliveryOwnerOrPharmacyStaff(IsAdminOrDeliveryOwnerOrPharmacist):
    """
    Alias conserve pour compatibilite avec l'etape 2.
    """
