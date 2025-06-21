"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { authAPI } from "../services/api"
import toast from "react-hot-toast"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    const userData = localStorage.getItem("user_data")

    console.log("AuthProvider init - token:", token ? "exists" : "not found")
    console.log("AuthProvider init - userData:", userData ? "exists" : "not found")

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        console.log("User restored from localStorage:", parsedUser)
      } catch (error) {
        console.error("Error parsing user data:", error)
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user_data")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      console.log("Attempting login for:", email)
      const response = await authAPI.login(email, password)
      console.log("Login response:", response.data)

      // Проверяем структуру ответа
      const { user: userData, access, refresh } = response.data

      if (!access) {
        console.error("No access token in response:", response.data)
        toast.error("Ошибка: не получен токен доступа")
        return { success: false, error: "No access token" }
      }

      console.log("Saving tokens and user data...")
      localStorage.setItem("access_token", access)
      if (refresh) {
        localStorage.setItem("refresh_token", refresh)
      }
      localStorage.setItem("user_data", JSON.stringify(userData))

      setUser(userData)
      console.log("Login successful, user set:", userData)
      toast.success("Успешный вход в систему!")
      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      console.error("Login error response:", error.response?.data)

      const message =
        error.response?.data?.detail ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.non_field_errors?.[0] ||
        "Ошибка входа"
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    try {
      console.log("Attempting registration:", userData)
      await authAPI.register(userData)
      toast.success("Регистрация успешна! Теперь войдите в систему.")
      return { success: true }
    } catch (error) {
      console.error("Registration error:", error)
      console.error("Registration error response:", error.response?.data)

      const errors = error.response?.data || {}
      const message = Object.values(errors).flat().join(", ") || "Ошибка регистрации"
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    console.log("Logging out...")
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user_data")
    setUser(null)
    toast.success("Вы вышли из системы")
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
