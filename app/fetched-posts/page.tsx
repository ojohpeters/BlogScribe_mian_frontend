"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ExternalLink, RefreshCw, Clock } from "lucide-react"
import { isAuthenticated, fetchWithAuth } from "@/lib/utils"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface FetchedPost {
  id: number
  title: string
  source: string
  created_at: string
  user: number
}

export default function FetchedPosts() {
  const [posts, setPosts] = useState<FetchedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isParaphrasing, setIsParaphrasing] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  // Add subscription status check
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please log in to view your fetched posts.",
        variant: "destructive",
      })
      router.push("/auth/login?returnUrl=" + encodeURIComponent(window.location.pathname))
      return
    }

    // Fetch subscription status first
    fetchSubscriptionStatus()
    fetchPosts()
  }, [router, toast])

  const [subscription, setSubscription] = useState<any>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)

  const fetchSubscriptionStatus = async () => {
    setIsLoadingSubscription(true)
    try {
      const response = await fetchWithAuth("http://127.0.0.1:8000/api/subscription/details/", {}, router, toast)

      if (response.ok) {
        const data = await response.json()
        console.log("Fetched posts - subscription data:", data)
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

  const fetchPosts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchWithAuth("http://127.0.0.1:8000/api/fetched", {}, router, toast)

      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error("Error fetching posts:", error)
      if (!(error instanceof Error && error.message === "Session expired")) {
        setError("Failed to load your fetched posts. Please try again.")
        toast({
          title: "Error fetching posts",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Update handleParaphrase to check subscription status
  const handleParaphrase = async (post: FetchedPost) => {
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

    setIsParaphrasing(post.id)
    try {
      const response = await fetchWithAuth(
        "http://127.0.0.1:8000/api/paraphrase/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: post.title, url: post.source }),
        },
        router,
        toast,
      )

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
          // Don't throw an error here, just return to avoid double error messages
          return
        }
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
          description: "An error occurred while paraphrasing. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsParaphrasing(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a")
    } catch (error) {
      return "Invalid date"
    }
  }

  const handleLogout = () => {
    // This function is now handled in the layout
    router.push("/")
  }

  // Filter posts based on search term
  const filteredPosts = posts.filter((post) => post.title.toLowerCase().includes(searchTerm.toLowerCase()))

  // Add subscription warning banner
  return (
    <div className="container mx-auto px-4 py-8 pb-safe">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Fetched Posts</h1>
        <Button onClick={fetchPosts} disabled={isLoading} variant="outline">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      {/* Add subscription warning banner */}
      {isLoadingSubscription ? (
        <div className="flex items-center justify-center h-12 mb-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-muted-foreground">Checking subscription status...</span>
        </div>
      ) : (
        !hasActivePlan && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Subscription expired</h3>
                <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                  <p>
                    Your subscription has expired. You can view posts but paraphrasing is unavailable.{" "}
                    <a
                      href="/dashboard/subscription"
                      className="font-medium underline hover:text-amber-800 dark:hover:text-amber-100"
                    >
                      Renew now
                    </a>{" "}
                    to regain full access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      <div className="relative mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search posts..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center mt-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading your posts...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchPosts}>Try Again</Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <h3 className="text-lg font-medium mb-2">No posts found</h3>
          <p className="text-muted-foreground mb-4">You haven't fetched any posts yet.</p>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium line-clamp-2" title={post.title}>
                  {post.title}
                </CardTitle>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDate(post.created_at)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground break-all line-clamp-2" title={post.source}>
                  {post.source}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between pt-0">
                <Button variant="outline" size="sm" onClick={() => window.open(post.source, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleParaphrase(post)}
                  disabled={isParaphrasing !== null || !hasActivePlan}
                  className={isParaphrasing === post.id ? "bg-primary text-primary-foreground" : ""}
                >
                  {isParaphrasing === post.id ? (
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
      )}

      {filteredPosts.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No posts match your search criteria.</p>
        </div>
      )}
    </div>
  )
}

