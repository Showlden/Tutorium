"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import {useAuth} from "../contexts/AuthContext.jsx"
import Button from "../components/Button.jsx"
import Input from "../components/Input.jsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/Card.jsx"

const LoginPage = () => {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    const result = await login(data.email, data.password)
    if (result.success) {
      navigate("/dashboard")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Вход в систему</CardTitle>
          <CardDescription>Введите ваши данные для входа в аккаунт</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <label htmlFor="password" className="text-sm font-medium">
                Пароль
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
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

            <Button type="submit" className="w-full" loading={loading}>
              Войти
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Нет аккаунта?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Зарегистрироваться
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage
