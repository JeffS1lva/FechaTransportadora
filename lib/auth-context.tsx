"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "./types"

interface AuthContextType {
  user: User | null
  users: { email: string; password: string; user: User }[]
  login: (email: string, password: string) => boolean
  logout: () => void
  addUser: (data: { name: string; email: string; password: string; role: UserRole }) => boolean
  deleteUser: (email: string) => void
  updateUser: (email: string, data: Partial<Omit<User, "id">> & { password?: string }) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEFAULT_USERS: { email: string; password: string; user: User }[] = [
  {
    email: "admin@empresa.com",
    password: "admin123",
    user: {
      id: "1",
      name: "Administrador",
      email: "admin@empresa.com",
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString(),
    },
  },
  {
    email: "visualizador@empresa.com",
    password: "view123",
    user: {
      id: "2",
      name: "Maria Silva",
      email: "visualizador@empresa.com",
      role: "viewer",
      status: "active",
      createdAt: new Date().toISOString(),
    },
  },
  {
    email: "editor@empresa.com",
    password: "editor123",
    user: {
      id: "3",
      name: "Edson Editor",
      email: "editor@empresa.com",
      role: "editor",
      status: "active",
      createdAt: new Date().toISOString(),
    },
  },
]

const USER_STORAGE_KEY = "users"
const AUTH_USER_KEY = "auth_user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<typeof DEFAULT_USERS>(DEFAULT_USERS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_USER_KEY)
    const storedUsers = localStorage.getItem(USER_STORAGE_KEY)

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem(AUTH_USER_KEY)
      }
    }

    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers))
      } catch {
        setUsers(DEFAULT_USERS)
      }
    } else {
      setUsers(DEFAULT_USERS)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users))
    }
  }, [users, isLoading])

  const login = (email: string, password: string): boolean => {
    const found = users.find(
      (u) => u.email === email && u.password === password
    )
    if (found) {
      setUser(found.user)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(found.user))
      return true
    }

    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_USER_KEY)
  }

  const addUser = (data: { name: string; email: string; password: string; role: UserRole }) => {
    const exists = users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())
    if (exists) return false

    const now = new Date().toISOString()
    const newUser = {
      email: data.email,
      password: data.password,
      user: {
        id: `u${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: data.name,
        email: data.email,
        role: data.role,
        status: "active",
        createdAt: now,
      },
    }

    setUsers((prev) => [...prev, newUser])
    return true
  }

  const deleteUser = (email: string) => {
    setUsers((prev) => prev.filter((u) => u.email !== email))
  }

  const updateUser = (
    email: string,
    data: Partial<Omit<User, "id">> & { password?: string }
  ) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.email !== email) return u

        const updatedUser: typeof u = {
          ...u,
          password: data.password ?? u.password,
          user: {
            ...u.user,
            name: data.name ?? u.user.name,
            email: data.email ?? u.user.email,
            role: data.role ?? u.user.role,
            status: data.status ?? u.user.status,
            createdAt: data.createdAt ?? u.user.createdAt,
          },
        }

        return updatedUser
      })
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        login,
        logout,
        addUser,
        deleteUser,
        updateUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
