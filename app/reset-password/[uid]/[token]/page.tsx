"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { PageTransition } from "@/components/page-transition"

// Define the form schema with validation
const formSchema = z
  .object({
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  // Extract uid and token from URL parameters
  const uid = params?.uid as string
  const token = params?.token as string

  // Initialize form with zod resolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isLoading) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch("http://127.0.0.1:8000/api/password-reset/confirm/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid,
          token,
          new_password: values.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle API error responses
        const errorMsg = data.detail || data.token || data.uid || data.new_password || "Password reset failed"
        throw new Error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg)
      }

      // Success state
      setIsSuccess(true)
      toast({
        title: "Password reset successful",
        description: "Your password has been reset successfully. You can now log in with your new password.",
      })

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    } catch (error) {
      console.error("Password reset error:", error)
      setErrorMessage(error instanceof Error ? error.message : "An error occurred. Please try again.")
      toast({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
        <Card className="w-full max-w-md mx-auto animate-fade-in">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium">Password Reset Successful</h3>
                <p className="text-sm text-muted-foreground">
                  Your password has been reset successfully. You will be redirected to the login page shortly.
                </p>
              </div>
            ) : errorMessage && !form.formState.isDirty ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium">Password Reset Failed</h3>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
                <p className="text-sm text-muted-foreground">
                  The password reset link may be invalid or expired. Please request a new password reset link.
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your new password"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm your new password"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Remember your password?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </PageTransition>
  )
}

