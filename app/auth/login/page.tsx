"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { PageTransition } from "@/components/page-transition"
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUser } from "@/lib/user-context"

const formSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
})

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const returnUrl = searchParams.get("returnUrl") || "/dashboard"
  const { fetchUserData } = useUser()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Prevent multiple submissions
    if (isSubmitting) return

    setIsLoading(true)
    setIsSubmitting(true)
    setEmailNotVerified(false)

    try {
      console.log("Sending login request with:", values)

      const response = await fetch("https://blogbackend-crimson-frog-3248.fly.dev/api/users/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      console.log("Login response status:", response.status)
      const data = await response.json()
      console.log("Login response data:", data)

      if (!response.ok) {
        // Check for email verification error
        if (data.detail === "Email Not Verified") {
          setEmailNotVerified(true)
          // Try to extract email from username if it looks like an email
          if (values.username.includes("@")) {
            setUserEmail(values.username)
          }
          return
        }

        if (data.detail) {
          toast({
            title: "Login failed",
            description: data.detail,
            variant: "destructive",
          })
        } else {
          // Only set errors once
          if (data.username) {
            form.setError("username", {
              message: data.username[0],
            })
          }
          if (data.password) {
            form.setError("password", {
              message: data.password[0],
            })
          }
        }
        return
      }

      // Store both the access token and refresh token in localStorage
      localStorage.setItem("authToken", data.access)
      localStorage.setItem("refreshToken", data.refresh)

      // Fetch user data after successful login
      await fetchUserData()

      toast({
        title: "Login successful",
        description: "Welcome back!",
      })

      // Redirect to the return URL or dashboard
      router.push(returnUrl)
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsSubmitting(false)
    }
  }

  const handleVerificationRequest = () => {
    router.push(`/auth/verify-email${userEmail ? `?email=${encodeURIComponent(userEmail)}` : ""}`)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <PageTransition>
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
        <Card className="w-full max-w-md mx-auto animate-fade-in shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
              Login
            </CardTitle>
            <CardDescription>
              Enter your credentials to access your account
              {returnUrl !== "/dashboard" && (
                <span className="block mt-1 text-sm text-primary">You'll be redirected after login</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailNotVerified && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Your email is not verified. Please verify your email to continue.</AlertDescription>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={handleVerificationRequest}>
                  Get Verification Link
                </Button>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <input
                            className={`peer h-14 w-full rounded-md border bg-background px-4 pt-4 pb-1.5 text-sm ring-offset-background
                              placeholder-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                              disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200
                              ${fieldState.error ? "border-destructive" : "border-input"}`}
                            placeholder=" "
                            {...field}
                          />
                          <label
                            className={`absolute left-4 top-4 z-10 origin-[0] transform text-sm duration-200 ease-out
                              ${(field.value || field.value === "") && "-translate-y-2 scale-75 text-xs"}
                              ${fieldState.error ? "text-destructive" : "text-muted-foreground"}`}
                          >
                            Username
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
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
                            onClick={togglePasswordVisibility}
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
                            Password
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Link href="/auth/reset-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href={`/auth/register${returnUrl !== "/dashboard" ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </PageTransition>
  )
}

