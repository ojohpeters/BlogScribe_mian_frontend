"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft, RefreshCw, X, PenTool } from "lucide-react"
import { isAuthenticated, fetchWithAuth } from "@/lib/utils"
import dynamic from "next/dynamic"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

// Import the full-featured markdown editor
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-muted">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
})

// Custom toolbar items for the editor
const toolbarItems = [
  "bold",
  "italic",
  "strikethrough",
  "|",
  "quote",
  "code",
  "codeblock",
  "|",
  "head-1",
  "head-2",
  "head-3",
  "|",
  "ordered-list",
  "unordered-list",
  "|",
  "link",
  "image",
  "|",
  "table",
  "|",
  "preview",
  "fullscreen",
]

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

interface SeoAnalysis {
  score: number
  suggestions: {
    type: "success" | "warning" | "error"
    message: string
  }[]
  keywordDensity: Record<string, number>
  readabilityScore: number
  titleSuggestions: string[]
}

interface SeoAnalytics {
  initialScore: number
  currentScore: number
  keywordRankings: {
    keyword: string
    initialRank: number
    currentRank: number
  }[]
  trafficStats: {
    organic: number
    social: number
    referral: number
  }
  engagement: {
    timeOnPage: number
    bounceRate: number
    shares: number
  }
}

interface PublishSettings {
  title: string
  status: "publish" | "draft"
  categories: string[]
  tags: string[]
  featuredImage: File | null
}

interface WordPressCategory {
  [id: string]: string
}

interface WordPressTag {
  [id: string]: string
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

export default function Paraphrase() {
  const [content, setContent] = useState("")
  const [originalTitle, setOriginalTitle] = useState("")
  const [originalUrl, setOriginalUrl] = useState("")
  const [wordLength, setWordLength] = useState([500])
  const [keyword, setKeyword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // New state variables for publish settings
  const [title, setTitle] = useState("")
  const [publishSettings, setPublishSettings] = useState<PublishSettings>({
    title: "",
    status: "publish",
    categories: [],
    tags: [],
    featuredImage: null,
  })
  const [categories, setCategories] = useState<WordPressCategory>({})
  const [tags, setTags] = useState<WordPressTag>({})
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [showPublishSettings, setShowPublishSettings] = useState(false)

  // Calculate word count
  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  // Extract title from content (first two lines)
  useEffect(() => {
    if (content) {
      const contentLines = content.split("\n")
      const extractedTitle = contentLines.slice(0, 2).join("\n").trim()
      setTitle(extractedTitle)
      setPublishSettings((prev) => ({ ...prev, title: extractedTitle }))
    }
  }, [content])

  // Update content when title changes
  const updateTitleInContent = (newTitle: string) => {
    const contentLines = content.split("\n")
    const bodyContent = contentLines.slice(2).join("\n")
    setContent(`${newTitle}\n\n${bodyContent}`)
  }

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

    // Fetch subscription status
    fetchSubscriptionStatus()

    // Load WordPress categories and tags from localStorage
    loadWordPressData()

    const storedContent = localStorage.getItem("paraphrasedContent")
    if (storedContent) {
      try {
        const parsedContent: ParaphrasedContent = JSON.parse(storedContent)

        // Handle different response formats including the new one
        if (parsedContent.Paraphrased) {
          setContent(parsedContent.Paraphrased)
        } else if (parsedContent.paraphrased_content) {
          setContent(parsedContent.paraphrased_content)
        } else if (parsedContent.Post) {
          setContent(parsedContent.Post)
        }

        // Set original title and URL if available
        if (parsedContent.title) {
          setOriginalTitle(parsedContent.title)
        }
        if (parsedContent.url) {
          setOriginalUrl(parsedContent.url)
        }

        setIsInitializing(false)
      } catch (error) {
        console.error("Error parsing stored content:", error)
        toast({
          title: "Error",
          description: "Failed to load paraphrased content.",
          variant: "destructive",
        })
        router.push("/make-post")
      }
    } else {
      toast({
        title: "No content found",
        description: "Please select a post to paraphrase first.",
      })
      router.push("/make-post")
    }
  }, [router, toast])

  // Load WordPress categories and tags
  const loadWordPressData = () => {
    try {
      // Only load if user is authenticated (to ensure user-specific data)
      if (isAuthenticated()) {
        const storedCategories = localStorage.getItem("wordpress_categories")
        const storedTags = localStorage.getItem("wordpress_tags")

        if (storedCategories) {
          setCategories(JSON.parse(storedCategories))
        }

        if (storedTags) {
          setTags(JSON.parse(storedTags))
        }

        // Load selected category if available
        const selectedCategory = localStorage.getItem("selected_category")
        if (selectedCategory) {
          setPublishSettings((prev) => ({
            ...prev,
            categories: [selectedCategory],
          }))
        }

        // Load selected tags if available
        const selectedTags = localStorage.getItem("selected_tags")
        if (selectedTags) {
          setPublishSettings((prev) => ({
            ...prev,
            tags: JSON.parse(selectedTags),
          }))
        }
      }
    } catch (error) {
      console.error("Error loading WordPress data:", error)
    }
  }

  const [subscription, setSubscription] = useState<any>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)

  const fetchSubscriptionStatus = async () => {
    setIsLoadingSubscription(true)
    try {
      const response = await fetchWithAuth("https://blogbackend-crimson-frog-3248.fly.dev/api/subscription/details/", {}, router, toast)

      if (response.ok) {
        const data = await response.json()
        console.log("Paraphrase page - subscription data:", data)
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

  // Update the handleParaphraseAgain function to use fetchWithAuth
  const handleParaphraseAgain = async () => {
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

    setIsLoading(true)
    try {
      const response = await fetchWithAuth(
        "https://blogbackend-crimson-frog-3248.fly.dev/api/reparaphrase/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            word_length: wordLength[0],
            keyword,
            url: originalUrl,
            title: originalTitle,
          }),
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
      } else if (data.Paraphrased) {
        setContent(data.Paraphrased)
        localStorage.setItem("paraphrasedContent", JSON.stringify(data))
        toast({
          title: "Success",
          description: "Content paraphrased successfully",
        })
      } else if (data.success || data.Post) {
        // Update content based on response format
        if (data.paraphrased_content) {
          setContent(data.paraphrased_content)
        } else if (data.Post) {
          setContent(data.Post)
        }

        // Update localStorage
        localStorage.setItem("paraphrasedContent", JSON.stringify(data))

        toast({
          title: "Success",
          description: "Content paraphrased successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to paraphrase. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle featured image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPublishSettings((prev) => ({ ...prev, featuredImage: file }))

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    setPublishSettings((prev) => ({
      ...prev,
      categories: [categoryId], // For now, just support one category
    }))
  }

  // Handle tag selection
  const handleTagToggle = (tagId: string) => {
    setPublishSettings((prev) => {
      const newTags = prev.tags.includes(tagId) ? prev.tags.filter((id) => id !== tagId) : [...prev.tags, tagId]

      return {
        ...prev,
        tags: newTags,
      }
    })
  }

  // Update the handlePublish function to use FormData
  const handlePublish = async () => {
    if (!publishSettings.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your post.",
        variant: "destructive",
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content for your post.",
        variant: "destructive",
      })
      return
    }

    setIsPublishing(true)
    try {
      const formData = new FormData()

      // Split content into title and body
      const contentLines = content.split("\n")
      const bodyContent = contentLines.slice(2).join("\n").trim()

      formData.append("title", publishSettings.title)
      formData.append("content", bodyContent)
      formData.append("status", publishSettings.status)

      // Add categories
      publishSettings.categories.forEach((categoryId) => {
        formData.append("categories", categoryId)
      })

      // Add tags
      publishSettings.tags.forEach((tagId) => {
        formData.append("tags", tagId)
      })

      // Add featured image if available
      if (publishSettings.featuredImage) {
        formData.append("image", publishSettings.featuredImage)
      }

      const response = await fetchWithAuth(
        "https://blogbackend-crimson-frog-3248.fly.dev/api/publish/",
        {
          method: "POST",
          body: formData,
        },
        router,
        toast,
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to publish post")
      }

      const data = await response.json()

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Content published successfully",
        })

        // Clear localStorage
        localStorage.removeItem("paraphrasedContent")

        // Redirect to WordPress management
        router.push("/wordpress-management")
      }
    } catch (error) {
      console.error("Publish error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish post",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    setPublishSettings((prev) => ({ ...prev, status: "draft" }))
    handlePublish()
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading paraphrased content...</p>
      </div>
    )
  }

  // Add subscription warning banner
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Paraphrase</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
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
                    Your subscription has expired. You can view content but paraphrasing again is unavailable.{" "}
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

      {originalTitle && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Original Post</CardTitle>
            <CardDescription>{originalTitle}</CardDescription>
          </CardHeader>
          {originalUrl && (
            <CardFooter className="pt-0">
              <Button variant="link" onClick={() => window.open(originalUrl, "_blank")} className="p-0">
                View original post
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title Field */}
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Post Title</CardTitle>
              <CardDescription>This will be the title of your WordPress post</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={publishSettings.title}
                onChange={(e) => {
                  setPublishSettings((prev) => ({ ...prev, title: e.target.value }))
                  updateTitleInContent(e.target.value)
                }}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none min-h-[80px] text-lg font-medium"
                placeholder="Enter your post title here..."
              />
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl sm:text-2xl">Paraphrased Content</CardTitle>
                  <CardDescription>Edit and review your paraphrased content</CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">Word Count: {wordCount}</div>
              </div>
            </CardHeader>
            <CardContent>
              <MDEditor value={content} onChange={(value) => setContent(value || "")} preview="live" height={400} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with settings */}
        <div className="space-y-6">
          {/* Paraphrase Settings */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Paraphrase Settings</CardTitle>
              <CardDescription>Adjust parameters and paraphrase the content again</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="wordLength" className="text-sm font-medium">
                    Word Length: {wordLength[0]}
                  </label>
                  <span className="text-sm text-muted-foreground">{wordLength[0]} words</span>
                </div>
                <Slider
                  id="wordLength"
                  min={100}
                  max={1000}
                  step={50}
                  value={wordLength}
                  onValueChange={setWordLength}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="keyword" className="text-sm font-medium">
                  Keyword
                </label>
                <Input
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Enter a keyword"
                />
              </div>
              <Button onClick={handleParaphraseAgain} disabled={isLoading || !hasActivePlan} className="w-full">
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Paraphrasing...
                  </>
                ) : (
                  "Paraphrase Again"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Publish Settings Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Publish Settings</CardTitle>
              <CardDescription>Configure your post before publishing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Post Status</label>
                <Select
                  value={publishSettings.status}
                  onValueChange={(value: "publish" | "draft") =>
                    setPublishSettings((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publish">Publish</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Featured Image */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Featured Image</label>
                <div className="grid gap-2">
                  <Input type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
                  {imagePreview && (
                    <div className="relative mt-2 rounded-md overflow-hidden border">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Featured image preview"
                        className="w-full h-32 object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={() => {
                          setImagePreview(null)
                          setPublishSettings((prev) => ({ ...prev, featuredImage: null }))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                {Object.keys(categories).length > 0 ? (
                  <Select value={publishSettings.categories[0] || ""} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categories).map(([id, name]) => (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No categories available. Visit the WordPress Management page to load categories.
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                {Object.keys(tags).length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {Object.entries(tags).map(([id, name]) => (
                      <div key={id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${id}`}
                          checked={publishSettings.tags.includes(id)}
                          onCheckedChange={() => handleTagToggle(id)}
                        />
                        <label htmlFor={`tag-${id}`} className="text-sm cursor-pointer truncate">
                          {name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No tags available. Visit the WordPress Management page to load tags.
                  </div>
                )}
              </div>

              {/* Publish Button */}
              <Button onClick={handlePublish} disabled={isPublishing} className="w-full">
                {isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : publishSettings.status === "publish" ? (
                  "Publish Now"
                ) : (
                  "Save as Draft"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Publish Settings Dialog */}
      <Dialog open={showPublishSettings} onOpenChange={setShowPublishSettings}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Publish Settings</DialogTitle>
            <DialogDescription>Configure your post before publishing to WordPress</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Post Title</label>
              <Input
                value={publishSettings.title}
                onChange={(e) => {
                  setPublishSettings((prev) => ({ ...prev, title: e.target.value }))
                  updateTitleInContent(e.target.value)
                }}
                placeholder="Enter post title"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Post Status</label>
              <Select
                value={publishSettings.status}
                onValueChange={(value: "publish" | "draft") =>
                  setPublishSettings((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publish">Publish</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Featured Image */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Featured Image</label>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div className="relative mt-2 rounded-md overflow-hidden border">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Featured image preview"
                    className="w-full h-32 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={() => {
                      setImagePreview(null)
                      setPublishSettings((prev) => ({ ...prev, featuredImage: null }))
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              {Object.keys(categories).length > 0 ? (
                <Select value={publishSettings.categories[0] || ""} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categories).map(([id, name]) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No categories available. Visit the WordPress Management page to load categories.
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              {Object.keys(tags).length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                  {Object.entries(tags).map(([id, name]) => (
                    <div key={id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-dialog-${id}`}
                        checked={publishSettings.tags.includes(id)}
                        onCheckedChange={() => handleTagToggle(id)}
                      />
                      <label htmlFor={`tag-dialog-${id}`} className="text-sm cursor-pointer truncate">
                        {name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No tags available. Visit the WordPress Management page to load tags.
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishSettings(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handlePublish()
                setShowPublishSettings(false)
              }}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : publishSettings.status === "publish" ? (
                "Publish Now"
              ) : (
                "Save as Draft"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

