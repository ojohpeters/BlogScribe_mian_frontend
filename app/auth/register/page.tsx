"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, AlertTriangle, HelpCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Register() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [wordpressUsername, setWordpressUsername] = useState("")
  const [wordpressUsernameConfirm, setWordpressUsernameConfirm] = useState("")
  const [wordpressPassword, setWordpressPassword] = useState("")
  const [wordpressUrl, setWordpressUrl] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showWpPassword, setShowWpPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const returnUrl = searchParams.get("returnUrl") || "/auth/login"

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent multiple submissions
    if (isSubmitting) return

    // Validate terms agreement
    if (!agreedToTerms) {
      setErrors({ terms: ["You must agree to the Terms and Conditions"] })
      return
    }

    // Validate WordPress username confirmation
    if (wordpressUsername !== wordpressUsernameConfirm) {
      setErrors({ wordpress_username_confirm: ["WordPress usernames do not match"] })
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const response = await fetch("https://blogbackend-crimson-frog-3248.fly.dev/api/users/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          wordpress_username: wordpressUsername,
          wordpress_password: wordpressPassword,
          wordpress_url: wordpressUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors(data)
        return
      }

      toast({
        title: "Registration successful",
        description:
          "Your account has been created. Please check your email (including spam folder) for a verification link.",
      })

      // Redirect to login with the return URL preserved
      router.push(returnUrl === "/auth/login" ? returnUrl : `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`)
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleWpPasswordVisibility = () => {
    setShowWpPassword(!showWpPassword)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full max-w-[450px] mx-auto">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold tracking-tight">Register</CardTitle>
            <Link
              href="/how-to-use"
              className="flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              How to use
            </Link>
          </div>
          <CardDescription>
            Create a new account
            {returnUrl !== "/auth/login" && (
              <p className="mt-1 text-sm text-primary">You'll need to log in after registration</p>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-11"
                />
                {errors.username && <p className="text-sm text-destructive">{errors.username[0]}</p>}
              </div>
              <div className="space-y-2">
                <Input
                  id="email"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email[0]}</p>}
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="password"
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password[0]}</p>}
              </div>

              <Alert variant="warning" className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  WordPress username cannot be changed after registration. Please enter it carefully.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Input
                  id="wordpress_username"
                  placeholder="WordPress Username"
                  value={wordpressUsername}
                  onChange={(e) => setWordpressUsername(e.target.value)}
                  required
                  className="h-11"
                />
                {errors.wordpress_username && (
                  <p className="text-sm text-destructive">{errors.wordpress_username[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  id="wordpress_username_confirm"
                  placeholder="Confirm WordPress Username"
                  value={wordpressUsernameConfirm}
                  onChange={(e) => setWordpressUsernameConfirm(e.target.value)}
                  required
                  className="h-11"
                />
                {errors.wordpress_username_confirm && (
                  <p className="text-sm text-destructive">{errors.wordpress_username_confirm[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="wordpress_password"
                    placeholder="WordPress Application Password"
                    type={showWpPassword ? "text" : "password"}
                    value={wordpressPassword}
                    onChange={(e) => setWordpressPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={toggleWpPasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    tabIndex={-1}
                    aria-label={showWpPassword ? "Hide WordPress password" : "Show WordPress password"}
                  >
                    {showWpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.wordpress_password && (
                  <p className="text-sm text-destructive">{errors.wordpress_password[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  id="wordpress_url"
                  placeholder="WordPress URL"
                  type="url"
                  value={wordpressUrl}
                  onChange={(e) => setWordpressUrl(e.target.value)}
                  required
                  className="h-11"
                />
                {errors.wordpress_url && <p className="text-sm text-destructive">{errors.wordpress_url[0]}</p>}
              </div>
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline" target="_blank">
                    Terms and Conditions
                  </Link>
                </label>
              </div>
              {errors.terms && <p className="text-sm text-destructive pt-1">{errors.terms[0]}</p>}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full h-11 text-base" onClick={handleRegister} disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </Button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Not sure how to get started?{" "}
              <Link href="/how-to-use" className="text-primary hover:underline font-medium">
                View our guide
              </Link>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Already have an account?{" "}
              <Link
                href={`/auth/login${returnUrl !== "/auth/login" ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`}
                className="text-primary hover:underline font-medium"
              >
                Log in
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

