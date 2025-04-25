from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()

class Subject(models.Model):
    name = models.CharField(_('name'), max_length=100, unique=True)
    description = models.TextField(_('description'), blank=True)

    class Meta:
        verbose_name = _('subject')
        verbose_name_plural = _('subjects')
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return self.name


class TutorProfile(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='tutor_profile',
        verbose_name=_('user')
    )
    subjects = models.ManyToManyField(
        Subject,
        related_name='tutors',
        verbose_name=_('subjects')
    )
    experience_years = models.PositiveIntegerField(
        _('experience years'),
        default=0,  
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    price_per_hour = models.PositiveIntegerField(
        _('price per hour'),
        default=1000,
        validators=[MinValueValidator(0)]
    )
    education = models.TextField(_('education'))
    certificates = models.FileField(
        _('certificates'),
        upload_to='certificates/%Y/%m/%d/', 
        blank=True, 
        null=True
    )
    description = models.TextField(_('description'), blank=True)
    education = models.TextField(_('education'), blank=True)
    is_online = models.BooleanField(_('online'), default=True)
    is_offline = models.BooleanField(_('offline'), default=False)
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), default=timezone.now)

    class Meta:
        verbose_name = _('tutor profile')
        verbose_name_plural = _('tutor profiles')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['price_per_hour']),
            models.Index(fields=['experience_years']),
        ]

    def __str__(self):
        return _("Tutor profile of %(email)s") % {'email': self.user.email}

    @property
    def average_rating(self):
        from django.db.models import Avg
        return self.reviews.aggregate(Avg('rating'))['rating__avg'] or 0


class StudentProfile(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='student_profile',
        verbose_name=_('user')
    )
    age = models.PositiveIntegerField(
        _('age'), 
        blank=True, 
        null=True,
        validators=[MinValueValidator(5), MaxValueValidator(120)]
    )
    learning_goals = models.TextField(_('learning goals'), blank=True)
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), default=timezone.now)

    class Meta:
        verbose_name = _('student profile')
        verbose_name_plural = _('student profiles')
        ordering = ['-created_at']

    def __str__(self):
        return _("Student profile of %(email)s") % {'email': self.user.email}


class Schedule(models.Model):
    tutor = models.OneToOneField(
        TutorProfile,
        on_delete=models.CASCADE,
        related_name='schedule',
        verbose_name=_('tutor')
    )
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), default=timezone.now)

    class Meta:
        verbose_name = _('schedule')
        verbose_name_plural = _('schedules')
        ordering = ['-created_at']

    def __str__(self):
        return _("Schedule for %(email)s") % {'email': self.tutor.user.email}


class TimeSlot(models.Model):
    class SlotStatus(models.TextChoices):
        AVAILABLE = 'available', _('Available')
        BOOKED = 'booked', _('Booked')
        UNAVAILABLE = 'unavailable', _('Unavailable')

    schedule = models.ForeignKey(
        Schedule,
        on_delete=models.CASCADE,
        related_name='time_slots',
        verbose_name=_('schedule')
    )
    date = models.DateField(_('date'))
    start_time = models.TimeField(_('start time'))
    end_time = models.TimeField(_('end time'))
    status = models.CharField(
        _('status'),
        max_length=11,
        choices=SlotStatus.choices,
        default=SlotStatus.AVAILABLE
    )
    created_at = models.DateTimeField(_('created at'), default=timezone.now)

    class Meta:
        verbose_name = _('time slot')
        verbose_name_plural = _('time slots')
        ordering = ['date', 'start_time']
        unique_together = ['schedule', 'date', 'start_time']
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_time__gt=models.F('start_time')),
                name='end_time_after_start_time'
            )
        ]

    def __str__(self):
        return _("%(date)s %(start_time)s-%(end_time)s (%(status)s)") % {
            'date': self.date,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'status': self.get_status_display()
        }

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.end_time <= self.start_time:
            raise ValidationError(_("End time must be after start time."))


class Booking(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING = 'pending', _('Pending confirmation')
        CONFIRMED = 'confirmed', _('Confirmed')
        CANCELLED = 'cancelled', _('Cancelled')
        COMPLETED = 'completed', _('Completed')

    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name=_('student')
    )
    slot = models.ForeignKey(
        TimeSlot,
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name=_('time slot')
    )
    status = models.CharField(
        _('status'),
        max_length=10,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING
    )
    comment = models.TextField(_('comment'), blank=True)
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), default=timezone.now)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'slot'],
                name='unique_booking',
                violation_error_message="Вы уже забронировали этот слот"
            )
        ]

    def __str__(self):
        return _("Booking: %(student)s -> %(slot)s") % {
            'student': self.student.user.email,
            'slot': self.slot
        }

    def save(self, *args, **kwargs):
        if self.status == self.StatusChoices.CONFIRMED:
            self.slot.status = TimeSlot.SlotStatus.BOOKED
            self.slot.save()
        elif self.status in [self.StatusChoices.CANCELLED, self.StatusChoices.COMPLETED]:
            self.slot.status = TimeSlot.SlotStatus.AVAILABLE
            self.slot.save()
        super().save(*args, **kwargs)


class Review(models.Model):
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name=_('student')
    )
    tutor = models.ForeignKey(
        TutorProfile,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name=_('tutor')
    )
    text = models.TextField(_('text'))
    rating = models.PositiveSmallIntegerField(
        _('rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), default=timezone.now)

    class Meta:
        verbose_name = _('review')
        verbose_name_plural = _('reviews')
        unique_together = ['student', 'tutor']
        ordering = ['-created_at']

    def __str__(self):
        return _("Review by %(student)s for %(tutor)s") % {
            'student': self.student.user.email,
            'tutor': self.tutor.user.email
        }

    def clean(self):
        from django.core.exceptions import ValidationError
        if not Booking.objects.filter(
            student=self.student,
            slot__schedule__tutor=self.tutor,
            status=Booking.StatusChoices.COMPLETED
        ).exists():
            raise ValidationError(
                _("You can only review tutors you've had completed sessions with.")
            )