"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowRight, Sparkles, Shield } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface PlanDescription {
  title: string
  details: string[]
}

interface SubscriptionPlan {
  id: number
  name: string
  price: string
  daily_limit: number
  duration: number
  description: PlanDescription
}

interface PricingPlansProps {
  showFeaturedOnly?: boolean
}

export default function PricingPlans({ showFeaturedOnly = true }: PricingPlansProps) {
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
        const response = await fetch("http://127.0.0.1:8000/api/subscription/plans")

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
      <div className="flex justify-center w-full">
        {showFeaturedOnly ? (
          <Skeleton className="w-full max-w-md h-[400px] rounded-lg" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[500px] rounded-lg" />
            ))}
          </div>
        )}
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

  // For featured plan only (used in PricingSection component)
  if (showFeaturedOnly) {
    // Display the Pro plan or the first plan if Pro doesn't exist
    const featuredPlan = plans.find((plan) => plan.name === "Pro") || plans[0]

    return (
      <Card className="max-w-md mx-auto overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl">{featuredPlan.name}</CardTitle>
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Popular</Badge>
          </div>
          <CardDescription>{featuredPlan.description?.title || "Perfect for bloggers"}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-4xl font-bold mb-6">
            {formatCurrency(featuredPlan.price)}
            <span className="text-sm font-normal text-muted-foreground">/month</span>
          </p>
          <ul className="space-y-3 mb-6">
            {featuredPlan.description?.details ? (
              featuredPlan.description.details.map((detail, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{detail}</span>
                </li>
              ))
            ) : (
              <>
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
              </>
            )}
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

  // For full pricing page (all plans)
  return (
    <>
      {plans.map((plan, index) => {
        const isPro = plan.name === "Pro"
        const isUltimate = plan.name === "Ultimate"

        return (
          <Card key={plan.id} className={`overflow-hidden relative ${isPro ? "border-primary/50 shadow-lg" : ""}`}>
            {isPro && (
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary to-blue-600"></div>
            )}
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                {isPro && <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Popular</Badge>}
                {isUltimate && (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    Best Value
                  </Badge>
                )}
              </div>
              <CardDescription>{plan.description?.title || `${plan.name} Plan`}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-4">
                {formatCurrency(plan.price)}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              <ul className="space-y-2 mb-6">
                {plan.description?.details ? (
                  plan.description.details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">
                        <strong>{plan.daily_limit}</strong> requests per day
                      </span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">
                        <strong>{plan.duration}</strong> days of access
                      </span>
                    </li>
                  </>
                )}
              </ul>

              {/* Plan-specific icon */}
              <div className="flex justify-center mb-6">
                {plan.name === "Basic" && (
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                {plan.name === "Pro" && (
                  <div className="p-3 rounded-full bg-primary/10">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                )}
                {plan.name === "Ultimate" && (
                  <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className={`w-full group relative overflow-hidden ${isPro ? "" : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"}`}
                onClick={() => handleSubscribe(plan.id)}
              >
                <span className="relative z-10 flex items-center justify-center">
                  Subscribe
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </>
  )
}

