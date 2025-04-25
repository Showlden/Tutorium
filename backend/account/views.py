from rest_framework import generics, permissions
from rest_framework.response import Response
from drf_spectacular.openapi import AutoSchema

from .serializers import RegisterSerializer, LoginSerializer


class RegisterView(generics.CreateAPIView):
    schema = AutoSchema()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    schema = AutoSchema()

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)