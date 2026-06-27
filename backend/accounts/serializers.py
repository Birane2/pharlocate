import re

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User

MAURITANIA_PHONE_REGEX = re.compile(r'^\+222[234]\d{7}$')
LOCAL_MAURITANIA_PHONE_REGEX = re.compile(r'^[234]\d{7}$')


def normalize_phone_number(phone_number):
    value = (phone_number or '').strip().replace(' ', '')
    if LOCAL_MAURITANIA_PHONE_REGEX.match(value):
        return f'+222{value}'

    if value.startswith('222') and len(value) == 11:
        return f'+{value}'

    return value


def validate_mauritanian_phone(phone_number):
    raw = (phone_number or '').strip().replace(' ', '')

    if not raw:
        raise serializers.ValidationError('Le numéro de téléphone est obligatoire.')

    # Reject non-digit characters (allow leading + for +222 format)
    check = raw[1:] if raw.startswith('+') else raw
    if not check.isdigit():
        raise serializers.ValidationError(
            'Le numéro ne doit contenir que des chiffres.'
        )

    value = normalize_phone_number(raw)

    if MAURITANIA_PHONE_REGEX.match(value):
        return value

    # 8-digit local format but wrong first digit
    if raw.isdigit() and len(raw) == 8:
        raise serializers.ValidationError(
            'Le numéro doit commencer par 2 (Chinguitel), 3 (Mattel) ou 4 (Moov Mauritel).'
        )

    # Wrong length or any other invalid format
    raise serializers.ValidationError(
        'Le numéro doit contenir exactement 8 chiffres commençant par 2, 3 ou 4. '
        'Exemple : 22345678.'
    )


class PhoneLoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = (
            attrs.get('phone_number')
            or attrs.get('phone')
            or attrs.get('email')
            or attrs.get('username')
            or ''
        ).strip()
        password = attrs.get('password')

        user = self._get_user(identifier)
        if not user:
            raise serializers.ValidationError({
                'error': 'Numero de telephone ou mot de passe incorrect.'
            })

        if not user.check_password(password):
            raise serializers.ValidationError({
                'error': 'Numero de telephone ou mot de passe incorrect.'
            })

        attrs['user'] = user
        return attrs

    def _get_user(self, identifier):
        if not identifier:
            return None

        normalized_phone = normalize_phone_number(identifier)
        if MAURITANIA_PHONE_REGEX.match(normalized_phone):
            user = User.objects.filter(phone_number=normalized_phone).first()
            if user:
                return user

        if '@' in identifier:
            return User.objects.filter(email__iexact=identifier).first()

        return User.objects.filter(username__iexact=identifier).first()


class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=False)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True, allow_blank=False)
    phone_number = serializers.CharField(required=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=True)

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'full_name',
            'phone_number',
            'email',
            'password',
            'password_confirm',
            'role',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password': 'Les mots de passe ne correspondent pas.'
            })

        validate_password(attrs['password'])

        full_name = (attrs.get('full_name') or '').strip()
        first_name = (attrs.get('first_name') or '').strip()
        last_name = (attrs.get('last_name') or '').strip()

        if full_name and not first_name and not last_name:
            name_parts = full_name.split(maxsplit=1)
            attrs['first_name'] = name_parts[0]
            attrs['last_name'] = name_parts[1] if len(name_parts) > 1 else ''
        elif not first_name and not last_name:
            raise serializers.ValidationError({
                'full_name': 'Le nom complet est obligatoire.'
            })

        email = (attrs.get('email') or '').strip().lower()
        if not email:
            raise serializers.ValidationError({
                'email': 'L adresse e-mail est obligatoire.'
            })

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({
                'email': 'Cette adresse e-mail est deja utilisee.'
            })

        phone_number = validate_mauritanian_phone(attrs.get('phone_number'))
        if User.objects.filter(phone_number=phone_number).exists():
            raise serializers.ValidationError({
                'phone_number': 'Ce numero de telephone est deja utilise.'
            })

        attrs['phone_number'] = phone_number
        attrs['email'] = email
        return attrs

    def _build_username(self, phone_number):
        base_username = phone_number
        username = base_username
        index = 1

        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{index}"
            index += 1

        return username

    def create(self, validated_data):
        validated_data.pop('full_name', None)
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        phone_number = validated_data['phone_number']
        user = User.objects.create_user(
            username=self._build_username(phone_number),
            email=validated_data.get('email', ''),
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=phone_number,
            is_active=False,
            is_email_verified=False,
            is_phone_verified=False,
            role=validated_data.get('role', 'utilisateur'),
        )
        return user


class ResendRegisterOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        email = value.strip().lower()
        if not User.objects.filter(
            email__iexact=email,
            is_email_verified=False,
        ).exists():
            raise serializers.ValidationError(
                'Aucun compte en attente de verification ne correspond a cet e-mail.'
            )

        return email


class VerifyRegisterOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('Le code OTP doit contenir 6 chiffres.')

        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class PasswordResetVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('Le code OTP doit contenir 6 chiffres.')

        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    reset_token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.strip().lower()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Les mots de passe ne correspondent pas.'
            })

        return attrs


class AdminProfileSerializer(serializers.ModelSerializer):
    date_joined = serializers.DateTimeField(read_only=True)
    date_creation = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'first_name',
            'last_name',
            'email',
            'phone_number',
            'role',
            'is_active',
            'date_joined',
            'date_creation',
        ]
        read_only_fields = fields


class AdminProfileUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'email',
            'phone_number',
        ]

    def validate_email(self, value):
        email = value.strip().lower()
        user = self.instance

        if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('Cette adresse e-mail est deja utilisee.')

        return email

    def validate_phone_number(self, value):
        phone_number = validate_mauritanian_phone(value)
        user = self.instance

        if User.objects.filter(phone_number=phone_number).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('Ce numero de telephone est deja utilise.')

        return phone_number


class AdminPasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user

        if not user.check_password(value):
            raise serializers.ValidationError('Ancien mot de passe incorrect.')

        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Les mots de passe ne correspondent pas.'
            })

        validate_password(attrs['new_password'], self.context['request'].user)
        return attrs


# ── User-facing profile & password serializers ─────────────────────────────

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=True, min_length=1)
    last_name = serializers.CharField(required=True, min_length=1)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number']

    def validate_email(self, value):
        value = value.strip().lower()
        if value and User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError('Cette adresse e-mail est déjà utilisée.')
        return value

    def validate_phone_number(self, value):
        if not value:
            return value
        phone = validate_mauritanian_phone(value)
        if User.objects.filter(phone_number=phone).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError('Ce numéro de téléphone est déjà utilisé.')
        return phone


class UserChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Ancien mot de passe incorrect.')
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'Les mots de passe ne correspondent pas.'}
            )
        validate_password(attrs['new_password'], self.context['request'].user)
        return attrs


def _extract_email(attrs):
    """Accept both 'email' and 'identifier' fields — returns lowercased email."""
    email = (attrs.get('email') or attrs.get('identifier') or '').strip().lower()
    if not email:
        raise serializers.ValidationError({'email': 'L\'adresse e-mail est obligatoire.'})
    return email


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    identifier = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        attrs['email'] = _extract_email(attrs)
        return attrs


class VerifyResetOtpSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    identifier = serializers.CharField(required=False, allow_blank=True)
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('Le code OTP doit contenir 6 chiffres.')
        return value

    def validate(self, attrs):
        attrs['email'] = _extract_email(attrs)
        return attrs


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    identifier = serializers.CharField(required=False, allow_blank=True)
    reset_token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        attrs['email'] = _extract_email(attrs)
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'Les mots de passe ne correspondent pas.'}
            )
        return attrs
