"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { FloatingLabelInput } from "@/components/ui/floating-label-input"
import { PageTransition } from "@/components/page-transition"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

const formSchema = z.object({
  username: z.string().min(1, {
    message: "Please enter your username.",
  }),
})

export default function VerifyEmail() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const usernameParam = searchParams.get("username")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: usernameParam || "",
    },
  })

  // Update form value if username param changes
  useEffect(() => {
    if (usernameParam) {
      form.setValue("username", usernameParam)
    }
  }, [usernameParam, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    setIsSuccess(false)

    try {
      const response = await fetch("https://blogbackend-crimson-frog-3248.fly.dev/api/users/new-email-verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: values.username }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (typeof data.detail === "string") {
          toast({
            title: "Verification failed",
            description: data.detail,
            variant: "destructive",
          })
        } else if (data.username && Array.isArray(data.username)) {
          form.setError("username", {
            message: data.username[0],
          })
        } else {
          toast({
            title: "Verification failed",
            description: "An error occurred. Please try again.",
            variant: "destructive",
          })
        }
        return
      }

      setIsSuccess(true)
      toast({
        title: "Verification email sent",
        description: data.message || "Please check your email for the verification link.",
      })
    } catch (error) {
      console.error("Email verification error:", error)
      toast({
        title: "Verification failed",
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
              Verify Your Email
            </CardTitle>
            <CardDescription>Enter your username to receive a verification link</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-300">
                  Verification email sent! Please check your inbox and follow the link to verify your email address.
                </AlertDescription>
              </Alert>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingLabelInput
                            label="Username"
                            type="text"
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
                        Sending...
                      </>
                    ) : (
                      "Send Verification Link"
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

