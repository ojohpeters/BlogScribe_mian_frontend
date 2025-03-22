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
import { FloatingLabelInput } from "@/components/ui/floating-label-input"
import { PageTransition } from "@/components/page-transition"
import { Loader2 } from "lucide-react"
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput label="Username" error={fieldState.error?.message} {...field} />
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
                        <FloatingLabelInput
                          label="Password"
                          type="password"
                          error={fieldState.error?.message}
                          {...field}
                        />
                      </FormControl>
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
            <div className="text-sm text-center text-muted-foreground">
            <Link href="/reset-password" className="text-primary hover:underline font-medium">
              Forgot password?
            </Link>
          </div>

          </CardFooter>
        </Card>
      </div>
    </PageTransition>
  )
}

