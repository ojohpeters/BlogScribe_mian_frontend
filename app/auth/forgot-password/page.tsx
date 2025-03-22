"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle } from "lucide-react"
import { PageTransition } from "@/components/page-transition"

// Define the form schema with validation
const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Initialize form with zod resolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isLoading) return

    setIsLoading(true)

    try {
      const response = await fetch("https://blogbackend-crimson-frog-3248.fly.dev/api/password-reset/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || "Failed to send password reset email")
      }

      // Success state
      setIsSuccess(true)
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      })
    } catch (error) {
      console.error("Password reset request error:", error)
      toast({
        title: "Failed to send reset email",
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
            <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
            <CardDescription>Enter your email address and we'll send you a link to reset your password</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium">Check Your Email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to your email address. Please check your inbox and follow the
                  instructions to reset your password.
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email address" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Reset Link...
                      </>
                    ) : (
                      "Send Reset Link"
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

