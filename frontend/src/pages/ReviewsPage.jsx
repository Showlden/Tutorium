"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { useForm } from "react-hook-form"
import { useAuth } from "../contexts/AuthContext.jsx"
import { useLocation } from "react-router-dom"
import { reviewsAPI, tutorsAPI } from "../services/api.js"
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card.jsx"
import Button from "../components/Button.jsx"
import LoadingSpinner from "../components/LoadingSpinner.jsx"
import { Star, User, Plus, Edit, Trash2 } from "lucide-react"
import { formatDate } from "../lib/utils.js"
import toast from "react-hot-toast"

const ReviewsPage = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      tutor: "",
      rating: 5,
      text: "",
    },
  })

  const watchedRating = watch("rating", 5)
  const watchedTutor = watch("tutor", "")

  // Проверяем, пришли ли мы сюда для создания отзыва
  useEffect(() => {
    if (location.state?.createReview) {
      setShowCreateForm(true)
      reset({
        tutor: location.state.tutorId.toString(),
        rating: 5,
        text: "",
      })
      // Очищаем state после использования
      window.history.replaceState({}, document.title)
    }
  }, [location.state, reset])

  const { data: reviews, isLoading } = useQuery("reviews", reviewsAPI.getReviews, {
    select: (response) => response.data,
  })

  // Добавьте это после useQuery для reviews
  useEffect(() => {
    if (reviews && reviews.length > 0) {
      console.log("=== REVIEWS DATA STRUCTURE ===")
      console.log("First review:", reviews[0])
      console.log("First review tutor:", reviews[0].tutor)
      console.log("===============================")
    }
  }, [reviews])

  const { data: tutors } = useQuery("tutors-for-review", () => tutorsAPI.getTutors(), {
    select: (response) => response.data,
    enabled: user?.role === "student",
  })

  useEffect(() => {
    if (tutors && tutors.length > 0) {
      console.log("=== TUTORS DATA STRUCTURE ===")
      console.log("First tutor:", tutors[0])
      console.log(
        "All tutors:",
        tutors.map((t) => ({ id: t.id, user: t.user })),
      )
      console.log("==============================")
    }
  }, [tutors])

  const createMutation = useMutation(reviewsAPI.createReview, {
    onSuccess: () => {
      toast.success("Отзыв создан успешно!")
      queryClient.invalidateQueries("reviews")
      handleCancelEdit()
    },
    onError: (error) => {
      const message = error.response?.data?.detail || "Ошибка при создании отзыва"
      toast.error(message)
    },
  })

  const updateMutation = useMutation(({ id, data }) => reviewsAPI.updateReview(id, data), {
    onSuccess: () => {
      toast.success("Отзыв обновлен успешно!")
      queryClient.invalidateQueries("reviews")
      handleCancelEdit()
    },
    onError: (error) => {
      const message = error.response?.data?.detail || "Ошибка при обновлении отзыва"
      toast.error(message)
    },
  })

  const deleteMutation = useMutation(reviewsAPI.deleteReview, {
    onSuccess: () => {
      toast.success("Отзыв удален успешно!")
      queryClient.invalidateQueries("reviews")
    },
    onError: (error) => {
      const message = error.response?.data?.detail || "Ошибка при удалении отзыва"
      toast.error(message)
    },
  })

  const onSubmit = (data) => {
    console.log("Submitting form data:", data)

    const formData = {
      tutor: Number.parseInt(data.tutor),
      rating: Number.parseInt(data.rating),
      text: data.text,
    }

    console.log("Processed form data:", formData)

    if (editingReview) {
      updateMutation.mutate({ id: editingReview.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (review) => {
    console.log("=== DEBUGGING EDIT ===")
    console.log("Full review object:", review)
    console.log("Review tutor:", review.tutor)
    console.log("Review tutor type:", typeof review.tutor)
    console.log("Available tutors:", tutors)
    console.log(
      "Tutors structure:",
      tutors?.map((t) => ({ id: t.id, user: t.user })),
    )
    console.log("======================")

    setEditingReview(review)
    setShowCreateForm(true)

    // Определяем правильный ID репетитора
    let tutorId = ""
    if (review.tutor) {
      if (typeof review.tutor === "object" && review.tutor.id) {
        tutorId = review.tutor.id.toString()
      } else if (typeof review.tutor === "number") {
        tutorId = review.tutor.toString()
      } else if (typeof review.tutor === "string") {
        // Возможно это email или имя, нужно найти по нему
        const foundTutor = tutors?.find((t) => t.user === review.tutor || t.email === review.tutor)
        tutorId = foundTutor ? foundTutor.id.toString() : ""
      }
    }

    console.log("Calculated tutor ID:", tutorId)

    setTimeout(() => {
      reset({
        tutor: tutorId,
        rating: review.rating || 5,
        text: review.text || "",
      })
    }, 100)
  }

  const handleCancelEdit = () => {
    setEditingReview(null)
    setShowCreateForm(false)
    reset({
      tutor: "",
      rating: 5,
      text: "",
    })
  }

  const handleStartCreate = () => {
    setShowCreateForm(true)
    reset({
      tutor: "",
      rating: 5,
      text: "",
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer" : ""}`}
            onClick={interactive ? () => onChange(star) : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{user?.role === "student" ? "Мои отзывы" : "Отзы��ы о вас"}</h1>
          <p className="text-muted-foreground">
            {user?.role === "student" ? "Управляйте отзывами о ваших репетиторах" : "Отзывы студентов о ваших занятиях"}
          </p>
        </div>
        {user?.role === "student" && (
          <Button onClick={handleStartCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Написать отзыв
          </Button>
        )}
      </div>

      {/* Create/Edit Review Form */}
      {showCreateForm && user?.role === "student" && (
        <Card>
          <CardHeader>
            <CardTitle>{editingReview ? "Редактировать отзыв" : "Написать отзыв"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Репетитор</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={!!editingReview}
                  {...register("tutor", { required: "Выберите репетитора" })}
                >
                  <option value="">Выберите репетитора</option>
                  {tutors?.map((tutor) => (
                    <option key={tutor.id} value={tutor.id.toString()}>
                      {tutor.user}
                    </option>
                  ))}
                </select>
                {errors.tutor && <p className="text-sm text-destructive">{errors.tutor.message}</p>}

                {/* Debug info */}
                <p className="text-xs text-gray-500 mt-1">
                  Выбранный репетитор: {watchedTutor}
                  {editingReview && ` (Должен быть: ${editingReview.tutor?.id})`}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Оценка</label>
                <div className="mt-1">{renderStars(watchedRating, true, (star) => setValue("rating", star))}</div>
                <input type="hidden" {...register("rating", { required: true })} />
              </div>

              <div>
                <label className="text-sm font-medium">Отзыв</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Поделитесь своим опытом..."
                  {...register("text", { required: "Текст отзыва обязателен" })}
                />
                {errors.text && <p className="text-sm text-destructive">{errors.text.message}</p>}
              </div>

              <div className="flex space-x-2">
                <Button type="submit" loading={createMutation.isLoading || updateMutation.isLoading}>
                  {editingReview ? "Обновить" : "Опубликовать"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews?.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {user?.role === "student"
                          ? `Отзыв для ${review.tutor?.user || "Репетитор"}`
                          : `Отзыв от ${review.student || "Студент"}`}
                      </p>
                      <div className="flex items-center space-x-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-muted-foreground">{formatDate(review.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{review.text}</p>

                  {/* Debug info */}
                  <p className="text-xs text-gray-500 mt-2">
                    Review ID: {review.id}, Tutor ID: {review.tutor?.id}, Tutor: {review.tutor?.user}
                  </p>
                </div>

                {user?.role === "student" && (
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(review)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(review.id)}
                      loading={deleteMutation.isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {user?.role === "student" ? "У вас пока нет отзывов" : "У вас пока нет отзывов от студентов"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ReviewsPage
