"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [hasActivePlan, setHasActivePlan] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const token = localStorage.getItem("authToken")
        if (!token) {
          setHasActivePlan(false)
          setIsLoading(false)
          return
        }

        const response = await fetch("http://127.0.0.1:8000/api/subscription/details/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setHasActivePlan(data.has_active_plan)
        } else {
          // Handle specific error cases
          if (response.status === 401) {
            // Token is invalid or expired
            localStorage.removeItem("authToken")
          }
          setHasActivePlan(false)
        }
      } catch (error) {
        console.error("Error checking subscription:", error)
        setHasActivePlan(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSubscription()
  }, [])

  // Add a recheck function that can be called when needed
  const recheckSubscription = async () => {
    setIsLoading(true)
    const token = localStorage.getItem("authToken")
    if (!token) {
      setHasActivePlan(false)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/subscription/details/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setHasActivePlan(data.has_active_plan)
      } else {
        setHasActivePlan(false)
      }
    } catch (error) {
      console.error("Error checking subscription:", error)
      setHasActivePlan(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SubscriptionContext.Provider value={{ hasActivePlan, isLoading, setHasActivePlan, recheckSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

const SubscriptionContext = createContext<{
  hasActivePlan: boolean
  isLoading: boolean
  setHasActivePlan: React.Dispatch<React.SetStateAction<boolean>>
  recheckSubscription: () => Promise<void>
}>({
  hasActivePlan: false,
  isLoading: true,
  setHasActivePlan: () => {},
  recheckSubscription: async () => {},
})

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
} 