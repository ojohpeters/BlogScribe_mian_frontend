"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Calendar, Clock, CreditCard, BarChart, CheckCircle, AlertCircle } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { motion } from "framer-motion"
import { fetchWithAuth } from "@/lib/auth"

interface Plan {
  id: number
  name: string
  price: string
  daily_limit: number
  duration: number
}

interface SubscriptionDetails {
  user: number
  plan: Plan
  start_date: string
  status: "active" | "expired" | "pending"
  expires_at: string
}

export default function Subscription() {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Update the fetchSubscriptionDetails function to use fetchWithAuth
    const fetchSubscriptionDetails = async () => {
      setIsLoading(true)
      console.log("Fetching subscription details...")

      try {
        const response = await fetchWithAuth("https://blogbackend-crimson-frog-3248.fly.dev/api/subscription/details/", {}, router, toast)

        const data = await response.json()
        console.log("Parsed subscription data:", data)
        setSubscription(data)
      } catch (error) {
        console.error("Error fetching subscription details:", error)
        if (!(error instanceof Error && error.message === "Session expired")) {
          toast({
            title: "Error fetching subscription",
            description: "Unable to load your subscription details. Please try again.",
            variant: "destructive",
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptionDetails()
  }, [toast, router])

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy")
    } catch (error) {
      console.error("Date formatting error:", error)
      return "Invalid date"
    }
  }

  const formatCurrency = (amount: string) => {
    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
      }).format(Number.parseFloat(amount))
    } catch (error) {
      console.error("Currency formatting error:", error)
      return amount
    }
  }

  const handleRenewSubscription = () => {
    router.push("/payment")
  }

  const handleLogout = () => {
    // This function is now handled in the layout
    router.push("/")
  }

  if (isLoading) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading subscription details...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageTransition>
        <div className="container mx-auto px-4 py-8 pb-safe">
          <h2 className="text-3xl font-bold mb-6">Subscription</h2>

          {!subscription ? (
            <Card className="border-destructive/50 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
                  No Subscription Found
                </CardTitle>
                <CardDescription>You don't have an active subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Subscribe to a plan to access all features of BlogMaster.</p>
              </CardContent>
              <CardFooter>
                <Button onClick={handleRenewSubscription} className="relative overflow-hidden group">
                  <span className="relative z-10">Subscribe Now</span>
                  <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                </Button>
              </CardFooter>
            </Card>
          ) : subscription.status !== "active" ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="overflow-hidden border-destructive/50">
                <CardHeader className="bg-destructive/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{subscription.plan.name} Plan</CardTitle>
                      <CardDescription>Your subscription has expired</CardDescription>
                    </div>
                    <Badge variant="destructive" className="px-3 py-1 text-sm font-medium rounded-full">
                      <span className="capitalize">{subscription.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                      {subscription.plan.description && subscription.plan.description.details ? (
                        <div className="space-y-4">
                          <motion.div
                            className="flex items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground mr-2">Price:</span>
                            <span className="font-medium">{formatCurrency(subscription.plan.price)}</span>
                          </motion.div>

                          <motion.div
                            className="flex items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <BarChart className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground mr-2">Daily Limit:</span>
                            <span className="font-medium">{subscription.plan.daily_limit} requests</span>
                          </motion.div>

                          <motion.div
                            className="flex items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground mr-2">Duration:</span>
                            <span className="font-medium">{subscription.plan.duration} days</span>
                          </motion.div>
                        </div>
                      ) : (
                        <>
                          <motion.div
                            className="flex items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground mr-2">Price:</span>
                            <span className="font-medium">{formatCurrency(subscription.plan.price)}</span>
                          </motion.div>

                          <motion.div
                            className="flex items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <BarChart className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground mr-2">Daily Limit:</span>
                            <span className="font-medium">{subscription.plan.daily_limit} requests</span>
                          </motion.div>

                          <motion.div
                            className="flex items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground mr-2">Duration:</span>
                            <span className="font-medium">{subscription.plan.duration} days</span>
                          </motion.div>
                        </>
                      )}
                    </div>

                    <div className="space-y-4">
                      <motion.div
                        className="flex items-center"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground mr-2">Start Date:</span>
                        <span className="font-medium">{formatDate(subscription.start_date)}</span>
                      </motion.div>

                      <motion.div
                        className="flex items-center"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground mr-2">Expiration Date:</span>
                        <span className="font-medium">{formatDate(subscription.expires_at)}</span>
                      </motion.div>

                      <motion.div
                        className="flex items-center"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <span className="text-muted-foreground mr-2">Status:</span>
                        <Badge variant="destructive" className="capitalize">
                          {subscription.status}
                        </Badge>
                      </motion.div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-amber-800 dark:text-amber-200">
                      Your subscription has expired. While you can still access the dashboard, premium features like
                      paraphrasing and publishing are unavailable. Renew now to regain full access.
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="bg-muted/30 border-t">
                  <Button
                    onClick={handleRenewSubscription}
                    className="w-full sm:w-auto relative overflow-hidden group"
                    size="lg"
                  >
                    <span className="relative z-10">Renew Subscription</span>
                    <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{subscription.plan.name} Plan</CardTitle>
                      <CardDescription>Your current subscription details</CardDescription>
                    </div>
                    <Badge
                      variant="default"
                      className="px-3 py-1 text-sm font-medium rounded-full bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400 hover:bg-green-500/20 hover:text-green-600"
                    >
                      <span className="flex items-center">
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Active
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                      {subscription.plan.description && subscription.plan.description.details ? (
                        <div className="space-y-4">
                          <motion.div
                            className="flex items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground mr-2">Price:</span>
                            <span className="font-medium">{formatCurrency(subscription.plan.price)}</span>
                          </motion.div>

                          <motion.div
                            className="flex items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <BarChart className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground mr-2">Daily Limit:</span>
                            <span className="font-medium">{subscription.plan.daily_limit} requests</span>
                          </motion.div>

                          <motion.div
                            className="flex items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground mr-2">Duration:</span>
                            <span className="font-medium">{subscription.plan.duration} days</span>
                          </motion.div>
                        </div>
                      ) : (
                        <>
                          <motion.div
                            className="flex items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground mr-2">Price:</span>
                            <span className="font-medium">{formatCurrency(subscription.plan.price)}</span>
                          </motion.div>

                          <motion.div
                            className="flex items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <BarChart className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground mr-2">Daily Limit:</span>
                            <span className="font-medium">{subscription.plan.daily_limit} requests</span>
                          </motion.div>

                          <motion.div
                            className="flex items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground mr-2">Duration:</span>
                            <span className="font-medium">{subscription.plan.duration} days</span>
                          </motion.div>
                        </>
                      )}
                    </div>

                    <div className="space-y-4">
                      <motion.div
                        className="flex items-center"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground mr-2">Start Date:</span>
                        <span className="font-medium">{formatDate(subscription.start_date)}</span>
                      </motion.div>

                      <motion.div
                        className="flex items-center"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground mr-2">Expiration Date:</span>
                        <span className="font-medium">{formatDate(subscription.expires_at)}</span>
                      </motion.div>

                      <motion.div
                        className="flex items-center"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <span className="text-muted-foreground mr-2">Status:</span>
                        <Badge
                          variant={subscription.status === "active" ? "outline" : "destructive"}
                          className="capitalize"
                        >
                          {subscription.status}
                        </Badge>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>

                {subscription.status !== "active" && (
                  <CardFooter className="bg-muted/30 border-t">
                    <Button
                      onClick={handleRenewSubscription}
                      className="w-full sm:w-auto relative overflow-hidden group"
                    >
                      <span className="relative z-10">Renew Subscription</span>
                      <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </motion.div>
          )}

          <div className="flex justify-center mt-6">
            <Button 
              onClick={() => router.push("/pricing")}
              className="bg-primary hover:bg-primary/90"
            >
              Upgrade Plan
            </Button>
          </div>
        </div>
      </PageTransition>
    </>
  )
}

