"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface SubscriptionPlan {
  id: number
  name: string
  price: string
  daily_limit: number
  duration: number
}

export default function PricingSection() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("https://blogbackend-crimson-frog-3248.fly.dev/api/subscription/plans")

        if (!response.ok) {
          throw new Error(`Failed to fetch plans: ${response.status}`)
        }

        const data = await response.json()
        console.log("Fetched subscription plans:", data)
        setPlans(data)
      } catch (error) {
        console.error("Error fetching subscription plans:", error)
        setError("Failed to load subscription plans")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptionPlans()
  }, [])

  const formatCurrency = (amount: string) => {
    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number.parseFloat(amount))
    } catch (error) {
      return `₦${amount}`
    }
  }

  // Replace the handleSubscribe function with this version that checks authentication
  const handleSubscribe = (planId: number) => {
    // Check if user is logged in by looking for auth token
    const token = localStorage.getItem("authToken")

    if (!token) {
      // If not logged in, redirect to login page with return URL
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe to a plan.",
      })
      router.push(`/auth/login?returnUrl=${encodeURIComponent(`/payment?plan_id=${planId}`)}`)
    } else {
      // If logged in, proceed to payment page
      router.push(`/payment?plan_id=${planId}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Skeleton className="w-full max-w-md h-[300px] rounded-lg" />
      </div>
    )
  }

  if (error || plans.length === 0) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Plans Unavailable</CardTitle>
          <CardDescription>{error || "No subscription plans are currently available."}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Please check back later or contact support for assistance.
          </p>
          <Link href="/contact">
            <Button variant="outline" className="w-full">
              Contact Support
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Display the first plan or a featured plan
  const featuredPlan = plans.find((plan) => plan.name === "Pro") || plans[0]

  return (
    <Card className="max-w-md mx-auto overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-start">
          <CardTitle className="text-2xl">{featuredPlan.name}</CardTitle>
          <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Popular</Badge>
        </div>
        <CardDescription>Perfect for bloggers</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-4xl font-bold mb-6">
          {formatCurrency(featuredPlan.price)}
          <span className="text-sm font-normal text-muted-foreground">/month</span>
        </p>
        <ul className="space-y-3 mb-6">
          <li className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
            <span>
              <strong>{featuredPlan.daily_limit}</strong> requests per day
            </span>
          </li>
          <li className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
            <span>
              <strong>{featuredPlan.duration}</strong> days of access
            </span>
          </li>
          <li className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
            <span>AI-powered paraphrasing</span>
          </li>
          <li className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
            <span>24/7 support</span>
          </li>
        </ul>
        <Button className="w-full group relative overflow-hidden" onClick={() => handleSubscribe(featuredPlan.id)}>
          <span className="relative z-10 flex items-center justify-center">
            Subscribe Now
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
          <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
        </Button>
        <div className="mt-4 text-center">
          <Link href="/pricing" className="text-sm text-primary hover:underline">
            View all plans
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

