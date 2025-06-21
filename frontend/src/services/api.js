import axios from "axios"

const API_BASE_URL = "http://localhost:8000/api"

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token")
        if (token) {
            config.headers.Authorization = `JWT ${token}`
            console.log(`Making ${config.method?.toUpperCase()} request to ${config.url} with token`)
        } else {
            console.log(`Making ${config.method?.toUpperCase()} request to ${config.url} WITHOUT token`)
        }
        return config
    },
    (error) => {
        console.error("Request interceptor error:", error)
        return Promise.reject(error)
    },
)

// Response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => {
        console.log(`Response ${response.status} from ${response.config.url}`)
        return response
    },
    async (error) => {
        console.error("API Error:", {
            status: error.response?.status,
            url: error.config?.url,
            data: error.response?.data,
        })

        // If we get 401, just logout and redirect to login
        if (error.response?.status === 401) {
            console.log("401 Unauthorized - clearing tokens and redirecting to login")
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
            localStorage.removeItem("user_data")

            // Только перенаправляем если мы не на странице логина
            if (window.location.pathname !== "/login") {
                window.location.href = "/login"
            }
        }

        return Promise.reject(error)
    },
)

// Auth API
export const authAPI = {
    login: (email, password) => api.post("/auth/login/", { email, password }),
    register: (userData) => api.post("/auth/register/", userData),
}

// Subjects API
export const subjectsAPI = {
    getSubjects: () => api.get("/education/subjects/"),
    getSubject: (id) => api.get(`/education/subjects/${id}/`),
}

// Tutor Profiles API
export const tutorsAPI = {
    getTutors: (params) => api.get("/education/tutors/", { params }),
    getTutor: (id) => api.get(`/education/tutors/${id}/`),
    updateTutorProfile: (id, data) => api.patch(`/education/tutors/${id}/`, data),
    createTutorProfile: (data) => api.post("/education/tutors/", data),
}

// Student Profiles API
export const studentsAPI = {
    getStudentProfiles: () => api.get("/education/students/"),
    getStudentProfile: (id) => api.get(`/education/students/${id}/`),
    updateStudentProfile: (id, data) => api.patch(`/education/students/${id}/`, data),
    createStudentProfile: (data) => api.post("/education/students/", data),
}

// Schedule API
export const scheduleAPI = {
    getSchedules: () => api.get("/education/schedules/"),
    getSchedule: (id) => api.get(`/education/schedules/${id}/`),
    createSchedule: (data) => api.post("/education/schedules/", data),
    updateSchedule: (id, data) => api.patch(`/education/schedules/${id}/`, data),
    addTimeSlots: (id, slots) => api.post(`/education/schedules/${id}/add-time-slots/`, slots),
    getAvailableSlots: (id) => api.get(`/education/schedules/${id}/available-slots/`),
}

// Time Slots API
export const timeSlotsAPI = {
    getTimeSlots: () => api.get("/education/time-slots/"),
    createTimeSlot: (data) => api.post("/education/time-slots/", data),
    updateTimeSlot: (id, data) => api.patch(`/education/time-slots/${id}/`, data),
    deleteTimeSlot: (id) => api.delete(`/education/time-slots/${id}/`),
}

// Bookings API
export const bookingsAPI = {
    getBookings: () => api.get("/education/bookings/"),
    createBooking: (data) => api.post("/education/bookings/", data),
    updateBooking: (id, data) => api.patch(`/education/bookings/${id}/`, data),
    confirmBooking: (id) => api.post(`/education/bookings/${id}/confirm/`),
    cancelBooking: (id) => api.post(`/education/bookings/${id}/cancel/`),
    completeBooking: (id) => api.post(`/education/bookings/${id}/complete/`),
}

// Reviews API
export const reviewsAPI = {
    getReviews: (params) => api.get("/education/reviews/", { params }),
    createReview: (data) => api.post("/education/reviews/", data),
    updateReview: (id, data) => api.patch(`/education/reviews/${id}/`, data),
    deleteReview: (id) => api.delete(`/education/reviews/${id}/`),
}

export default api
