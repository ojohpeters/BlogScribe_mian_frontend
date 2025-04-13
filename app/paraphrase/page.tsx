"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft, RefreshCw, X, PenTool, BarChart2, Lock, Sparkles } from "lucide-react"
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
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Add a new import for the marked library at the top of the file
import { marked } from "marked"

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
    content?: string
    title?: string
    meta_description?: string
    focus_keywords?: string[]
  }
}

interface SeoAnalysis {
  score: number
  suggestions: {
    type: "success" | "warning" | "error"
    message: string
  }[]
  keywordDensity: Record<string, number>
  tfidfScores?: Record<string, number>
  readabilityScore: number
  titleSuggestions: string[]
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

// Add this debugging function at the top of the file, after the imports
const debugObject = (obj: any, label: string) => {
  console.log(`----- DEBUG ${label} -----`)
  console.log(JSON.stringify(obj, null, 2))
  console.log(`----- END ${label} -----`)
}

// Add a function to validate image size
const validateImageSize = (file: File, maxSizeKB = 250): boolean => {
  const fileSizeKB = file.size / 1024
  return fileSizeKB <= maxSizeKB
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

  // SEO state variables
  const [seoData, setSeoData] = useState<ParaphrasedContent["seo"] | null>(null)
  const [seoAnalysis, setSeoAnalysis] = useState<SeoAnalysis | null>(null)
  const [isAnalyzingSeo, setIsAnalyzingSeo] = useState(false)
  const [activeTab, setActiveTab] = useState("content")

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
  // Update the useEffect that loads the stored content to better debug the SEO data
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
        debugObject(parsedContent, "Parsed content from localStorage")

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

        // Set SEO data if available
        if (parsedContent.seo) {
          debugObject(parsedContent.seo, "SEO data found")
          setSeoData(parsedContent.seo)

          // Force a re-render by setting a dummy state
          setActiveTab((prev) => (prev === "content" ? "content" : "content"))
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
      const response = await fetchWithAuth(
        "https://blogbackend-crimson-frog-3248.fly.dev/api/subscription/details/",
        {},
        router,
        toast,
      )

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

  // Check if subscription is active and ultimate
  const hasActivePlan = subscription?.status === "active"
  const hasUltimatePlan = hasActivePlan && subscription?.plan?.name?.toLowerCase() === "ultimate"

  // Update the handleParaphraseAgain function to use fetchWithAuth
  // Update the handleParaphraseAgain function to better handle SEO data
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
      // Create request payload
      const payload = {
        content,
        lenght: wordLength[0],
        keyword,
        title: originalTitle,
        meta_description: seoData?.meta_description || "",
        focus_keywords: seoData?.focus_keywords || [],
      }

      debugObject(payload, "Paraphrase request payload")

      const response = await fetchWithAuth(
        "https://blogbackend-crimson-frog-3248.fly.dev/api/reparaphrase/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
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
      debugObject(data, "Paraphrase response")

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

        // Check if SEO data is available
        if (data.seo) {
          debugObject(data.seo, "SEO data received")
          setSeoData(data.seo)

          // Force a re-render
          setActiveTab((prev) => (prev === "content" ? "content" : "content"))
        }

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
      console.error("Error in paraphrase:", error)
      toast({
        title: "Error",
        description: "Failed to paraphrase. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle SEO analysis
  const handleAnalyzeSeo = async () => {
    if (!hasUltimatePlan) {
      toast({
        title: "Ultimate Plan Required",
        description: "SEO analysis is only available for Ultimate plan subscribers.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzingSeo(true)
    try {
      // Extract a meta description from the content if not available
      const extractedMetaDescription =
        content && content.length > 0 ? content.split("\n").slice(2).join(" ").substring(0, 160) : ""

      // Safely extract potential focus keywords from the content
      let extractedKeywords: string[] = []

      try {
        if (content && content.length > 0) {
          const contentWords = content.toLowerCase().split(/\s+/)
          const stopWords = ["the", "and", "a", "an", "in", "on", "at", "to", "for", "with", "by", "of", "is", "are"]

          const potentialKeywords: Record<string, number> = {}
          contentWords
            .filter((word) => word && word.length > 3 && !stopWords.includes(word))
            .filter((word) => /^[a-z]+$/.test(word)) // Only include words with letters
            .forEach((word) => {
              potentialKeywords[word] = (potentialKeywords[word] || 0) + 1
            })

          // Get top 3 keywords
          extractedKeywords = Object.entries(potentialKeywords || {})
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([word]) => word)
        }
      } catch (keywordError) {
        console.error("Error extracting keywords:", keywordError)
        extractedKeywords = []
      }

      // Safely use SEO data if available
      const metaDescription = seoData?.meta_description || extractedMetaDescription || ""
      const focusKeywords = seoData?.focus_keywords || extractedKeywords || []

      console.log("SEO Analysis Request:", {
        content: content ? `Length: ${content.length}` : "No content",
        title: publishSettings.title || "No title",
        keyword: keyword || "No keyword",
        metaDescription: metaDescription || "No meta description",
        focusKeywords: focusKeywords.length ? focusKeywords : "No focus keywords",
      })

      const response = await fetchWithAuth(
        "https://blogbackend-crimson-frog-3248.fly.dev/api/analyze-seo/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content || "",
            title: publishSettings.title || "",
            keyword: keyword || "",
            meta_description: metaDescription,
            focus_keywords: focusKeywords,
          }),
        },
        router,
        toast,
      )

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json()
          if (errorData.detail && errorData.detail.includes("ultimate")) {
            toast({
              title: "Ultimate Plan Required",
              description: "SEO analysis is only available for Ultimate plan subscribers.",
            })
            return
          }
        }
        throw new Error(`Failed to analyze SEO: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("SEO Analysis Response:", data)

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      } else {
        // Ensure all expected properties exist in the response
        const processedData: SeoAnalysis = {
          score: data.score || 0,
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
          keywordDensity: data.keywordDensity || {},
          tfidfScores: data.tfidfScores || {},
          readabilityScore: data.readabilityScore || 0,
          titleSuggestions: Array.isArray(data.titleSuggestions) ? data.titleSuggestions : [],
        }

        setSeoAnalysis(processedData)
        setActiveTab("seo")
        toast({
          title: "Success",
          description: "SEO analysis completed successfully",
        })
      }
    } catch (error) {
      console.error("SEO analysis error:", error)
      toast({
        title: "Error",
        description: "Failed to analyze SEO. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzingSeo(false)
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

  // Update the handlePublish function to convert Markdown to HTML before sending to WordPress
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

    // Check image size before uploading
    if (publishSettings.featuredImage && !validateImageSize(publishSettings.featuredImage)) {
      toast({
        title: "Image Too Large",
        description: "Your featured image exceeds the 250 KB size limit. Please resize it and try again.",
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

      // Convert Markdown to HTML for WordPress
      const htmlContent = marked(bodyContent)
      const htmlTitle = marked(publishSettings.title).replace(/<\/?p>/g, "") // Remove paragraph tags from title

      formData.append("title", htmlTitle) // Send HTML title instead of Markdown
      formData.append("content", htmlContent) // Send HTML instead of Markdown
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

      // Check if this is an image size error
      if (error instanceof Error && error.message.includes("Image upload failed")) {
        try {
          // Try to parse the error details
          const errorDetails = JSON.parse(error.message.split("details\t")[1])
          if (
            errorDetails.code === "rest_upload_unknown_error" &&
            errorDetails.message.includes("resize to less than 250 KB")
          ) {
            toast({
              title: "Image Too Large",
              description: "Your featured image exceeds the 250 KB size limit. Please resize it and try again.",
              variant: "destructive",
            })
            return
          }
        } catch (parseError) {
          // If we can't parse the error, fall back to the generic message
          console.error("Error parsing error details:", parseError)
        }
      }

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

  // Render SEO score badge
  const renderScoreBadge = (score: number) => {
    let color = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    if (score >= 70) {
      color = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    } else if (score >= 50) {
      color = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    }

    return <div className={`text-xs px-2 py-1 rounded-full ${color}`}>{score}/100</div>
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading paraphrased content...</p>
      </div>
    )
  }

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

          {/* SEO Analysis Section */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  <CardTitle>SEO Analysis</CardTitle>
                </div>
                <div className="flex items-center">
                  {!hasUltimatePlan && (
                    <Badge variant="outline" className="mr-2 bg-amber-50 text-amber-800 border-amber-200">
                      <Lock className="h-3 w-3 mr-1" /> Ultimate Plan Only
                    </Badge>
                  )}
                  <Button
                    onClick={handleAnalyzeSeo}
                    disabled={isAnalyzingSeo || !hasUltimatePlan}
                    size="sm"
                    className="flex items-center"
                  >
                    {isAnalyzingSeo ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        Analyze SEO
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <CardDescription>
                {hasUltimatePlan
                  ? "Optimize your content for search engines with our advanced SEO analysis"
                  : "Upgrade to the Ultimate plan to unlock advanced SEO analysis"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasUltimatePlan ? (
                <div className="bg-muted/50 rounded-lg p-6 text-center">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">SEO Analysis Locked</h3>
                  <p className="text-muted-foreground mb-4">
                    Upgrade to our Ultimate plan to access advanced SEO analysis tools and improve your content's search
                    engine ranking.
                  </p>
                  <Button onClick={() => router.push("/dashboard/subscription")}>Upgrade to Ultimate</Button>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="content">Content Analysis</TabsTrigger>
                    <TabsTrigger value="seo">SEO Analysis</TabsTrigger>
                  </TabsList>
                  <TabsContent value="content" className="space-y-4">
                    {seoData ? (
                      <>
                        {/* Title */}
                        {seoData.title && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium">SEO Title</h3>
                            <div className="p-3 border rounded-md bg-muted/30">
                              <p className="text-sm font-medium">{seoData.title}</p>
                            </div>
                          </div>
                        )}

                        {/* Meta Description */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <h3 className="text-sm font-medium">Meta Description</h3>
                            <span className="text-xs text-muted-foreground">
                              {seoData.meta_description ? seoData.meta_description.length : 0}/160 characters
                            </span>
                          </div>
                          <div className="p-3 border rounded-md bg-muted/30">
                            <p className="text-sm text-muted-foreground">
                              {seoData.meta_description ? seoData.meta_description : "No meta description available."}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            A compelling description that includes your main keyword and value proposition. This appears
                            in search results.
                          </p>
                        </div>

                        {/* Focus Keywords */}
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">Focus Keywords</h3>
                          <div className="flex flex-wrap gap-2">
                            {seoData.focus_keywords &&
                            Array.isArray(seoData.focus_keywords) &&
                            seoData.focus_keywords.length > 0 ? (
                              seoData.focus_keywords.map((keyword, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className={`text-xs ${
                                    index === 0
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                      : index === 1
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                        : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                  }`}
                                >
                                  {keyword}
                                  {index === 0 && <span className="ml-1 text-[10px]">(main)</span>}
                                  {index === 1 && <span className="ml-1 text-[10px]">(secondary)</span>}
                                  {index === 2 && <span className="ml-1 text-[10px]">(long-tail)</span>}
                                </Badge>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No focus keywords available.</p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Keywords help search engines understand what your content is about. Include these naturally
                            throughout your content.
                          </p>
                        </div>

                        {/* Content Preview */}
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">Search Result Preview</h3>
                          <div className="p-4 border rounded-md space-y-1 bg-white dark:bg-gray-950">
                            <p className="text-blue-600 dark:text-blue-400 text-base font-medium line-clamp-1">
                              {seoData.title || publishSettings.title || "Your Post Title"}
                            </p>
                            <p className="text-green-600 dark:text-green-400 text-xs">
                              https://yourblog.com/
                              {(seoData.title || publishSettings.title)
                                .toLowerCase()
                                .replace(/[^\w\s]/gi, "")
                                .replace(/\s+/g, "-")
                                .substring(0, 30)}
                              {(seoData.title || publishSettings.title).length > 30 ? "..." : ""}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {seoData.meta_description ||
                                content.split("\n").slice(2).join(" ").substring(0, 160) + "..."}
                            </p>
                          </div>
                        </div>

                        {/* SEO Tips */}
                        <div className="mt-6 p-4 border rounded-md bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
                          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">SEO Tips</h3>
                          <ul className="space-y-2 text-xs text-blue-700 dark:text-blue-400">
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>Include your main keyword in the title, meta description, and first paragraph</span>
                            </li>
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>Use secondary keywords naturally throughout your content</span>
                            </li>
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>
                                Keep meta descriptions between 140-160 characters for optimal display in search results
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>
                                Use descriptive, benefit-driven language in your meta description to encourage clicks
                              </span>
                            </li>
                          </ul>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No SEO Data Available</h3>
                        <p className="text-muted-foreground mb-4">
                          Click the "Analyze SEO" button to generate SEO recommendations for your content.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="seo" className="space-y-4">
                    {seoAnalysis ? (
                      <>
                        {/* Overall Score */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium">Overall SEO Score</h3>
                            {renderScoreBadge(seoAnalysis.score)}
                          </div>
                          <Progress value={seoAnalysis.score} className="h-2" />
                        </div>

                        {/* Readability Score */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium">Readability Score</h3>
                            {renderScoreBadge(seoAnalysis.readabilityScore)}
                          </div>
                          <Progress value={seoAnalysis.readabilityScore} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {seoAnalysis.readabilityScore >= 70
                              ? "Your content is easy to read and understand."
                              : seoAnalysis.readabilityScore >= 50
                                ? "Your content is moderately readable. Consider simplifying some sentences."
                                : "Your content may be difficult to read. Try using shorter sentences and simpler words."}
                          </p>
                        </div>

                        {/* Keyword Density */}
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">Keyword Density</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.keys(seoAnalysis.keywordDensity).length > 0 ? (
                              Object.entries(seoAnalysis.keywordDensity)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .slice(0, 6)
                                .map(([word, density], index) => (
                                  <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                                    <span className="font-medium truncate">{word}</span>
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                                      {(density as number).toFixed(1)}%
                                    </span>
                                  </div>
                                ))
                            ) : (
                              <div className="col-span-2 text-center p-4 border border-dashed rounded-md text-muted-foreground">
                                No keyword density data available
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SEO Suggestions */}
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">SEO Suggestions</h3>
                          <div className="space-y-2">
                            {seoAnalysis.suggestions && seoAnalysis.suggestions.length > 0 ? (
                              seoAnalysis.suggestions.map((suggestion, index) => {
                                let bgColor = "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900"
                                let textColor = "text-green-800 dark:text-green-300"
                                let iconColor = "text-green-500"
                                let Icon = () => (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`h-5 w-5 mr-2 ${iconColor} flex-shrink-0 mt-0.5`}
                                  >
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                  </svg>
                                )

                                if (suggestion.type === "warning") {
                                  bgColor = "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900"
                                  textColor = "text-amber-800 dark:text-amber-300"
                                  iconColor = "text-amber-500"
                                  Icon = () => (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className={`h-5 w-5 mr-2 ${iconColor} flex-shrink-0 mt-0.5`}
                                    >
                                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                      <line x1="12" y1="9" x2="12" y2="13" />
                                      <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                  )
                                } else if (suggestion.type === "error") {
                                  bgColor = "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900"
                                  textColor = "text-red-800 dark:text-red-300"
                                  iconColor = "text-red-500"
                                  Icon = () => (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className={`h-5 w-5 mr-2 ${iconColor} flex-shrink-0 mt-0.5`}
                                    >
                                      <circle cx="12" cy="12" r="10" />
                                      <line x1="15" y1="9" x2="9" y2="15" />
                                      <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                  )
                                }

                                return (
                                  <div key={index} className={`flex items-start p-3 border rounded-md ${bgColor}`}>
                                    <Icon />
                                    <div>
                                      <p className={`text-sm font-medium ${textColor}`}>
                                        {suggestion.message.split(":")[0]}
                                      </p>
                                      <p className={`text-xs ${textColor.replace("800", "700").replace("300", "400")}`}>
                                        {suggestion.message.includes(":")
                                          ? suggestion.message.split(":").slice(1).join(":")
                                          : ""}
                                      </p>
                                    </div>
                                  </div>
                                )
                              })
                            ) : (
                              <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground">
                                No suggestions available. Click 'Analyze SEO' to generate recommendations.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Title Suggestions */}
                        {seoAnalysis.titleSuggestions && seoAnalysis.titleSuggestions.length > 0 && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium">Title Suggestions</h3>
                            <div className="space-y-2">
                              {seoAnalysis.titleSuggestions.map((title, index) => (
                                <div
                                  key={index}
                                  className="p-3 border rounded-md hover:bg-muted/30 cursor-pointer"
                                  onClick={() => {
                                    setPublishSettings((prev) => ({ ...prev, title }))
                                    updateTitleInContent(title)
                                  }}
                                >
                                  <p className="text-sm">{title}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No SEO Analysis Available</h3>
                        <p className="text-muted-foreground mb-4">
                          Click the "Analyze SEO" button to generate detailed SEO recommendations for your content.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
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
