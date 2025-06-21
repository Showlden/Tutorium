"use client"

import { Link, useLocation } from "react-router-dom"
import {useAuth} from "../contexts/AuthContext.jsx"
import { Home, Users, Calendar, BookOpen, Star, User } from "lucide-react"
import { cn } from "../lib/utils.js"

const Sidebar = () => {
  const { user } = useAuth()
  const location = useLocation()

  const getMenuItems = () => {
    const commonItems = [
      { icon: Home, label: "Dashboard", path: "/dashboard" },
      { icon: User, label: "Profile", path: "/profile" },
    ]

    if (user?.role === "student") {
      return [
        ...commonItems,
        { icon: Users, label: "Find Tutors", path: "/tutors" },
        { icon: BookOpen, label: "My Bookings", path: "/bookings" },
        { icon: Star, label: "My Reviews", path: "/reviews" },
      ]
    }

    if (user?.role === "tutor") {
      return [
        ...commonItems,
        { icon: Calendar, label: "Schedule", path: "/schedule" },
        { icon: BookOpen, label: "Bookings", path: "/bookings" },
        { icon: Star, label: "Reviews", path: "/reviews" },
      ]
    }

    return commonItems
  }

  const menuItems = getMenuItems()

  return (
    <aside className="w-64 bg-white border-r border-border h-[calc(100vh-73px)]">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
