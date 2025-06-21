"use client"

import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { tutorsAPI, scheduleAPI, bookingsAPI } from "../services/api.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/Card.jsx"
import Badge from "../components/Badge.jsx"
import Button from "../components/Button.jsx"
import LoadingSpinner from "../components/LoadingSpinner.jsx"
import { Star, Clock, DollarSign, Calendar } from "lucide-react"
import { formatPrice, formatDate, formatTime, getStatusDisplayName } from "../lib/utils.js"
import toast from "react-hot-toast"

const TutorDetailPage = () => {
  const { id } = useParams()
  const [selectedSlot, setSelectedSlot] = useState(null)
  const queryClient = useQueryClient()

  const { data: tutor, isLoading } = useQuery(["tutor", id], () => tutorsAPI.getTutor(id), {
    select: (response) => response.data,
  })

  // Получаем все расписания
  const { data: schedules } = useQuery(["schedules"], () => scheduleAPI.getSchedules(), {
    select: (response) => response.data,
  })

  // Находим расписание текущего репетитора
  const tutorSchedule = schedules?.find((schedule) => {
    // Предполагаем, что в расписании есть поле tutor или user, которое связывает с репетитором
    return (
      schedule.tutor === Number.parseInt(id) ||
      schedule.tutor_id === Number.parseInt(id) ||
      schedule.user === tutor?.user ||
      schedule.owner === Number.parseInt(id)
    )
  })

  // Получаем доступные слоты для расписания репетитора
  const { data: availableSlots, isLoading: slotsLoading } = useQuery(
    ["available-slots", tutorSchedule?.id],
    () => scheduleAPI.getAvailableSlots(tutorSchedule.id),
    {
      enabled: !!tutorSchedule?.id,
      select: (response) => response.data,
      onError: (error) => {
        console.error("Error fetching available slots:", error)
      },
    },
  )

  const bookingMutation = useMutation(bookingsAPI.createBooking, {
    onSuccess: () => {
      toast.success("Бронирование создано успешно!")
      queryClient.invalidateQueries(["available-slots"])
      setSelectedSlot(null)
    },
    onError: (error) => {
      const message = error.response?.data?.detail || "Ошибка при создании бронирования"
      toast.error(message)
    },
  })

  const handleBookSlot = () => {
    if (!selectedSlot) return

    bookingMutation.mutate({
      slot_id: selectedSlot.id,
      comment: "",
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!tutor) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Репетитор не найден</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tutor Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-2xl font-semibold">
                {tutor.user?.first_name?.[0] || tutor.user?.charAt(0)}
                {tutor.user?.last_name?.[0] || ""}
              </span>
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{tutor.user}</CardTitle>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{tutor.average_rating?.toFixed(1) || "5.0"}</span>
                  <span className="text-muted-foreground">(0 отзывов)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{tutor.experience_years} лет опыта</span>
                </div>
              </div>
              <div className="flex items-center space-x-1 mt-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="text-xl font-bold">{formatPrice(tutor.price_per_hour)}</span>
                <span className="text-muted-foreground">за час</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Предметы</h3>
            <div className="flex flex-wrap gap-2">
              {tutor.subjects?.map((subject) => (
                <Badge key={subject.id} variant="secondary">
                  {subject.name}
                </Badge>
              ))}
            </div>
          </div>

          {tutor.description && (
            <div>
              <h3 className="font-semibold mb-2">О репетиторе</h3>
              <p className="text-muted-foreground">{tutor.description}</p>
            </div>
          )}

          {tutor.education && (
            <div>
              <h3 className="font-semibold mb-2">Образование</h3>
              <p className="text-muted-foreground">{tutor.education}</p>
            </div>
          )}

          <div className="flex space-x-4">
            {tutor.is_online && <Badge variant="outline">Онлайн занятия</Badge>}
            {tutor.is_offline && <Badge variant="outline">Очные занятия</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Available Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle>Доступное время</CardTitle>
          <CardDescription>Выберите удобное время для занятия</CardDescription>
        </CardHeader>
        <CardContent>
          {!tutorSchedule ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Репетитор еще не создал расписание</p>
            </div>
          ) : slotsLoading ? (
            <LoadingSpinner size="sm" />
          ) : !availableSlots || availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Нет доступных временных слотов</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSlot?.id === slot.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatDate(slot.date)}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </span>
                    </div>
                    <Badge variant={slot.status === "available" ? "secondary" : "outline"} className="mt-2">
                      {getStatusDisplayName(slot.status)}
                    </Badge>
                  </div>
                ))}
              </div>

              {selectedSlot && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Выбранное время:</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedSlot.date)} в {formatTime(selectedSlot.start_time)} -{" "}
                      {formatTime(selectedSlot.end_time)}
                    </p>
                  </div>
                  <Button onClick={handleBookSlot} loading={bookingMutation.isLoading}>
                    Забронировать
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TutorDetailPage
