"use client"

import type React from "react"
import { useState, useEffect, useContext, createContext } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { fetchWithAuth, clearAuthTokens } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Create a context for logout functionality
const LogoutContext = createContext<(() => void) | undefined>(undefined)

// Create a context for user data
export const UserContext = createContext<{
  hasSubscribedBefore: boolean
  hasActivePlan: boolean
  subscriptionData: {
    status: string
    plan: {
      name: string
      daily_limit: number
    }
    expires_at: string
    requests_today: number
  } | null
}>({
  hasSubscribedBefore: false,
  hasActivePlan: false,
  subscriptionData: null
})

export const useLogout = () => useContext(LogoutContext)
export const useUserSubscription = () => useContext(UserContext)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasSubscribedBefore, setHasSubscribedBefore] = useState(false)
  const [hasActivePlan, setHasActivePlan] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<{
    status: string
    plan: {
      name: string
      daily_limit: number
    }
    expires_at: string
    requests_today: number
  } | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken")
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to access the dashboard.",
          variant: "destructive",
        })
        router.push("/auth/login")
        return
      }

      try {
        // First, check user profile to see if they've subscribed before
        const userResponse = await fetchWithAuth("http://127.0.0.1:8000/api/users/user/", {}, router, toast)

        if (!userResponse.ok) {
          // Handle specific error codes
          if (userResponse.status === 401) {
            clearAuthTokens()
            toast({
              title: "Session expired",
              description: "Your session has expired. Please log in again.",
              variant: "destructive",
            })
            router.push("/auth/login")
            return
          }

          throw new Error(`API request failed with status ${userResponse.status}`)
        }

        const userData = await userResponse.json()

        // Check if user has subscribed before
        setHasSubscribedBefore(userData.has_subscribed)

        // If user has never subscribed before, redirect to pricing
        if (!userData.has_subscribed) {
          setIsLoading(false)
          toast({
            title: "Subscription required",
            description: "Please subscribe to access the dashboard features.",
            variant: "destructive",
          })
          router.push("/pricing")
          return
        }

        // Check current subscription status
        const subscriptionResponse = await fetchWithAuth(
          "http://127.0.0.1:8000/api/subscription/details/",
          {},
          router,
          toast,
        )

        if (subscriptionResponse.ok) {
          const data = await subscriptionResponse.json()
          setSubscriptionData(data)
          setHasActivePlan(data.status === "active")
        } else {
          // If subscription details API fails, assume no active plan
          setHasActivePlan(false)
          setSubscriptionData(null)
        }

        // Allow access to dashboard regardless of current subscription status
        setIsLoading(false)
      } catch (error) {
        console.error("Authentication check error:", error)
        
        // Handle network errors silently
        if (error instanceof Error && 
            (error.message.includes('Failed to fetch') || 
             error.message.includes('network') ||
             error.message.includes('timeout'))) {
          setIsLoading(false)
          return
        }

        // For other errors, show a specific message
        setError(error instanceof Error ? error.message : "Failed to verify your account")
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, toast])

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const refreshToken = localStorage.getItem("refreshToken")

      if (token && refreshToken) {
        await fetchWithAuth(
          "http://127.0.0.1:8000/api/users/logout/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh: refreshToken }),
          },
          router,
          toast,
        )
      }
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      // Always remove tokens from localStorage
      clearAuthTokens()

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })

      router.push("/")
    }
  }

  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    // Force a re-render which will trigger the useEffect again
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleRetry}>Retry</Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <LogoutContext.Provider value={handleLogout}>
      <UserContext.Provider value={{ hasSubscribedBefore, hasActivePlan, subscriptionData }}>
        {/* No additional wrapper divs that might interfere with navigation */}
        {children}
      </UserContext.Provider>
    </LogoutContext.Provider>
  )
}

