"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import PostList from "./post-list"
import ParaphrasePreview from "./paraphrase-preview"
import SEOForm from "./seo-form"
import PaymentPlan from "./payment-plan"
import type { BlogPost, ParaphraseResponse } from "@/types/blog"

const STORAGE_KEY = "wordpress_blog_posts"
const API_BASE_URL = "https://blogbackend-crimson-frog-3248.fly.dev"
const REQUEST_LIMIT = 5
const REQUEST_TIMEOUT = 60 * 1000 // 1 minute

export default function BlogPostManager() {
  const [posts, setPosts] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isParaphrasing, setIsParaphrasing] = useState(false)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [paraphrasedContent, setParaphrasedContent] = useState<string>("")
  const [requestCount, setRequestCount] = useState(0)
  const [lastRequestTime, setLastRequestTime] = useState(0)
  const [currentPlan, setCurrentPlan] = useState("PLAN1")
  const { toast } = useToast()

  // Load posts from local storage on initial render
  useEffect(() => {
    const storedPosts = localStorage.getItem(STORAGE_KEY)
    if (storedPosts) {
      try {
        setPosts(JSON.parse(storedPosts))
      } catch (error) {
        console.error("Failed to parse stored posts:", error)
      }
    }
  }, [])

  // Save posts to local storage when they change
  useEffect(() => {
    if (Object.keys(posts).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
    }
  }, [posts])

  // Reset request count after timeout
  useEffect(() => {
    if (requestCount > 0 && Date.now() - lastRequestTime > REQUEST_TIMEOUT) {
      setRequestCount(0)
    }
  }, [requestCount, lastRequestTime])

  const fetchPosts = async () => {
    // Prevent duplicate requests
    if (isLoading) return

    if (requestCount >= REQUEST_LIMIT) {
      toast({
        title: "Request limit reached",
        description: "You have reached your daily request limit. Please try again tomorrow or upgrade your plan.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/get_posts/`)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setPosts(data)
      setRequestCount((prev) => prev + 1)
      setLastRequestTime(Date.now())

      toast({
        title: "Posts fetched successfully",
        description: `Retrieved ${Object.keys(data).length} posts. You have ${REQUEST_LIMIT - requestCount - 1} requests left today.`,
      })
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast({
        title: "Failed to fetch posts",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleParaphrase = async (post: BlogPost) => {
    setSelectedPost(post)
    setIsParaphrasing(true)
    setParaphrasedContent("")

    try {
      const response = await fetch(`${API_BASE_URL}/api/paraphrase/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: post.title,
          url: post.url,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data: ParaphraseResponse = await response.json()

      if (data.error) {
        throw new Error(data.error)
      } else if (data.Paraphrased) {
        setParaphrasedContent(data.Paraphrased)
      } else if (data.Post) {
        setParaphrasedContent(data.Post)
      }

      toast({
        title: "Paraphrasing complete",
        description: "Content has been paraphrased successfully.",
      })
    } catch (error) {
      console.error("Error paraphrasing post:", error)
      toast({
        title: "Failed to paraphrase post",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsParaphrasing(false)
    }
  }

  const handlePlanChange = (plan: string) => {
    setCurrentPlan(plan)
    // Reset request count when upgrading to a new plan
    setRequestCount(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button onClick={fetchPosts} disabled={isLoading || requestCount >= REQUEST_LIMIT} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching Posts...
            </>
          ) : (
            `Get Posts (${REQUEST_LIMIT - requestCount} left)`
          )}
        </Button>
        <div className="text-sm text-muted-foreground">
          {Object.keys(posts).length > 0 && <span>{Object.keys(posts).length} posts available</span>}
        </div>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="paraphrase">Writer Preview</TabsTrigger>
          <TabsTrigger value="seo">SEO Metadata</TabsTrigger>
          <TabsTrigger value="plan">Payment Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <PostList
            posts={posts}
            onParaphrase={handleParaphrase}
            isParaphrasing={isParaphrasing}
            selectedPostUrl={selectedPost?.url}
          />
        </TabsContent>

        <TabsContent value="paraphrase" className="mt-6">
          <ParaphrasePreview post={selectedPost} paraphrasedContent={paraphrasedContent} isLoading={isParaphrasing} />
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <SEOForm selectedPost={selectedPost} />
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          <PaymentPlan currentPlan={currentPlan} onPlanChange={handlePlanChange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

