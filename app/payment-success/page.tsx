"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    const reference = searchParams.get("reference")

    if (!reference) {
      setVerificationStatus("error")
      setMessage("Payment reference not found. Please contact support if you believe this is an error.")
      return
    }

    const verifyPayment = async () => {
      try {
        // Get auth token from localStorage
        const token = localStorage.getItem("authToken")

        if (!token) {
          setVerificationStatus("error")
          setMessage("Authentication required. Please log in to verify your payment.")
          return
        }

        const response = await fetch("https://blogbackend-crimson-frog-3248.fly.dev/api/subscription/paystack/verify/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reference }),
        })

        // Check if response is JSON before trying to parse it
        const contentType = response.headers.get("content-type")
        let data

        if (contentType && contentType.includes("application/json")) {
          data = await response.json()
        } else {
          // Handle non-JSON response
          console.error("Non-JSON response received:", await response.text())
          throw new Error("Invalid response format from server")
        }

        if (response.ok) {
          setVerificationStatus("success")
          setMessage(data?.message || "Payment verified successfully! Your subscription is now active.")

          // Update local storage to reflect subscription status
          try {
            const userDataStr = localStorage.getItem("userData")
            const userData = userDataStr ? JSON.parse(userDataStr) : {}
            localStorage.setItem(
              "userData",
              JSON.stringify({
                ...userData,
                has_active_subscription: true,
              }),
            )
          } catch (storageError) {
            console.error("Error updating user data in localStorage:", storageError)
            // Continue even if localStorage update fails
          }

          // Show success toast
          toast({
            title: "Payment Successful",
            description: "Your subscription has been activated successfully.",
            variant: "default",
          })
        } else {
          setVerificationStatus("error")
          setMessage(data?.detail || data?.message || "Payment verification failed. Please contact support.")

          // Show error toast
          toast({
            title: "Verification Failed",
            description: data?.detail || data?.message || "There was an issue verifying your payment.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Payment verification error:", error)
        setVerificationStatus("error")
        setMessage("An error occurred while verifying your payment. Please try again or contact support.")

        // Show error toast
        toast({
          title: "Verification Error",
          description: "Connection error. Please check your internet connection and try again.",
          variant: "destructive",
        })
      }
    }

    verifyPayment()
  }, [searchParams, toast])

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Payment Verification</CardTitle>
          <CardDescription>
            {verificationStatus === "loading"
              ? "We're verifying your payment..."
              : verificationStatus === "success"
                ? "Your payment has been verified"
                : "There was an issue with your payment"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {verificationStatus === "loading" && (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-center text-muted-foreground">
                Please wait while we verify your payment with Paystack...
              </p>
            </div>
          )}

          {verificationStatus === "success" && (
            <Alert
              variant="default"
              className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900"
            >
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-400">Payment Successful</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">{message}</AlertDescription>
            </Alert>
          )}

          {verificationStatus === "error" && (
            <Alert variant="destructive">
              <XCircle className="h-5 w-5" />
              <AlertTitle>Payment Verification Failed</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          {verificationStatus === "success" && (
            <>
              <Button className="w-full" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/subscription")}>
                View Subscription Details
              </Button>
            </>
          )}

          {verificationStatus === "error" && (
            <>
              <Button className="w-full" onClick={() => router.push("/pricing")}>
                Return to Pricing
              </Button>
              <Button variant="outline" className="w-full">
                <Link href="/contact" className="w-full">
                  Contact Support
                </Link>
              </Button>
            </>
          )}

          {verificationStatus === "loading" && (
            <Button variant="outline" className="w-full" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying Payment...
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

