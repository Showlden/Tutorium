"use client"

import {useAuth} from "../contexts/AuthContext.jsx"
import { useQuery } from "react-query"
import { bookingsAPI } from "../services/api.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/Card.jsx"
import { BookOpen, Star, Calendar, Clock } from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner.jsx"
import { getStatusDisplayName } from "../lib/utils.js"

const DashboardPage = () => {
  const { user } = useAuth()

  const { data: bookings, isLoading: bookingsLoading } = useQuery("bookings", bookingsAPI.getBookings, {
    select: (response) => response.data,
  })

  if (bookingsLoading) {
    return <LoadingSpinner />
  }

  const renderStudentDashboard = () => {
    const upcomingBookings = bookings?.filter((b) => b.status === "confirmed" || b.status === "pending") || []

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Добро пожаловать, {user.first_name}!</h1>
          <p className="text-muted-foreground">Управляйте своими занятиями и находите новых репетиторов</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные бронирования</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingBookings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Завершенные занятия</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings?.filter((b) => b.status === "completed").length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Мои отзывы</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ближайшие занятия</CardTitle>
            <CardDescription>Ваши предстоящие занятия с репетиторами</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <p className="text-muted-foreground">У вас нет предстоящих занятий</p>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Занятие #{booking.id}</p>
                      <p className="text-sm text-muted-foreground">Статус: {getStatusDisplayName(booking.status)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{booking.slot?.date}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.slot?.start_time} - {booking.slot?.end_time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderTutorDashboard = () => {
    const pendingBookings = bookings?.filter((b) => b.status === "pending") || []
    const confirmedBookings = bookings?.filter((b) => b.status === "confirmed") || []

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Добро пожаловать, {user.first_name}!</h1>
          <p className="text-muted-foreground">Управляйте своим расписанием и занятиями</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ожидают подтверждения</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingBookings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Подтвержденные</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedBookings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Завершенные</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings?.filter((b) => b.status === "completed").length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Рейтинг</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5.0</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Запросы на бронирование</CardTitle>
            <CardDescription>Новые запросы от студентов</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingBookings.length === 0 ? (
              <p className="text-muted-foreground">Нет новых запросов</p>
            ) : (
              <div className="space-y-4">
                {pendingBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Запрос #{booking.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.slot?.date} в {booking.slot?.start_time}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                        Подтвердить
                      </button>
                      <button className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm">
                        Отклонить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {user?.role === "student" && renderStudentDashboard()}
      {user?.role === "tutor" && renderTutorDashboard()}
    </div>
  )
}

export default DashboardPage
