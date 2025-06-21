"use client"

import { useQuery, useMutation, useQueryClient } from "react-query"
import { useAuth } from "../contexts/AuthContext.jsx"
import { useNavigate } from "react-router-dom"
import { bookingsAPI } from "../services/api.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/Card.jsx"
import Badge from "../components/Badge.jsx"
import Button from "../components/Button.jsx"
import LoadingSpinner from "../components/LoadingSpinner.jsx"
import { Calendar, Clock, MessageSquare } from "lucide-react"
import { formatDate, formatTime, getStatusDisplayName } from "../lib/utils.js"
import toast from "react-hot-toast"

const BookingsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: bookings, isLoading } = useQuery("bookings", bookingsAPI.getBookings, {
    select: (response) => response.data,
  })

  const confirmMutation = useMutation(bookingsAPI.confirmBooking, {
    onSuccess: () => {
      toast.success("Бронирование подтверждено!")
      queryClient.invalidateQueries("bookings")
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Ошибка при подтверждении")
    },
  })

  const cancelMutation = useMutation(bookingsAPI.cancelBooking, {
    onSuccess: () => {
      toast.success("Бронирование отменено!")
      queryClient.invalidateQueries("bookings")
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Ошибка при отмене")
    },
  })

  const completeMutation = useMutation(bookingsAPI.completeBooking, {
    onSuccess: () => {
      toast.success("Занятие завершено!")
      queryClient.invalidateQueries("bookings")
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Ошибка при завершении")
    },
  })

  const handleLeaveReview = (booking) => {
    // Переходим на страницу отзывов с параметрами для создания отзыва
    navigate("/reviews", {
      state: {
        createReview: true,
        tutorId: booking.tutor?.id,
        tutorName: booking.tutor?.user || "Репетитор",
        bookingId: booking.id,
      },
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case "pending":
        return "outline"
      case "confirmed":
        return "default"
      case "completed":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const renderBookingActions = (booking) => {
    if (user?.role === "tutor" && booking.status === "pending") {
      return (
        <div className="flex space-x-2">
          <Button size="sm" onClick={() => confirmMutation.mutate(booking.id)} loading={confirmMutation.isLoading}>
            Подтвердить
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => cancelMutation.mutate(booking.id)}
            loading={cancelMutation.isLoading}
          >
            Отклонить
          </Button>
        </div>
      )
    }

    if (user?.role === "tutor" && booking.status === "confirmed") {
      return (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => completeMutation.mutate(booking.id)}
          loading={completeMutation.isLoading}
        >
          Завершить
        </Button>
      )
    }

    if (booking.status === "pending" || booking.status === "confirmed") {
      return (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => cancelMutation.mutate(booking.id)}
          loading={cancelMutation.isLoading}
        >
          Отменить
        </Button>
      )
    }

    // Кнопка "Оставить отзыв" для студентов после завершенного занятия
    if (user?.role === "student" && booking.status === "completed") {
      return (
        <Button size="sm" variant="outline" onClick={() => handleLeaveReview(booking)}>
          Оставить отзыв
        </Button>
      )
    }

    return null
  }

  const groupedBookings = {
    pending: bookings?.filter((b) => b.status === "pending") || [],
    confirmed: bookings?.filter((b) => b.status === "confirmed") || [],
    completed: bookings?.filter((b) => b.status === "completed") || [],
    cancelled: bookings?.filter((b) => b.status === "cancelled") || [],
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Мои бронирования</h1>
        <p className="text-muted-foreground">
          {user?.role === "student"
            ? "Управляйте вашими занятиями с репетиторами"
            : "Управляйте запросами на занятия от студентов"}
        </p>
      </div>

      {/* Pending Bookings */}
      {groupedBookings.pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ожидают подтверждения</CardTitle>
            <CardDescription>
              {user?.role === "student"
                ? "Ваши запросы ожидают подтверждения от репетиторов"
                : "Новые запросы от студентов"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupedBookings.pending.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">Бронирование #{booking.id}</p>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(booking.slot?.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatTime(booking.slot?.start_time)} - {formatTime(booking.slot?.end_time)}
                            </span>
                          </div>
                        </div>
                        {booking.comment && (
                          <div className="flex items-center space-x-1 mt-1">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{booking.comment}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={getStatusVariant(booking.status)}>{getStatusDisplayName(booking.status)}</Badge>
                    {renderBookingActions(booking)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmed Bookings */}
      {groupedBookings.confirmed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Подтвержденные занятия</CardTitle>
            <CardDescription>Ваши предстоящие занятия</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupedBookings.confirmed.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">Занятие #{booking.id}</p>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(booking.slot?.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatTime(booking.slot?.start_time)} - {formatTime(booking.slot?.end_time)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={getStatusVariant(booking.status)}>{getStatusDisplayName(booking.status)}</Badge>
                    {renderBookingActions(booking)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Bookings */}
      {groupedBookings.completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Завершенные занятия</CardTitle>
            <CardDescription>История ваших занятий</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupedBookings.completed.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">Занятие #{booking.id}</p>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(booking.slot?.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatTime(booking.slot?.start_time)} - {formatTime(booking.slot?.end_time)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={getStatusVariant(booking.status)}>{getStatusDisplayName(booking.status)}</Badge>
                    {renderBookingActions(booking)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled Bookings */}
      {groupedBookings.cancelled.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Отмененные бронирования</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupedBookings.cancelled.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">Бронирование #{booking.id}</p>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(booking.slot?.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatTime(booking.slot?.start_time)} - {formatTime(booking.slot?.end_time)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(booking.status)}>{getStatusDisplayName(booking.status)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {bookings?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">У вас пока нет бронирований</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default BookingsPage
