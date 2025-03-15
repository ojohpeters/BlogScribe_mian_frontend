"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface SubscriptionContextType {
  hasActivePlan: boolean
  isLoading: boolean
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  hasActivePlan: false,
  isLoading: true,
})

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [hasActivePlan, setHasActivePlan] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // This is a placeholder. In a real application, you would
    // fetch the subscription status from an API.
    // For example:
    // const fetchSubscriptionStatus = async () => {
    //   setIsLoading(true);
    //   try {
    //     const response = await fetch("/api/subscription");
    //     const data = await response.json();
    //     setHasActivePlan(data.isActive);
    //   } catch (error) {
    //     console.error("Failed to fetch subscription status", error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchSubscriptionStatus();

    // Simulate loading and setting the subscription status
    setTimeout(() => {
      setIsLoading(false)
      // Replace with actual logic to determine if the user has an active plan
      const token = localStorage.getItem("authToken")
      setHasActivePlan(!!token) // Example: User has active plan if logged in
    }, 500)
  }, [])

  return <SubscriptionContext.Provider value={{ hasActivePlan, isLoading }}>{children}</SubscriptionContext.Provider>
}

export function useSubscription() {
  return useContext(SubscriptionContext)
}

