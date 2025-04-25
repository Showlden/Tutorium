from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TutorProfileViewSet, StudentProfileViewSet,
    SubjectViewSet, TimeSlotViewSet, 
    BookingViewSet, ReviewViewSet, ScheduleViewSet
)

router = DefaultRouter()
router.register(r'tutors', TutorProfileViewSet, basename='tutor-profile')
router.register(r'students', StudentProfileViewSet, basename='student-profile')
router.register(r'subjects', SubjectViewSet)
router.register(r'timeslots', TimeSlotViewSet)
router.register(r'schedules', ScheduleViewSet)
router.register(r'bookings', BookingViewSet, basename='bookings')
router.register(r'reviews', ReviewViewSet, basename='reviews')

urlpatterns = router.urls
