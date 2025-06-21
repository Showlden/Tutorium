"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { useForm } from "react-hook-form"
import { useAuth } from "../contexts/AuthContext.jsx"
import { scheduleAPI } from "../services/api.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/Card.jsx"
import Badge from "../components/Badge.jsx"
import Button from "../components/Button.jsx"
import Input from "../components/Input.jsx"
import { Calendar, Clock, Plus } from "lucide-react"
import { formatDate, formatTime, getStatusDisplayName } from "../lib/utils.js"
import toast from "react-hot-toast"

const SchedulePage = () => {
  const { user } = useAuth()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSlots, setEditingSlots] = useState([])
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const { data: schedules, isLoading } = useQuery("schedules", scheduleAPI.getSchedules, {
    select: (response) => response.data,
  })

  const createScheduleMutation = useMutation(scheduleAPI.createSchedule, {
    onSuccess: () => {
      toast.success("Расписание создано!")
      queryClient.invalidateQueries("schedules")
    },
    onError: (error) => {
      const message = error.response?.data?.detail || "Ошибка при создании расписания"
      toast.error(message)
    },
  })

  const addSlotsMutation = useMutation(({ scheduleId, slots }) => scheduleAPI.addTimeSlots(scheduleId, slots), {
    onSuccess: () => {
      toast.success("Временные слоты добавлены!")
      queryClient.invalidateQueries("schedules")
      setShowCreateForm(false)
      reset()
    },
    onError: (error) => {
      const message = error.response?.data?.detail || "Ошибка при добавлении слотов"
      toast.error(message)
    },
  })

  const currentSchedule = schedules?.[0] // Assuming one schedule per tutor

  const onSubmit = (data) => {
    if (!currentSchedule) {
      toast.error("Сначала создайте расписание")
      return
    }

    // Create array of time slots
    const slots = [
      {
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
      },
    ]

    addSlotsMutation.mutate({
      scheduleId: currentSchedule.id,
      slots,
    })
  }

  const handleCancelEdit = () => {
    setShowCreateForm(false)
    reset()
  }

  const createScheduleIfNeeded = () => {
    if (!currentSchedule) {
      createScheduleMutation.mutate({})
    }
  }

  if (user?.role !== "tutor") {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Доступ запрещен</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case "available":
        return "secondary"
      case "booked":
        return "default"
      case "unavailable":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Мое расписание</h1>
          <p className="text-muted-foreground">Управляйте своим расписанием и доступностью</p>
        </div>
        <div className="flex space-x-2">
          {!currentSchedule && (
            <Button onClick={createScheduleIfNeeded} loading={createScheduleMutation.isLoading}>
              Создать расписание
            </Button>
          )}
          {currentSchedule && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить слот
            </Button>
          )}
        </div>
      </div>

      {!currentSchedule ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">У вас пока нет расписания</p>
            <Button onClick={createScheduleIfNeeded} loading={createScheduleMutation.isLoading}>
              Создать расписание
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Create Time Slot Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Добавить временной слот</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Дата</label>
                    <Input type="date" {...register("date", { required: "Дата обязательна" })} />
                    {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Время начала</label>
                      <Input type="time" {...register("start_time", { required: "Время начала обязательно" })} />
                      {errors.start_time && <p className="text-sm text-destructive">{errors.start_time.message}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-medium">Время окончания</label>
                      <Input type="time" {...register("end_time", { required: "Время окончания обязательно" })} />
                      {errors.end_time && <p className="text-sm text-destructive">{errors.end_time.message}</p>}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" loading={addSlotsMutation.isLoading}>
                      Создать
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Отмена
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Time Slots List */}
          <Card>
            <CardHeader>
              <CardTitle>Временные слоты</CardTitle>
              <CardDescription>Ваши доступные временные слоты</CardDescription>
            </CardHeader>
            <CardContent>
              {!currentSchedule.time_slots || currentSchedule.time_slots.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">У вас пока нет временных слотов</p>
              ) : (
                <div className="space-y-4">
                  {currentSchedule.time_slots
                    .sort((a, b) => new Date(a.date + " " + a.start_time) - new Date(b.date + " " + b.start_time))
                    .map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{formatDate(slot.date)}</span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <Badge variant={getStatusVariant(slot.status)}>{getStatusDisplayName(slot.status)}</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default SchedulePage
