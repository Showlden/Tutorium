from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from django.db import IntegrityError

from .models import (
    User, Subject, TutorProfile, StudentProfile,
    Schedule, TimeSlot, Booking, Review
)

from .serializers import (
    SubjectSerializer, TutorProfileSerializer, StudentProfileSerializer,
    ScheduleSerializer, TimeSlotSerializer, BookingSerializer, ReviewSerializer
)

from .permissions import (
    IsAdmin, IsTutor, IsStudent,
    IsTutorOrAdmin, IsStudentOrAdmin, 
    IsOwnerOrAdmin, IsBookingOwnerOrTutor
)

class TutorProfileViewSet(viewsets.ModelViewSet):
    queryset = TutorProfile.objects.select_related('user').prefetch_related('subjects').all()
    serializer_class = TutorProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsTutorOrAdmin]
        return super().get_permissions()

    def get_queryset(self):
        if self.request.user.role == User.Role.ADMIN:
            return TutorProfile.objects.select_related('user').all()  
        if self.request.user.role == User.Role.TUTOR:
            return self.queryset.filter(user=self.request.user)
        return self.queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='subject',
                description='Filter by subject ID',
                required=False,
                type=int
            ),
            OpenApiParameter(
                name='min_price',
                description='Filter by minimum price per hour',
                required=False,
                type=int
            ),
            OpenApiParameter(
                name='max_price',
                description='Filter by maximum price per hour',
                required=False,
                type=int
            ),
        ]
    )

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        
        subject_id = self.request.query_params.get('subject')
        if subject_id:
            queryset = queryset.filter(subjects__id=subject_id)
            
        min_price = self.request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(price_per_hour__gte=min_price)
            
        max_price = self.request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(price_per_hour__lte=max_price)
            
        return queryset


class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.select_related('user').all()
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsStudentOrAdmin]
        return super().get_permissions()

    def get_queryset(self):
        if self.request.user.role == User.Role.ADMIN:
            return StudentProfile.objects.select_related('user').all()  
        elif self.request.user.role == User.Role.STUDENT:
            return self.queryset.filter(user=self.request.user)
        return self.queryset.none()  

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.select_related('tutor__user').prefetch_related('time_slots').all()
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated, IsTutorOrAdmin]

    def get_queryset(self):
        if self.request.user.role == User.Role.TUTOR:
            return self.queryset.filter(tutor__user=self.request.user)
        return self.queryset

    def perform_create(self, serializer):
        if self.request.user.role == User.Role.TUTOR:
            tutor = get_object_or_404(TutorProfile, user=self.request.user)
            serializer.save(tutor=tutor)
        else:
            serializer.save()

    @extend_schema(
        request=TimeSlotSerializer(many=True),
        responses={201: TimeSlotSerializer(many=True)}
    )
    @action(detail=True, methods=['post'], url_path='add-time-slots')
    def add_time_slots(self, request, pk=None):
        schedule = self.get_object()
        serializer = TimeSlotSerializer(
            data=request.data,
            many=True,
            context={'schedule': schedule, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(schedule=schedule)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(responses={200: TimeSlotSerializer(many=True)})
    @action(detail=True, methods=['get'], url_path='available-slots')
    def available_slots(self, request, pk=None):
        """Get all available time slots for a schedule."""
        schedule = self.get_object()
        available_slots = schedule.time_slots.filter(
            status=TimeSlot.SlotStatus.AVAILABLE
        )
        serializer = TimeSlotSerializer(available_slots, many=True)
        return Response(serializer.data)


class TimeSlotViewSet(viewsets.ModelViewSet):
    queryset = TimeSlot.objects.select_related('schedule__tutor__user').all()
    serializer_class = TimeSlotSerializer
    permission_classes = [IsAuthenticated, IsTutorOrAdmin]

    def get_queryset(self):
        if self.request.user.role == User.Role.TUTOR:
            return self.queryset.filter(schedule__tutor__user=self.request.user)
        return self.queryset


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related(
        'student__user', 'slot__schedule__tutor__user'
    ).all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [IsBookingOwnerOrTutor]
        return super().get_permissions()

    def get_queryset(self):
        if self.request.user.role == User.Role.STUDENT:
            return self.queryset.filter(student__user=self.request.user)
        elif self.request.user.role == User.Role.TUTOR:
            return self.queryset.filter(slot__schedule__tutor__user=self.request.user)
        return self.queryset

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError as e:
            if 'unique_booking' in str(e):
                return Response(
                    {"detail": "Вы уже забронировали этот слот"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            raise
    
    def perform_create(self, serializer):
        if self.request.user.role != User.Role.STUDENT:
            raise serializers.ValidationError(
                _("Only students can create bookings.")
            )
        
        student = get_object_or_404(StudentProfile, user=self.request.user)
        time_slot = serializer.validated_data['slot']
        
        if time_slot.status != TimeSlot.SlotStatus.AVAILABLE:
            raise serializers.ValidationError(
                _("This time slot is not available for booking.")
            )
            
        time_slot.status = TimeSlot.SlotStatus.BOOKED
        time_slot.save()
        serializer.save(student=student)

    @extend_schema(
        request=None,
        responses={200: BookingSerializer}
    )
    @action(detail=True, methods=['post'], url_path='confirm')
    def confirm_booking(self, request, pk=None):
        booking = self.get_object()
        if booking.status != Booking.StatusChoices.PENDING:
            return Response(
                {'detail': _("Only pending bookings can be confirmed.")},
                status=status.HTTP_400_BAD_REQUEST
            )
        booking.status = Booking.StatusChoices.CONFIRMED
        booking.save()
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @extend_schema(
        request=None,
        responses={200: BookingSerializer}
    )
    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_booking(self, request, pk=None):
        booking = self.get_object()
        if booking.status == Booking.StatusChoices.CANCELLED:
            return Response(
                {'detail': _("Booking is already cancelled.")},
                status=status.HTTP_400_BAD_REQUEST
            )
        booking.status = Booking.StatusChoices.CANCELLED
        booking.save()
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @extend_schema(
        request=None,
        responses={200: BookingSerializer}
    )
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_booking(self, request, pk=None):
        booking = self.get_object()
        if booking.status != Booking.StatusChoices.CONFIRMED:
            return Response(
                {'detail': _("Only confirmed bookings can be completed.")},
                status=status.HTTP_400_BAD_REQUEST
            )
        booking.status = Booking.StatusChoices.COMPLETED
        booking.save()
        serializer = self.get_serializer(booking)
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related(
        'student__user', 'tutor__user'
    ).all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [IsOwnerOrAdmin]
        return super().get_permissions()

    def get_queryset(self):
        if self.request.user.role == User.Role.STUDENT:
            return self.queryset.filter(student__user=self.request.user)
        elif self.request.user.role == User.Role.TUTOR:
            return self.queryset.filter(tutor__user=self.request.user)
        return self.queryset

    def perform_create(self, serializer):
        if self.request.user.role != User.Role.STUDENT:
            raise serializers.ValidationError(
                _("Only students can create reviews.")
            )
        
        student = get_object_or_404(StudentProfile, user=self.request.user)
        tutor = serializer.validated_data['tutor']
        
        if not Booking.objects.filter(
            student=student,
            slot__schedule__tutor=tutor,
            status=Booking.StatusChoices.COMPLETED
        ).exists():
            raise serializers.ValidationError(
                _("You can only review tutors you've had completed sessions with.")
            )
            
        serializer.save(student=student)