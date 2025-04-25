from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.translation import gettext_lazy as _

from tutors.models import StudentProfile, TutorProfile
from .models import User


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'avatar', 'city', 'phone', 'date_joined'
        ]
        read_only_fields = ['id', 'role', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8,
        max_length=128,
        label=_("Password"),
        help_text=_("Password must be at least 8 characters long.")
    )
    password_confirmation = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label=_("Password Confirmation")
    )

    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirmation',
            'first_name', 'last_name', 'role'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError(
                {"password_confirmation": _("Passwords do not match.")}
            )
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirmation')
        user = User.objects.create_user(**validated_data)
        
        if user.role == User.Role.STUDENT:
            StudentProfile.objects.create(user=user)
        elif user.role == User.Role.TUTOR:
            TutorProfile.objects.create(user=user)
            
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True, label=_("Email"))
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label=_("Password")
    )

    def validate(self, data):
        from django.contrib.auth import authenticate
        user = authenticate(email=data['email'], password=data['password'])
        
        if not user:
            raise serializers.ValidationError(
                {"email": _("Invalid email or password.")}
            )
        if not user.is_active:
            raise serializers.ValidationError(
                {"email": _("User account is disabled.")}
            )
            
        refresh = RefreshToken.for_user(user)
        return {
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }