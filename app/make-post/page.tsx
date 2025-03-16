"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ExternalLink, ArrowRight, PenTool } from "lucide-react"
import { isAuthenticated, fetchWithAuth } from "@/lib/utils"
import { useUser } from "@/lib/user-context"
import { useSubscription } from "@/lib/subscription-context"
import { useLoadingState } from "@/lib/hooks/use-loading-state"

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

export default function MakePost() {
  const [posts, setPosts] = useState<{ title: string; url: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isParaphrasing, setIsParaphrasing] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useUser()
  const { hasActivePlan, isLoading: isLoadingSubscription } = useSubscription()
  const { withLoading } = useLoadingState()

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

    // Check if there are fetched posts in localStorage
    const fetchedPostsJson = localStorage.getItem("fetchedPosts")
    if (fetchedPostsJson) {
      try {
        const fetchedData = JSON.parse(fetchedPostsJson)
        // Convert the data to an array of posts
        const postsArray = Object.entries(fetchedData).map(([title, url]) => ({
          title,
          url: url as string,
        }))
        setPosts(postsArray)
        // Clear the localStorage after using it
        localStorage.removeItem("fetchedPosts")

        toast({
          title: "Posts loaded",
          description: `${postsArray.length} posts have been loaded from your recent fetch.`,
        })
      } catch (error) {
        console.error("Error parsing fetched posts:", error)
      }
    }
  }, [router, toast])

  // Update fetchUrls to use global loading
  const fetchUrls = async () => {
    setIsLoading(true)
    try {
      await withLoading(async () => {
        const response = await fetchWithAuth(
          "http://127.0.0.1:8000/api/fetch-news/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          },
          router,
          toast
        )

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
          return
        }

        const data = await response.json()
        const postsArray = Object.entries(data).map(([title, url]) => ({ title, url: url as string }))
        setPosts(postsArray)

        toast({
          title: "Posts fetched successfully",
          description: `Retrieved ${postsArray.length} posts.`,
        })
      })
    } catch (error) {
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

  // Update handleParaphrase to use global loading
  const handleParaphrase = async (title: string, url: string) => {
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
      await withLoading(async () => {
        const response = await fetchWithAuth(
          "http://127.0.0.1:8000/api/paraphrase/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ title, url }),
          },
          router,
          toast
        )

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
          return
        }

        const data = await response.json()

        if (data.error) {
          if (data.error.toLowerCase().includes("subscription")) {
            toast({
              title: "Subscription required",
              description: "Your subscription has expired. Please renew to use this feature.",
              variant: "destructive",
            })
            router.push("/dashboard/subscription")
            return
          }

          if (data.error === "Your daily request limit is reached") {
            toast({
              title: "Daily limit reached",
              description:
                "You've reached your daily request limit. Upgrade to a higher plan for more requests or try again tomorrow.",
              variant: "destructive",
            })
            router.push("/pricing")
            return
          }

          toast({
            title: "Paraphrasing error",
            description: data.error,
            variant: "destructive",
          })
          return
        }

        localStorage.setItem("paraphrasedContent", JSON.stringify(data))
        router.push("/paraphrase")
      })
    } catch (error) {
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
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-5xl">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
          Make Post
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Fetch posts from your WordPress site and paraphrase them to create unique content.
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Fetch Posts</CardTitle>
          <CardDescription>Get the latest posts from your WordPress site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {isLoading ? (
              <Card className="w-full border-primary/20">
                <CardContent className="p-0">
                  <BlogLoadingAnimation message="Fetching posts..." />
                </CardContent>
              </Card>
            ) : (
              <Button
                onClick={fetchUrls}
                disabled={isLoading}
                className="w-full sm:w-auto h-11"
              >
                Fetch Posts
              </Button>
            )}
            <Button
              variant="outline"
              asChild
              className="w-full sm:w-auto h-11"
            >
              <Link href="/url-paraphraser">
                Manual URL Input
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {posts.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Available Posts</CardTitle>
            <CardDescription>Select a post to paraphrase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {posts.map((post, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-base sm:text-lg line-clamp-2">{post.title}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate hover:underline"
                          >
                            {post.url}
                          </a>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleParaphrase(post.title, post.url)}
                        disabled={isParaphrasing}
                        className="w-full sm:w-auto h-11"
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoadingSubscription && !hasActivePlan && (
        <Card className="shadow-md bg-muted/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="font-semibold text-lg mb-2">Subscription Required</h3>
                <p className="text-sm text-muted-foreground">
                  Please subscribe to a plan to access this feature.
                </p>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/pricing">View Plans</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

