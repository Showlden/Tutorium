from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.core.validators import FileExtensionValidator

from .models import (
    Subject, TutorProfile, StudentProfile,
    Schedule, TimeSlot, Booking, Review
)

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']


class TutorProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    subjects = SubjectSerializer(many=True, read_only=True)
    subject_ids = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(),
        write_only=True,
        many=True,
        source='subjects',
        label=_("Subject IDs")
    )
    average_rating = serializers.FloatField(read_only=True)

    class Meta:
        model = TutorProfile
        fields = [
            'id', 'user', 'description', 'experience_years', 'price_per_hour',
            'education', 'certificates', 'is_online', 'is_offline', 
            'subjects', 'subject_ids', 'average_rating', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'average_rating']
        extra_kwargs = {
            'certificates': {
                'validators': [FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'png'])]
            }
        }


class StudentProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = StudentProfile
        fields = ['id', 'user', 'age', 'learning_goals', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class TimeSlotSerializer(serializers.ModelSerializer):
    is_available = serializers.BooleanField(
        read_only=True,
        help_text=_("Whether the slot is available for booking")
    )

    class Meta:
        model = TimeSlot
        fields = [
            'id', 'date', 'start_time', 
            'end_time', 'status', 'is_available', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'status']

    def validate(self, data):
        if 'date' in data and 'start_time' in data and 'end_time' in data:
            qs = TimeSlot.objects.filter(
                date=data['date'],
                start_time__lt=data['end_time'],
                end_time__gt=data['start_time']
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    _("This time slot overlaps with an existing one.")
                )
        return data


class ScheduleSerializer(serializers.ModelSerializer):
    tutor = serializers.PrimaryKeyRelatedField(
        queryset=TutorProfile.objects.all(),
        required=False
    )
    time_slots = TimeSlotSerializer(many=True, read_only=True)
    
    class Meta:
        model = Schedule
        fields = ['id', 'tutor', 'time_slots', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_tutor(self, value):
        if Schedule.objects.filter(tutor=value).exists():
            raise serializers.ValidationError(
                _("This tutor already has a schedule.")
            )
        return value


class BookingSerializer(serializers.ModelSerializer):
    slot = TimeSlotSerializer(read_only=True)
    slot_id = serializers.PrimaryKeyRelatedField(
        queryset=TimeSlot.objects.filter(status=TimeSlot.SlotStatus.AVAILABLE),
        write_only=True,
        source='slot'
    )

    class Meta:
        model = Booking
        fields = ['id', 'student', 'slot', 'slot_id', 'status', 'comment']
        read_only_fields = ['id', 'student', 'status']

    def validate(self, data):
        student = self.context['request'].user.student_profile
        slot = data['slot']
        
        if Booking.objects.filter(student=student, slot=slot).exists():
            raise serializers.ValidationError(
                {"slot_id": "Вы уже забронировали этот временной слот"}
            )
            
        return data


class ReviewSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField(read_only=True)
    tutor = serializers.PrimaryKeyRelatedField(
        queryset=TutorProfile.objects.all(),
        required=True
    )

    class Meta:
        model = Review
        fields = [
            'id', 'student', 'tutor', 'rating', 
            'text', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'student', 'created_at', 'updated_at']

    def validate(self, data):
        student = self.context['request'].user.student_profile
        tutor = data['tutor']
        
        if not Booking.objects.filter(
            student=student,
            slot__schedule__tutor=tutor,
            status=Booking.StatusChoices.COMPLETED
        ).exists():
            raise serializers.ValidationError(
                _("You can only review tutors you've had completed sessions with.")
            )
        return data
