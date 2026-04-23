from rest_framework.permissions import IsAuthenticated


class IsAuthenticatedWithTokenMessage(IsAuthenticated):
    message = (
        "Vous devez etre connecte. Envoyez le token access dans le header: "
        "Authorization: Bearer <access_token>."
    )
