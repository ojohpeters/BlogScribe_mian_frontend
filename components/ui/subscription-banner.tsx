"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { fetchWithAuth } from "@/lib/utils"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SubscriptionBanner() {
  const [hasSubscribedBefore, setHasSubscribedBefore] = useState(false)
  const [hasActivePlan, setHasActivePlan] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") return

    // Only check if user is authenticated
    const token = localStorage.getItem("authToken")
    if (!token) return

    const checkSubscription = async () => {
      try {
        // First check user profile to see if they've subscribed before
        const userResponse = await fetchWithAuth("https://blogbackend-crimson-frog-3248.fly.dev/api/users/user/", {}, router, toast)

        if (!userResponse.ok) {
          return
        }

        const userData = await userResponse.json()
        console.log("Subscription banner - user data:", userData)

        // Set hasSubscribedBefore based on API response
        setHasSubscribedBefore(userData.has_subscribed)

        // If they've subscribed before, check current subscription status
        if (userData.has_subscribed) {
          try {
            const subscriptionResponse = await fetchWithAuth(
              "https://blogbackend-crimson-frog-3248.fly.dev/api/subscription/details/",
              {},
              router,
              toast,
            )

            if (subscriptionResponse.ok) {
              const subscriptionData = await subscriptionResponse.json()
              console.log("Subscription banner - subscription data:", subscriptionData)
              // Only set active if status is explicitly "active"
              setHasActivePlan(subscriptionData.status === "active")
            } else {
              console.error("Failed to fetch subscription details:", subscriptionResponse.status)
              // If subscription details API fails, assume no active plan
              setHasActivePlan(false)
            }
          } catch (error) {
            console.error("Error checking subscription status:", error)
            setHasActivePlan(false)
          }
        }
      } catch (error) {
        console.error("Error checking subscription:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSubscription()
  }, [router, toast])

  if (isLoading || !hasSubscribedBefore || hasActivePlan) {
    return null
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 max-w-7xl mx-auto mt-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-amber-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Subscription expired</h3>
          <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            <p>
              Your subscription has expired. Some features may be limited.{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100"
                onClick={() => router.push("/dashboard/subscription")}
              >
                Renew now
              </Button>{" "}
              to regain full access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

