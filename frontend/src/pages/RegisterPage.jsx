"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import {useAuth} from "../contexts/AuthContext.jsx"
import Button from "../components/Button.jsx"
import Input from "../components/Input.jsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/Card.jsx"

const RegisterPage = () => {
  const [loading, setLoading] = useState(false)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const password = watch("password")

  const onSubmit = async (data) => {
    setLoading(true)
    const result = await registerUser(data)
    if (result.success) {
      navigate("/login")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Регистрация</CardTitle>
          <CardDescription>Создайте новый аккаунт для доступа к платформе</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="first_name" className="text-sm font-medium">
                  Имя
                </label>
                <Input
                  id="first_name"
                  placeholder="Иван"
                  {...register("first_name", { required: "Имя обязательно" })}
                />
                {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="last_name" className="text-sm font-medium">
                  Фамилия
                </label>
                <Input
                  id="last_name"
                  placeholder="Иванов"
                  {...register("last_name", { required: "Фамилия обязательна" })}
                />
                {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register("email", {
                  required: "Email обязателен",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Неверный формат email",
                  },
                })}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Роль
              </label>
              <select
                id="role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register("role", { required: "Выберите роль" })}
              >
                <option value="">Выберите роль</option>
                <option value="student">Студент</option>
                <option value="tutor">Репетитор</option>
              </select>
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Пароль
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Минимум 8 символов"
                {...register("password", {
                  required: "Пароль обязателен",
                  minLength: {
                    value: 8,
                    message: "Пароль должен содержать минимум 8 символов",
                  },
                })}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password_confirmation" className="text-sm font-medium">
                Подтверждение пароля
              </label>
              <Input
                id="password_confirmation"
                type="password"
                placeholder="Повторите пароль"
                {...register("password_confirmation", {
                  required: "Подтверждение пароля обязательно",
                  validate: (value) => value === password || "Пароли не совпадают",
                })}
              />
              {errors.password_confirmation && (
                <p className="text-sm text-destructive">{errors.password_confirmation.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Зарегистрироваться
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Войти
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterPage;
