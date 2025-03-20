"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertTriangle, ArrowLeft, Link, PenTool } from "lucide-react"
import { isAuthenticated, fetchWithAuth } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useLoadingState } from "@/lib/hooks/use-loading-state"

interface ParaphrasedContent {
  success?: boolean
  paraphrased_content?: string
  Post?: string
  Paraphrased?: string
  title?: string
  url?: string
  error?: string
  seo?: {
    meta_description: string
    focus_keywords: string[]
    seo_score: number
    readability_score: number
    keyword_density: Record<string, number>
    title_suggestions: string[]
  }
}

// Loading animation component
const BlogLoadingAnimation = ({ message }: { message: string }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-primary/10 animate-pulse"></div>
        <PenTool className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary animate-bounce" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-primary">{message}</p>
        <div className="flex space-x-2 justify-center">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  )
}

export default function UrlParaphrase() {
  const [url, setUrl] = useState("")
  const [paraphrasedText, setParaphrasedText] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const { toast } = useToast()
  const { isLoading, withLoading } = useLoadingState()

  // Add subscription status check
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please log in to access this page.",
        variant: "destructive",
      })
      router.push("/auth/login?returnUrl=" + encodeURIComponent(window.location.pathname))
      return
    }

    // Fetch subscription status and check plan
    const checkSubscription = async () => {
      try {
        const token = localStorage.getItem("authToken")
        if (!token) return

        const response = await fetch("http://127.0.0.1:8000/api/subscription/details/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log("URL Paraphraser - subscription data:", data)
          setSubscription(data)

          // Check if user has Ultimate plan - just set state, don't redirect
          if (data.status !== "active" || data.plan?.name !== "Ultimate") {
            toast({
              title: "Feature locked",
              description: "The URL Paraphraser is only available to Ultimate plan subscribers.",
              variant: "destructive",
            })
          }
        } else {
          console.error("Failed to fetch subscription details:", response.status)
          // If we can't fetch subscription details, assume no access
          toast({
            title: "Subscription check failed",
            description: "Unable to verify your subscription. Some features may be limited.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching subscription details:", error)
        toast({
          title: "Error",
          description: "An error occurred while checking your subscription.",
          variant: "destructive",
        })
      }
    }

    checkSubscription()
  }, [router, toast])

  const [subscription, setSubscription] = useState<any>(null)

  // Check if subscription is active
  const hasActivePlan = subscription?.status === "active"

  // Update the hasActivePlan check to also verify Ultimate plan
  const hasUltimatePlan = subscription?.status === "active" && subscription?.plan?.name === "Ultimate"

  // Update handleParaphrase to use the loading hook
  const handleParaphrase = async () => {
    if (!isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please log in to access this feature.",
        variant: "destructive",
      })
      router.push("/auth/login?returnUrl=" + encodeURIComponent(window.location.pathname))
      return
    }

    if (!url) {
      toast({
        title: "URL required",
        description: "Please enter a URL to paraphrase.",
        variant: "destructive",
      })
      return
    }

    setError("")
    setParaphrasedText("")

    try {
      await withLoading(async () => {
        const response = await fetchWithAuth(
          "http://127.0.0.1:8000/api/paraphrase/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url }),
          },
          router,
          toast,
        )

        if (!response.ok) {
          throw new Error("Failed to paraphrase content")
        }

        const data: ParaphrasedContent = await response.json()

        if (data.error) {
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          })
        } else {
          const paraphrasedContent = {
            ...data,
            content: data.Paraphrased || data.paraphrased_content || data.Post || "",
            originalUrl: url,
            originalTitle: data.title || "",
          }

          localStorage.setItem("paraphrasedContent", JSON.stringify(paraphrasedContent))
          router.push("/paraphrase")
          
          toast({
            title: "Success",
            description: "Content paraphrased successfully",
          })
        }
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to paraphrase content. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">URL Paraphrase</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Remove the loading state for subscription check */}
      {/* {isMounted && isAuthenticated() && (
        <Card className="mb-6">
          <CardContent className="p-0">
            <BlogLoadingAnimation message="Checking your subscription status..." />
          </CardContent>
        </Card>
      )} */}

      {/* Keep the subscription warning banner */}
      {isMounted && isAuthenticated() && !hasUltimatePlan && (
        <Card className="border-amber-300 dark:border-amber-700 mb-8">
          <CardHeader className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <CardTitle className="flex items-center text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              Premium Feature Locked
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              This feature is exclusive to Ultimate plan subscribers
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
              The URL Paraphraser allows you to instantly rewrite content from any URL with our advanced AI. Upgrade
              to the Ultimate plan to unlock this powerful feature and enhance your content creation workflow.
            </p>
            {subscription && subscription.plan && (
              <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Ultimate Plan Features:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-amber-700 dark:text-amber-300">
                    <CheckCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Unlimited daily requests</span>
                  </li>
                  <li className="flex items-start text-sm text-amber-700 dark:text-amber-300">
                    <CheckCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>URL content paraphrasing</span>
                  </li>
                  <li className="flex items-start text-sm text-amber-700 dark:text-amber-300">
                    <CheckCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Advanced SEO tools</span>
                  </li>
                  <li className="flex items-start text-sm text-amber-700 dark:text-amber-300">
                    <CheckCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>
            )}
            <div className="flex justify-center">
              <Button
                onClick={() => router.push("/dashboard/subscription")}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Upgrade to Ultimate Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Enter URL to Paraphrase</CardTitle>
          <CardDescription>
            Provide a URL of the content you want to paraphrase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">URL</label>
            </div>
            <Input
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
              disabled={isLoading}
            />
          </div>

          {isLoading ? (
            <Card className="border-primary/20">
              <CardContent className="p-0">
                <BlogLoadingAnimation message="Paraphrasing your content..." />
              </CardContent>
            </Card>
          ) : (
            <Button 
              onClick={handleParaphrase} 
              disabled={isLoading || !hasUltimatePlan} 
              className="w-full"
            >
              Paraphrase Content
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}