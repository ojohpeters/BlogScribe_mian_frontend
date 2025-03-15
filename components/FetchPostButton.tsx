"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ExternalLink, RefreshCw } from "lucide-react"
import { isAuthenticated } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface Post {
  title: string
  url: string
}

export default function FetchPostButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isParaphrasing, setIsParaphrasing] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const { toast } = useToast()
  const router = useRouter()

  // Add subscription status check
  useEffect(() => {
    // Only check if user is authenticated
    if (isAuthenticated()) {
      fetchSubscriptionStatus()
    }
  }, [])

  const [subscription, setSubscription] = useState<any>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)

  const fetchSubscriptionStatus = async () => {
    setIsLoadingSubscription(true)
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
        console.log("FetchPostButton - subscription data:", data)
        setSubscription(data)
      } else {
        console.error("Failed to fetch subscription details:", response.status)
      }
    } catch (error) {
      console.error("Error fetching subscription details:", error)
    } finally {
      setIsLoadingSubscription(false)
    }
  }

  // Check if subscription is active
  const hasActivePlan = subscription?.status === "active"

  const fetchPost = async () => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please log in to fetch and manage posts.",
        variant: "destructive",
      })
      router.push("/auth/login?returnUrl=" + encodeURIComponent(window.location.pathname))
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch("http://127.0.0.1:8000/api/posted/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch posts")
      }
      const data = await response.json()

      // Convert the data to an array of posts if it's an object
      let postsArray: Post[] = []
      if (typeof data === "object" && !Array.isArray(data)) {
        postsArray = Object.entries(data).map(([title, url]) => ({
          title,
          url: url as string,
        }))
      } else if (Array.isArray(data)) {
        postsArray = data
      }

      setPosts(postsArray)
      toast({
        title: "Posts fetched successfully",
        description: `Retrieved ${postsArray.length} posts.`,
      })
    } catch (error) {
      toast({
        title: "Error fetching posts",
        description: "An error occurred while fetching posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update handleParaphrase to check subscription status
  const handleParaphrase = async (title: string, url: string) => {
    if (!isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please log in to paraphrase posts.",
        variant: "destructive",
      })
      router.push("/auth/login?returnUrl=" + encodeURIComponent(window.location.pathname))
      return
    }

    // Check if user has active plan before making the request
    if (isAuthenticated() && !hasActivePlan) {
      toast({
        title: "Subscription required",
        description: "Your subscription has expired. Please renew to use this feature.",
        variant: "destructive",
      })
      router.push("/dashboard/subscription")
      return
    }

    setIsParaphrasing(url)
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch("http://127.0.0.1:8000/api/paraphrase/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, url }),
      })

      // Check for subscription-related errors
      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json()
          if (errorData.detail && errorData.detail.includes("subscription")) {
            toast({
              title: "Subscription required",
              description: "Your subscription has expired. Please renew to use this feature.",
              variant: "destructive",
            })
            router.push("/dashboard/subscription")
            return
          }
        }
        // Don't throw an error here, just return to avoid double error messages
        return
      }

      const data = await response.json()

      if (data.error) {
        // Check if error is subscription related
        if (data.error.toLowerCase().includes("subscription")) {
          toast({
            title: "Subscription required",
            description: "Your subscription has expired. Please renew to use this feature.",
            variant: "destructive",
          })
          router.push("/dashboard/subscription")
          return
        }

        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      // Store the paraphrased content in localStorage
      localStorage.setItem("paraphrasedContent", JSON.stringify(data))

      // Redirect to the paraphrase page
      router.push("/paraphrase")
    } catch (error) {
      // Only show error message if it wasn't already handled
      if (!(error instanceof Error && error.message === "Session expired")) {
        toast({
          title: "Error paraphrasing post",
          description: "An error occurred while paraphrasing the post. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsParaphrasing(null)
    }
  }

  return (
    <div className="space-y-6">
      <Button onClick={fetchPost} disabled={isLoading} className="mx-auto">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Fetching...
          </>
        ) : (
          "Try Now"
        )}
      </Button>

      {posts.length > 0 && (
        <div className="mt-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold mb-4">Retrieved Posts</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((post, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium line-clamp-2" title={post.title}>
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground break-all line-clamp-2" title={post.url}>
                    {post.url}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <Button variant="outline" size="sm" onClick={() => window.open(post.url, "_blank")}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleParaphrase(post.title, post.url)}
                    disabled={isParaphrasing !== null || !hasActivePlan}
                    className={isParaphrasing === post.url ? "bg-primary text-primary-foreground" : ""}
                  >
                    {isParaphrasing === post.url ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Paraphrase"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!isAuthenticated() && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">You need to be logged in to fetch and paraphrase posts.</p>
          <div className="flex justify-center gap-2">
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

