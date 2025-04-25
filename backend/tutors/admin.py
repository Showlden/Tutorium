from django.contrib import admin
from .models import TutorProfile, StudentProfile, Subject, Schedule, TimeSlot, Booking, Review


@admin.register(TutorProfile)
class TutorProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'experience_years', 'price_per_hour', 'is_online', 'is_offline')
    search_fields = ('user__email',)
    list_filter = ('is_online', 'is_offline')

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'age')
    search_fields = ('user__email',)

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ('id', 'tutor')
    search_fields = ('tutor__user__email',)

@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ('id', 'schedule', 'date', 'start_time', 'end_time', 'status')
    list_filter = ('status', 'date')
    search_fields = ('schedule__tutor__user__email',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'slot', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('student__user__email', 'timeslot__schedule__tutor__user__email')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'tutor', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('student__user__email', 'tutor__user__email')
