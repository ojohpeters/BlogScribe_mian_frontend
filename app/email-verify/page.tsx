"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { PageTransition } from "@/components/page-transition"

export default function EmailVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [verificationState, setVerificationState] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationState("error")
        setMessage("Verification token is missing.")
        return
      }

      try {
        // Use the production API URL
        const apiUrl = "https://blogbackend-crimson-frog-3248.fly.dev/api/users/email-verify/"
        const response = await fetch(`${apiUrl}?token=${token}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()

        if (response.ok) {
          setVerificationState("success")
          setMessage(data.message || "Your email has been successfully verified!")
        } else {
          setVerificationState("error")
          setMessage(data.detail || data.message || "Email verification failed. The token may be invalid or expired.")
        }
      } catch (error) {
        console.error("Verification error:", error)
        setVerificationState("error")
        setMessage("An error occurred during email verification. Please try again later.")
      }
    }

    verifyEmail()
  }, [token])

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
            <CardDescription>
              {verificationState === "loading" ? "Verifying your email address..." : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verificationState === "loading" && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Please wait while we verify your email address...
                </p>
              </div>
            )}

            {verificationState === "success" && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <AlertTitle className="text-green-700 dark:text-green-300">Verification Successful</AlertTitle>
                <AlertDescription className="text-green-600 dark:text-green-400">{message}</AlertDescription>
              </Alert>
            )}

            {verificationState === "error" && (
              <Alert className="border-red-500 bg-red-50 dark:bg-red-900/20">
                <XCircle className="h-5 w-5 text-red-500" />
                <AlertTitle className="text-red-700 dark:text-red-300">Verification Failed</AlertTitle>
                <AlertDescription className="text-red-600 dark:text-red-400">{message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            {verificationState !== "loading" && (
              <div className="space-y-3">
                {verificationState === "success" ? (
                  <Button asChild className="w-full">
                    <Link href="/auth/login">Continue to Login</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/">Return to Home</Link>
                    </Button>
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                      Need help?{" "}
                      <Link href="/contact" className="text-primary hover:underline">
                        Contact Support
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </PageTransition>
  )
}

