"use client"

import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext.jsx"
import Layout from "./components/Layout.jsx"
import LoginPage from "./pages/LoginPage.jsx"
import RegisterPage from "./pages/RegisterPage.jsx"
import DashboardPage from "./pages/DashboardPage.jsx"
import TutorsPage from "./pages/TutorsPage.jsx"
import TutorDetailPage from "./pages/TutorDetailPage.jsx"
import ProfilePage from "./pages/ProfilePage.jsx"
import BookingsPage from "./pages/BookingsPage.jsx"
import ReviewsPage from "./pages/ReviewsPage.jsx"
import SchedulePage from "./pages/SchedulePage.jsx"
import LoadingSpinner from "./components/LoadingSpinner.jsx"

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />

      <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tutors" element={<TutorsPage />} />
        <Route path="tutors/:id" element={<TutorDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="schedule" element={<SchedulePage />} />
      </Route>
    </Routes>
  )
}

export default App
