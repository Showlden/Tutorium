import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

export const formatTime = (time) => {
    return time.slice(0, 5) // Remove seconds from HH:MM:SS
}

export const formatPrice = (price) => {
    return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
    }).format(price)
}

export const getRoleDisplayName = (role) => {
    const roles = {
        student: "Студент",
        tutor: "Репетитор",
        admin: "Администратор",
    }
    return roles[role] || role
}

export const getStatusDisplayName = (status) => {
    const statuses = {
        pending: "Ожидает подтверждения",
        confirmed: "Подтверждено",
        cancelled: "Отменено",
        completed: "Завершено",
        available: "Доступно",
        booked: "Забронировано",
        unavailable: "Недоступно",
    }
    return statuses[status] || status
}
