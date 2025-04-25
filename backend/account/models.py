from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .managers import CustomUserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model supporting email as the unique identifier
    and additional fields like role, avatar, etc.
    """
    class Role(models.TextChoices):
        STUDENT = 'student', _('Студент')
        TUTOR = 'tutor', _('Репетитор')
        ADMIN = 'admin', _('Администратор')

    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150)
    last_name = models.CharField(_('last name'), max_length=150)
    phone = models.CharField(_('phone number'), max_length=20, blank=True)
    role = models.CharField(
        _('role'), 
        max_length=20, 
        choices=Role.choices, 
        default=Role.STUDENT
    )
    avatar = models.ImageField(
        _('avatar'), 
        upload_to='avatars/%Y/%m/%d/', 
        blank=True, 
        null=True,
        help_text=_('User profile picture')
    )
    city = models.CharField(_('city'), max_length=100, blank=True)
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)

    is_active = models.BooleanField(_('active'), default=True)
    is_staff = models.BooleanField(_('staff status'), default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        """Return the full name of the user."""
        return f"{self.first_name} {self.last_name}"

    def get_short_name(self):
        """Return the short name for the user (first name only)."""
        return self.first_name