from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None and response.data.get('detail') == 'Authentication credentials were not provided.':
        response.data['detail'] = (
            "Vous devez etre connecte. Dans Postman, utilisez le token access "
            "dans Authorization > Bearer Token, ou ajoutez le header "
            "Authorization: Bearer <access_token>."
        )

    return response
