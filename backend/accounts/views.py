import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from config.permissions import IsAuthenticatedWithTokenMessage
from config.permissions import IsAdminRole

from .models import User
from .serializers import (
    AdminPasswordChangeSerializer,
    AdminProfileSerializer,
    AdminProfileUpdateSerializer,
    ForgotPasswordSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PasswordResetVerifySerializer,
    PhoneLoginSerializer,
    RegisterSerializer,
    ResendRegisterOTPSerializer,
    ResetPasswordSerializer,
    UserChangePasswordSerializer,
    UserProfileUpdateSerializer,
    VerifyRegisterOTPSerializer,
    VerifyResetOtpSerializer,
)
from .services.otp_service import (
    OTPDeliveryError,
    OTP_EXPIRATION_MINUTES,
    OTPRateLimitError,
    OTPVerificationError,
    send_otp,
    verify_otp,
)
from .services.password_reset_service import (
    PasswordResetConfirmError,
    PasswordResetDeliveryError,
    PasswordResetRateLimitError,
    PasswordResetVerificationError,
    confirm_password_reset,
    request_password_reset,
    verify_password_reset_otp,
)

PASSWORD_RESET_NEUTRAL_MESSAGE = (
    'Si un compte existe avec cet e-mail, un code de reinitialisation a ete envoye.'
)
logger = logging.getLogger(__name__)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PhoneLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        if not user.is_active or not user.is_email_verified:
            return Response(
                {
                    'error': (
                        'Veuillez verifier votre compte avec le code OTP envoye par e-mail.'
                    ),
                    'requires_verification': True,
                    'email': user.email,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(build_auth_payload(user))


class AdminProfileView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def get(self, request):
        return Response(AdminProfileSerializer(request.user).data)

    def put(self, request):
        serializer = AdminProfileUpdateSerializer(
            request.user,
            data=request.data,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AdminProfileSerializer(request.user).data)

    def patch(self, request):
        serializer = AdminProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AdminProfileSerializer(request.user).data)


class AdminPasswordChangeView(APIView):
    permission_classes = [IsAuthenticatedWithTokenMessage, IsAdminRole]

    def post(self, request):
        serializer = AdminPasswordChangeSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password'])

        return Response({
            'message': 'Mot de passe modifie avec succes.'
        })


def _has_pharmacy(user):
    try:
        _ = user.pharmacy
        return True
    except Exception:
        return False


def _profile_data(user):
    data = {
        'id': user.id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': user.get_full_name(),
        'phone_number': user.phone_number,
        'is_active': user.is_active,
        'is_email_verified': user.is_email_verified,
        'is_phone_verified': user.is_phone_verified,
        'email': user.email,
        'role': user.role,
    }
    if user.role == 'pharmacien':
        data['has_pharmacy'] = _has_pharmacy(user)
    return data


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticatedWithTokenMessage])
def profile_view(request):
    user = request.user
    if request.method == 'GET':
        return Response(_profile_data(user))

    serializer = UserProfileUpdateSerializer(
        user,
        data=request.data,
        partial=request.method == 'PATCH',
        context={'request': request},
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    user.refresh_from_db()
    return Response(_profile_data(user))


@api_view(['GET'])
@permission_classes([AllowAny])
def test_api(request):
    return Response({
        'message': 'API PharmaLocate fonctionne bien'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = None
        try:
            with transaction.atomic():
                user = serializer.save()
                logger.info('Utilisateur cree pendant inscription: %s', user.id)
                send_otp(user)
        except OTPRateLimitError as exc:
            return Response(
                {'error': str(exc)},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        except OTPDeliveryError as exc:
            if user and user.pk:
                User.objects.filter(pk=user.pk).delete()
            return Response(
                {'error': str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({
            'message': 'Compte cree. Un code OTP a ete envoye par e-mail.',
            'email': user.email,
            'requires_verification': True,
            'is_phone_verified': user.is_phone_verified,
        }, status=status.HTTP_201_CREATED)
    logger.info('Erreurs serializer inscription : %s', serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def build_auth_payload(user):
    refresh = RefreshToken.for_user(user)

    user_data = {
        'id': user.id,
        'full_name': user.get_full_name(),
        'first_name': user.first_name,
        'last_name': user.last_name,
        'phone_number': user.phone_number,
        'email': user.email,
        'role': user.role,
        'is_active': user.is_active,
        'is_email_verified': user.is_email_verified,
        'is_phone_verified': user.is_phone_verified,
    }
    if user.role == 'pharmacien':
        user_data['has_pharmacy'] = _has_pharmacy(user)

    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': user_data,
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_register_otp_view(request):
    serializer = ResendRegisterOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = User.objects.filter(
        email__iexact=serializer.validated_data['email'],
        is_email_verified=False,
    ).order_by('-date_creation', '-id').first()

    if not user:
        return Response(
            {
                'error': (
                    'Aucun compte en attente de verification ne correspond '
                    'a cet e-mail.'
                )
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        send_otp(user)
    except OTPRateLimitError as exc:
        return Response(
            {'error': str(exc)},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
    except OTPDeliveryError as exc:
        return Response(
            {'error': str(exc)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response({
        'message': 'Un nouveau code OTP a ete envoye par e-mail.',
        'expires_in': OTP_EXPIRATION_MINUTES * 60,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_register_otp_view(request):
    serializer = VerifyRegisterOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email']
    otp = serializer.validated_data['otp']

    try:
        user = verify_otp(email, otp)
    except OTPVerificationError as exc:
        return Response(
            {'error': str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = build_auth_payload(user)
    data['message'] = 'Compte verifie avec succes.'
    return Response({
        'message': 'Compte verifie avec succes.',
        **data,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request_view(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        request_password_reset(serializer.validated_data['email'])
    except PasswordResetRateLimitError:
        return Response(
            {'error': 'Trop de demandes de reinitialisation. Reessayez plus tard.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
    except PasswordResetDeliveryError as exc:
        return Response(
            {'error': str(exc)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response({'message': PASSWORD_RESET_NEUTRAL_MESSAGE})


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_verify_view(request):
    serializer = PasswordResetVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        reset_otp = verify_password_reset_otp(
            serializer.validated_data['email'],
            serializer.validated_data['otp'],
        )
    except PasswordResetVerificationError as exc:
        return Response(
            {'error': str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({
        'message': 'Code verifie avec succes.',
        'reset_token': reset_otp.reset_token,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm_view(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        confirm_password_reset(
            serializer.validated_data['email'],
            serializer.validated_data['reset_token'],
            serializer.validated_data['new_password'],
        )
    except DjangoValidationError as exc:
        return Response(
            {'new_password': list(exc.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except PasswordResetConfirmError as exc:
        return Response(
            {'error': str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({
        'message': 'Mot de passe reinitialise avec succes.'
    })


# ── Mobile-facing auth endpoints ───────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    """POST /api/auth/forgot-password/  body: {email}"""
    serializer = ForgotPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email']

    # Always return neutral message — never reveal whether account exists
    try:
        request_password_reset(email)
    except PasswordResetRateLimitError:
        return Response(
            {'error': 'Trop de demandes de reinitialisation. Reessayez plus tard.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
    except PasswordResetDeliveryError as exc:
        return Response(
            {'error': str(exc)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response({
        'message': 'Si un compte existe avec cet e-mail, un code OTP a été envoyé.',
        'email': email,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_otp_view(request):
    """POST /api/auth/verify-reset-otp/  body: {email, otp}"""
    serializer = VerifyResetOtpSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email']
    otp = serializer.validated_data['otp']

    try:
        reset_otp = verify_password_reset_otp(email, otp)
    except PasswordResetVerificationError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'message': 'Code vérifié avec succès.',
        'reset_token': reset_otp.reset_token,
        'email': email,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request):
    """POST /api/auth/reset-password/  body: {email, reset_token, new_password, confirm_password}"""
    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email']
    reset_token = serializer.validated_data['reset_token']
    new_password = serializer.validated_data['new_password']

    try:
        confirm_password_reset(email, reset_token, new_password)
    except DjangoValidationError as exc:
        return Response(
            {'new_password': list(exc.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except PasswordResetConfirmError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'message': 'Mot de passe réinitialisé avec succès.'})


@api_view(['POST'])
@permission_classes([IsAuthenticatedWithTokenMessage])
def change_password_view(request):
    """POST /api/auth/change-password/  body: {old_password, new_password, confirm_password}"""
    serializer = UserChangePasswordSerializer(
        data=request.data,
        context={'request': request},
    )
    serializer.is_valid(raise_exception=True)

    request.user.set_password(serializer.validated_data['new_password'])
    request.user.save(update_fields=['password'])

    return Response({'message': 'Mot de passe modifié avec succès.'})
