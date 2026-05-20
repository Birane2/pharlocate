from rest_framework.permissions import BasePermission, IsAuthenticated


class IsAuthenticatedWithTokenMessage(IsAuthenticated):
    message = (
        "Vous devez etre connecte. Envoyez le token access dans le header: "
        "Authorization: Bearer <access_token>."
    )

    def has_permission(self, request, view):
        is_allowed = super().has_permission(request, view)
        if not is_allowed:
            return False

        if not getattr(request.user, "is_active", True):
            self.message = "Votre compte est suspendu. Contactez un administrateur."
            return False

        return True


class IsPharmacien(BasePermission):
    message = "Seuls les pharmaciens peuvent acceder a cette ressource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "is_active", True)
            and getattr(request.user, "role", None) == "pharmacien"
        )


class IsAdminRole(BasePermission):
    message = "Seuls les administrateurs peuvent acceder a cette ressource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "is_active", True)
            and getattr(request.user, "role", None) == "admin"
        )
