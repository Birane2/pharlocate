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


class IsSubscriptionOwnerPharmacistOrAdmin(BasePermission):
    message = "Vous n'avez pas acces a cet abonnement."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'is_active', True)
        )

    def has_object_permission(self, request, view, obj):
        if is_admin_user(request.user):
            return True
        return (
            getattr(request.user, 'role', None) == 'pharmacien'
            and obj.pharmacy.user_id == request.user.id
        )
