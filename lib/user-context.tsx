"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

// Define the user data interface
export interface UserData {
  id: number
  username: string
  email: string
  wordpress_username: string
  wordpress_url: string
  has_used_free_trial: boolean
  has_subscribed?: boolean
  plan_name?: string
}

// Create the context with default values
interface UserContextType {
  user: UserData | null
  setUser: (user: UserData | null) => void
  loading: boolean
  fetchUserData: () => Promise<void>
  clearUserData: () => void
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  fetchUserData: async () => {},
  clearUserData: () => {},
})

// Create a provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Function to fetch user data from API
  const fetchUserData = async () => {
    setLoading(true)
    try {
      // Check if we have a token
      const token = localStorage.getItem("authToken")
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      // Try to get user data from localStorage first
      const cachedUserData = localStorage.getItem("userData")
      if (cachedUserData) {
        setUser(JSON.parse(cachedUserData))
        setLoading(false)
        // Still fetch fresh data in the background
        refreshUserData(token)
        return
      }

      // If no cached data, fetch from API
      await refreshUserData(token)
    } catch (error) {
      console.error("Error fetching user data:", error)
      setLoading(false)
    }
  }

  // Helper function to refresh user data from API
  const refreshUserData = async (token: string) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/users/user/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()

        // Fetch subscription details to get plan name
        try {
          const subscriptionResponse = await fetch("http://127.0.0.1:8000/api/subscription/details/", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (subscriptionResponse.ok) {
            const subscriptionData = await subscriptionResponse.json()
            // Add plan name to user data
            userData.plan_name = subscriptionData.plan?.name || null
          }
        } catch (error) {
          console.error("Error fetching subscription details:", error)
        }

        setUser(userData)
        // Cache the user data in localStorage
        localStorage.setItem("userData", JSON.stringify(userData))
      } else if (response.status === 401) {
        // Token is invalid, clear everything
        clearUserData()
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Function to clear user data (for logout)
  const clearUserData = () => {
    setUser(null)
    localStorage.removeItem("userData")
    localStorage.removeItem("authToken")
    localStorage.removeItem("refreshToken")
  }

  // Load user data on initial mount
  useEffect(() => {
    fetchUserData()
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, loading, fetchUserData, clearUserData }}>
      {children}
    </UserContext.Provider>
  )
}

// Custom hook to use the user context
export function useUser() {
  return useContext(UserContext)
}

