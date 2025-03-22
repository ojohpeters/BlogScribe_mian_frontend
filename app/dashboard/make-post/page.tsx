"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ExternalLink, ArrowRight } from "lucide-react"
import { isAuthenticated, fetchWithAuth } from "@/lib/utils"
import { useUser } from "@/lib/user-context"
import { useSubscription } from "@/lib/subscription-context"

export default function MakePost() {
  const [posts, setPosts] = useState<{ title: string; url: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isParaphrasing, setIsParaphrasing] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useUser()
  const { hasActivePlan, isLoading: isLoadingSubscription } = useSubscription()

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

    // Get access token from localStorage
    const token = localStorage.getItem("authToken")
    setAccessToken(token)
  }, [router, toast])

  // Add error handling for subscription-related errors
  const fetchUrls = async () => {
    setIsLoading(true)
    try {
      const response = await fetchWithAuth(
        "https://blogbackend-crimson-frog-3248.fly.dev/api/fetch-news/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
        router,
        typeof toast === "function" ? toast : toast.toast,
      )

      if (!response.ok) {
        // Check for subscription-related errors
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
      const postsArray = Object.entries(data).map(([title, url]) => ({ title, url: url as string }))
      setPosts(postsArray)
      toast({
        title: "Posts fetched successfully",
        description: `Retrieved ${postsArray.length} posts.`,
      })
    } catch (error) {
      // Only show error message if it wasn't already handled
      if (!(error instanceof Error && error.message === "Session expired")) {
        toast({
          title: "Error fetching posts",
          description: "An error occurred while fetching posts. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleParaphrase function to use the subscription context
  const handleParaphrase = async (title: string, url: string) => {
    // Check if user has active plan before making the request
    if (!hasActivePlan) {
      toast({
        title: "Subscription required",
        description: "Your subscription has expired. Please renew to use this feature.",
        variant: "destructive",
      })
      router.push("/dashboard/subscription")
      return
    }

    setIsParaphrasing(true)
    try {
      const response = await fetchWithAuth(
        "https://blogbackend-crimson-frog-3248.fly.dev/api/paraphrase/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, url }),
        },
        router,
        toast,
      )

      if (!response.ok) {
        // Check for subscription-related errors
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

      // Don't throw an error here, just handle it directly
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
          title: "Paraphrasing error",
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
          title: "Error paraphrasing",
          description: "An error occurred while paraphrasing. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsParaphrasing(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Make Post</h2>

      {/* Add information card about fetched-posts page */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-800 dark:text-blue-200">Pro Tip: Quick Paraphrasing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 dark:text-blue-300">
            Looking for a faster way to paraphrase your posts? Check out the Fetched Posts page where you can directly
            paraphrase your content without additional steps.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/fetched-posts">
            <Button
              variant="outline"
              className="text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/50"
            >
              Go to Fetched Posts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Show loading indicator while checking subscription */}
      {isLoadingSubscription ? (
        <div className="flex items-center justify-center h-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-muted-foreground">Checking subscription status...</span>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Fetch Posts</CardTitle>
          <CardDescription>Retrieve the latest posts from your WordPress blog</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchUrls} disabled={isLoading} title={!accessToken ? "Please log in to fetch posts" : ""}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              "Get Posts"
            )}
          </Button>
          {!accessToken && (
            <p className="text-sm text-muted-foreground mt-2">You need to be logged in to fetch posts.</p>
          )}
        </CardContent>
      </Card>
      {posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Posts</CardTitle>
            <CardDescription>View or paraphrase your recent posts</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-6">
              {posts.map((post, index) => (
                <li key={index} className="flex flex-col space-y-2">
                  <div className="flex flex-col space-y-1">
                    <h3 className="font-medium line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{post.url}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-grow sm:flex-grow-0"
                      onClick={() => window.open(post.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Post
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-grow sm:flex-grow-0"
                      onClick={() => handleParaphrase(post.title, post.url)}
                      disabled={isParaphrasing || !hasActivePlan}
                    >
                      {isParaphrasing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Paraphrasing...
                        </>
                      ) : (
                        "Paraphrase"
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

