from rest_framework import permissions
from django.utils.translation import gettext_lazy as _

from .models import User

class IsAdmin(permissions.BasePermission):
    message = _("Only administrators can perform this action.")

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.ADMIN


class IsTutor(permissions.BasePermission):
    message = _("Only tutors can perform this action.")

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.TUTOR


class IsStudent(permissions.BasePermission):
    message = _("Only students can perform this action.")

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.STUDENT


class IsTutorOrAdmin(permissions.BasePermission):
    message = _("Only tutors or administrators can perform this action.")

    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == User.Role.TUTOR or 
            request.user.role == User.Role.ADMIN
        )


class IsStudentOrAdmin(permissions.BasePermission):
    message = _("Only students or administrators can perform this action.")

    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == User.Role.STUDENT or 
            request.user.role == User.Role.ADMIN
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    message = _("Only the owner or administrator can perform this action.")

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            return obj.user == request.user or request.user.role == User.Role.ADMIN
        return False


class IsBookingOwnerOrTutor(permissions.BasePermission):
    message = _("Only the booking owner, tutor or administrator can perform this action.")

    def has_object_permission(self, request, view, obj):
        return (
            obj.student.user == request.user or
            obj.slot.schedule.tutor.user == request.user or
            request.user.role == User.Role.ADMIN
        )