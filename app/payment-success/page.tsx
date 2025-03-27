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
    let timeoutId: NodeJS.Timeout

    if (!reference) {
      setVerificationStatus("error")
      setMessage("Payment reference not found. Please contact support if you believe this is an error.")
      return
    }

    // Set up WebSocket connection for real-time payment status updates
    const token = localStorage.getItem("authToken")
    if (token) {
      const socket = new WebSocket("wss://blogbackend-crimson-frog-3248.fly.dev/ws/payments/")

      socket.onopen = () => {
        console.log("WebSocket connection established for payment verification")
        // Send authentication token and reference to identify the payment
        socket.send(JSON.stringify({ token, reference }))
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log("Payment WebSocket message received:", data)

          // Clear the timeout since we received a response
          if (timeoutId) {
            clearTimeout(timeoutId)
          }

          if (data.status === "success") {
            setVerificationStatus("success")
            setMessage(data.message || "Payment verified successfully! Your subscription is now active.")

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
            }

            toast({
              title: "Payment Successful",
              description: "Your subscription has been activated successfully.",
              variant: "default",
            })
          } else if (data.status === "failed") {
            setVerificationStatus("error")
            setMessage(data.message || "Payment verification failed. Please contact support.")

            toast({
              title: "Verification Failed",
              description: data.message || "There was an issue verifying your payment.",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      socket.onerror = (error) => {
        console.error("WebSocket error:", error)
        setVerificationStatus("error")
        setMessage("Connection error. Please try again or contact support.")
      }

      socket.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason)
      }

      // Set a timeout to handle cases where the user might have canceled the payment
      timeoutId = setTimeout(() => {
        if (verificationStatus === "loading") {
          setVerificationStatus("error")
          setMessage(
            "We haven't received confirmation of your payment. If you completed the payment, please wait a moment. If you canceled or encountered an issue, you can try again.",
          )

          toast({
            title: "Payment Verification Timeout",
            description:
              "Did you cancel the payment? You can try again or contact support if you believe this is an error.",
            variant: "destructive",
          })
        }
      }, 60000) // 1-minute timeout

      // Clean up WebSocket connection and timeout when component unmounts
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          console.log("Closing WebSocket connection")
          socket.close()
        }
      }
    }
  }, [searchParams, toast, verificationStatus])

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

