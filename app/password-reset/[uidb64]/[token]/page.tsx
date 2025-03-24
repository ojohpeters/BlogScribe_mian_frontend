"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { PageTransition } from "@/components/page-transition"
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

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

export default function PasswordReset() {
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const uidb64 = params.uidb64 as string
  const token = params.token as string

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(
          `https://blogbackend-crimson-frog-3248.fly.dev/api/users/password-reset/${uidb64}/${token}/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        )

        const data = await response.json()

        if (!response.ok) {
          setIsValid(false)
          if (data.error) {
            setError(data.error)
          } else {
            setError("Invalid or expired token. Please request a new password reset link.")
          }
          return
        }

        if (data.success) {
          setIsValid(true)
        } else {
          setIsValid(false)
          setError("Invalid token. Please request a new password reset link.")
        }
      } catch (error) {
        console.error("Token validation error:", error)
        setIsValid(false)
        setError("Failed to validate your reset token. Please try again.")
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [uidb64, token])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    try {
      const response = await fetch("https://blogbackend-crimson-frog-3248.fly.dev/api/users/password-reset-complete", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: values.password,
          uidb64: uidb64,
          token: token,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error) {
          toast({
            title: "Password reset failed",
            description: data.error,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Password reset failed",
            description: "Failed to update your password. Please try again.",
            variant: "destructive",
          })
        }
        return
      }

      setIsSuccess(true)
      toast({
        title: "Password successfully reset",
        description: "You can now login with your new password.",
      })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    } catch (error) {
      console.error("Password reset error:", error)
      toast({
        title: "Password reset failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
        <Card className="w-full max-w-md mx-auto animate-fade-in shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
              Reset Your Password
            </CardTitle>
            <CardDescription>Create a new password for your account</CardDescription>
          </CardHeader>
          <CardContent>
            {isValidating ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">Validating your reset token...</p>
              </div>
            ) : !isValid ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => router.push("/auth/reset-password")}
                >
                  Request New Reset Link
                </Button>
              </Alert>
            ) : isSuccess ? (
              <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-300">
                  Your password has been successfully reset! You will be redirected to the login page in a moment.
                </AlertDescription>
              </Alert>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <div className="relative">
                          <FormControl>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                className={`peer h-14 w-full rounded-md border bg-background px-4 pt-4 pb-1.5 text-sm ring-offset-background
                                  placeholder-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                  disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 pr-10
                                  ${fieldState.error ? "border-destructive" : "border-input"}`}
                                placeholder=" "
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-0"
                                tabIndex={-1}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                              <label
                                className={`absolute left-4 top-4 z-10 origin-[0] transform text-sm duration-200 ease-out
                                  ${(field.value || field.value === "") && "-translate-y-2 scale-75 text-xs"}
                                  ${fieldState.error ? "text-destructive" : "text-muted-foreground"}`}
                              >
                                New Password
                              </label>
                            </div>
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <div className="relative">
                          <FormControl>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                className={`peer h-14 w-full rounded-md border bg-background px-4 pt-4 pb-1.5 text-sm ring-offset-background
                                  placeholder-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                  disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 pr-10
                                  ${fieldState.error ? "border-destructive" : "border-input"}`}
                                placeholder=" "
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-0"
                                tabIndex={-1}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                              <label
                                className={`absolute left-4 top-4 z-10 origin-[0] transform text-sm duration-200 ease-out
                                  ${(field.value || field.value === "") && "-translate-y-2 scale-75 text-xs"}
                                  ${fieldState.error ? "text-destructive" : "text-muted-foreground"}`}
                              >
                                Confirm New Password
                              </label>
                            </div>
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Password...
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
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Back to Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </PageTransition>
  )
}

