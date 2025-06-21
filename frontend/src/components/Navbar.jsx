"use client"

import { Link } from "react-router-dom"
import {useAuth} from "../contexts/AuthContext.jsx"
import { LogOut, User, Bell } from "lucide-react"

const Navbar = () => {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-white border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="text-xl font-bold text-primary">
          Tutoring Platform
        </Link>

        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-muted rounded-lg">
            <Bell className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>

          <button onClick={logout} className="p-2 hover:bg-muted rounded-lg text-destructive">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
