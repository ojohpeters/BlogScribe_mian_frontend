"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, CreditCard, Calendar, Shield, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

interface SubscriptionPlan {
  id: number
  name: string
  price: string
  daily_limit: number
  duration: number
  description?: {
    title: string
    details: string[]
  }
}

export default function Payment() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const planId = searchParams.get("plan_id")

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("authToken")
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      })
      router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      return
    }

    const fetchPlanDetails = async () => {
      if (!planId) {
        // If no plan_id is provided, fetch all plans and select the first one
        try {
          const response = await fetch("http://127.0.0.1:8000/api/subscription/plans/", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`)
          }

          const plans = await response.json()
          if (plans && plans.length > 0) {
            setSelectedPlan(plans[0])
          }
        } catch (error) {
          console.error("Error fetching plans:", error)
          toast({
            title: "Error",
            description: "Failed to load subscription plan details.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      } else {
        // If plan_id is provided, fetch that specific plan
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/subscription/plan/${planId}/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`)
          }

          const plan = await response.json()

          if (plan.error) {
            throw new Error(plan.error)
          }

          setSelectedPlan(plan)
        } catch (error) {
          console.error("Error fetching plan details:", error)
          toast({
            title: "Error",
            description: "Failed to load subscription plan details.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchPlanDetails()
  }, [planId, toast, router])

  const handleSubscribe = async () => {
    if (!selectedPlan) return

    setIsProcessing(true)
    try {
      const token = localStorage.getItem("authToken")

      // Send a POST request to initiate Paystack payment
      const response = await fetch("http://127.0.0.1:8000/api/subscription/paystack/initiate/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan_id: selectedPlan.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `API request failed with status ${response.status}`)
      }

      const data = await response.json()

      // Check if the API returned a payment URL
      if (data.payment_url) {
        // Show success toast before redirecting
        toast({
          title: "Payment Initiated",
          description: "You'll be redirected to complete your payment. Please don't close your browser.",
          variant: "default",
        })

        // Short delay to ensure toast is visible before redirect
        setTimeout(() => {
          // Redirect the user to the Paystack payment page
          window.location.href = data.payment_url
        }, 1500)
      } else {
        throw new Error("No payment URL received from server")
      }
    } catch (error) {
      console.error("Error processing subscription:", error)
      toast({
        title: "Subscription failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while processing your subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCurrency = (amount: string) => {
    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number.parseFloat(amount))
    } catch (error) {
      console.error("Currency formatting error:", error)
      return `₦${amount}`
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!selectedPlan) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Plan Not Found</CardTitle>
            <CardDescription>The selected subscription plan could not be found.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/pricing")} className="w-full">
              View Available Plans
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <div className="grid gap-6 md:grid-cols-5">
          {/* Plan Details - 3 columns on medium screens and up */}
          <Card className="md:col-span-3">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedPlan.name} Plan</CardTitle>
                  <CardDescription>
                    {selectedPlan.description?.title || "Review your subscription details"}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {formatCurrency(selectedPlan.price)}/month
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Plan Features</h3>
                <ul className="space-y-3">
                  {selectedPlan.description?.details ? (
                    selectedPlan.description.details.map((detail, index) => (
                      <motion.li
                        key={index}
                        className="flex items-start"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{detail}</span>
                        </div>
                      </motion.li>
                    ))
                  ) : (
                    <>
                      <motion.li
                        className="flex items-start"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{selectedPlan.daily_limit} requests per day</span>
                          <p className="text-sm text-muted-foreground">Make the most of our AI-powered tools</p>
                        </div>
                      </motion.li>
                      <motion.li
                        className="flex items-start"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{selectedPlan.duration} days of access</span>
                          <p className="text-sm text-muted-foreground">Full access to all premium features</p>
                        </div>
                      </motion.li>
                      <motion.li
                        className="flex items-start"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">AI-powered paraphrasing</span>
                          <p className="text-sm text-muted-foreground">Create unique content effortlessly</p>
                        </div>
                      </motion.li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary - 2 columns on medium screens and up */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
              <CardDescription>Secure payment processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-muted-foreground">Subscription</span>
                  <span className="font-medium">{selectedPlan.name} Plan</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{selectedPlan.duration} days</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">Total</span>
                  <span className="font-bold">{formatCurrency(selectedPlan.price)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 mr-2 text-green-500" />
                  <span>Secure payment processing</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4 mr-2 text-green-500" />
                  <span>Multiple payment methods accepted</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2 text-green-500" />
                  <span>Instant access upon payment</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button
                className="w-full group relative overflow-hidden"
                size="lg"
                onClick={handleSubscribe}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <span className="flex items-center justify-center">
                    Subscribe Now
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
                <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/pricing")}
                disabled={isProcessing}
              >
                Back to Plans
              </Button>
            </CardFooter>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}

