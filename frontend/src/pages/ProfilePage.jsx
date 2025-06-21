"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { useForm } from "react-hook-form"
import { useAuth } from "../contexts/AuthContext.jsx"
import { tutorsAPI, studentsAPI, subjectsAPI } from "../services/api.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/Card.jsx"
import Button from "../components/Button.jsx"
import Input from "../components/Input.jsx"
import LoadingSpinner from "../components/LoadingSpinner.jsx"
import { User, Edit, Save, X } from "lucide-react"
import toast from "react-hot-toast"

const ProfilePage = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm()

  // Get profile data based on user role
  const { data: profile, isLoading } = useQuery(
    ["profile", user?.role, user?.id],
    async () => {
      if (user?.role === "tutor") {
        const response = await tutorsAPI.getTutors()
        return response.data.find((tutor) => tutor.user === user.email)
      } else if (user?.role === "student") {
        const response = await studentsAPI.getStudentProfiles()
        return response.data.find((student) => student.user === user.email)
      }
      return null
    },
    {
      enabled: !!user,
      onSuccess: (data) => {
        if (data) {
          Object.keys(data).forEach((key) => {
            setValue(key, data[key])
          })
        }
      },
    },
  )

  const { data: subjects } = useQuery("subjects", subjectsAPI.getSubjects, {
    select: (response) => response.data,
    enabled: user?.role === "tutor",
  })

  const updateMutation = useMutation(
    (data) => {
      if (user?.role === "tutor" && profile?.id) {
        return tutorsAPI.updateTutorProfile(profile.id, data)
      } else if (user?.role === "student" && profile?.id) {
        return studentsAPI.updateStudentProfile(profile.id, data)
      }
      if (user?.role === "tutor") {
        return tutorsAPI.createTutorProfile(data)
      } else if (user?.role === "student") {
        return studentsAPI.createStudentProfile(data)
      }
    },
    {
      onSuccess: () => {
        toast.success("Профиль обновлен успешно!")
        setIsEditing(false)
        queryClient.invalidateQueries(["profile"])
      },
      onError: (error) => {
        const message = error.response?.data?.detail || "Ошибка при обновлении профиля"
        toast.error(message)
      },
    },
  )

  const handleEdit = () => {
    setIsEditing(true)
    if (profile) {
      Object.keys(profile).forEach((key) => {
        setValue(key, profile[key])
      })
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (profile) {
      Object.keys(profile).forEach((key) => {
        setValue(key, profile[key])
      })
    }
  }

  const onSubmit = (data) => {
    console.log("Form submitted with data:", data)
    if (user?.role === "tutor" && data.subjects) {
      data.subject_ids = data.subjects
      delete data.subjects
    }
    updateMutation.mutate(data)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const renderTutorProfile = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Профиль репетитора</CardTitle>
              <CardDescription>Управляйте информацией о вашем профиле</CardDescription>
            </div>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSubmit(onSubmit)} size="sm" loading={updateMutation.isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    Сохранить
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Отмена
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Редактировать
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Опыт работы (лет)</label>
              <Input
                type="number"
                disabled={!isEditing}
                {...register("experience_years", {
                  required: "Опыт работы обязателен",
                  min: { value: 0, message: "Опыт не может быть отрицательным" },
                })}
              />
              {errors.experience_years && <p className="text-sm text-destructive">{errors.experience_years.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Цена за час (₽)</label>
              <Input
                type="number"
                disabled={!isEditing}
                {...register("price_per_hour", {
                  required: "Цена обязательна",
                  min: { value: 1, message: "Цена должна быть больше 0" },
                })}
              />
              {errors.price_per_hour && <p className="text-sm text-destructive">{errors.price_per_hour.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Предметы</label>
            <select
              multiple
              disabled={!isEditing}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("subjects")}
            >
              {subjects?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Описание</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isEditing}
              {...register("description")}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Образование</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isEditing}
              {...register("education")}
            />
          </div>

          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input type="checkbox" disabled={!isEditing} {...register("is_online")} />
              <span className="text-sm">Онлайн занятия</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" disabled={!isEditing} {...register("is_offline")} />
              <span className="text-sm">Очные занятия</span>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderStudentProfile = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Профиль студента</CardTitle>
              <CardDescription>Управляйте информацией о вашем профиле</CardDescription>
            </div>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSubmit(onSubmit)} size="sm" loading={updateMutation.isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    Сохранить
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Отмена
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Редактировать
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Возраст</label>
            <Input
              type="number"
              disabled={!isEditing}
              {...register("age", {
                min: { value: 5, message: "Возраст должен быть больше 5" },
                max: { value: 120, message: "Возраст должен быть меньше 120" },
              })}
            />
            {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Цели обучения</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isEditing}
              placeholder="Опишите ваши цели обучения..."
              {...register("learning_goals")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Профиль</h1>
        <p className="text-muted-foreground">Управляйте настройками вашего профиля</p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user?.full_name}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {user?.role === "student" ? "Студент" : user?.role === "tutor" ? "Репетитор" : user?.role}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-specific profile */}
      {user?.role === "tutor" && renderTutorProfile()}
      {user?.role === "student" && renderStudentProfile()}

      {!profile && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {user?.role === "tutor"
                ? "У вас пока нет профиля репетитора. Создайте его, чтобы начать принимать студентов."
                : "У вас пока нет профиля студента. Создайте его для поиска репетиторов."}
            </p>
            <Button onClick={() => setIsEditing(true)}>Создать профиль</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ProfilePage
