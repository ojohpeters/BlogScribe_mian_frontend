"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft, Save, RefreshCw, Wand2, AlertTriangle, CheckCircle, AlertCircle, X, TrendingUp, PenTool } from "lucide-react"
import { isAuthenticated, fetchWithAuth, addRecentPost } from "@/lib/utils"
import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { CheckedState } from "@radix-ui/react-checkbox"
import { useLoadingState } from "@/lib/hooks/use-loading-state"

// Import the full-featured markdown editor
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  }
);

// Custom toolbar items for the editor
const toolbarItems = [
  'bold', 'italic', 'strikethrough',
  '|',
  'quote', 'code', 'codeblock',
  '|',
  'head-1', 'head-2', 'head-3',
  '|',
  'ordered-list', 'unordered-list',
  '|',
  'link', 'image',
  '|',
  'table',
  '|',
  'preview', 'fullscreen'
];

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
  score: number;
  suggestions: {
    type: 'success' | 'warning' | 'error';
    message: string;
  }[];
  keywordDensity: Record<string, number>;
  readabilityScore: number;
  titleSuggestions: string[];
}

interface SeoAnalytics {
  initialScore: number;
  currentScore: number;
  keywordRankings: {
    keyword: string;
    initialRank: number;
    currentRank: number;
  }[];
  trafficStats: {
    organic: number;
    social: number;
    referral: number;
  };
  engagement: {
    timeOnPage: number;
    bounceRate: number;
    shares: number;
  };
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
  const [wordLength, setWordLength] = useState([1500])
  const [keyword, setKeyword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [activeTab, setActiveTab] = useState("editor")
  const [seoAnalysis, setSeoAnalysis] = useState<SeoAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [metaDescription, setMetaDescription] = useState("")
  const [focusKeywords, setFocusKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [seoAnalytics, setSeoAnalytics] = useState<SeoAnalytics | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { isLoading: globalLoading, withLoading } = useLoadingState()

  // Calculate word count
  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length

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

        // Populate SEO fields if available
        if (parsedContent.seo) {
          try {
            const seoData = typeof parsedContent.seo === 'string' 
              ? JSON.parse(parsedContent.seo) 
              : parsedContent.seo;
            
            setMetaDescription(seoData.meta_description || "")
            setFocusKeywords(seoData.focus_keywords || [])
            setSeoAnalysis({
              score: 0, // This will be updated when analyzing
              suggestions: [], // These will be generated when analyzing
              keywordDensity: {}, // This will be updated when analyzing
              readabilityScore: 0, // This will be updated when analyzing
              titleSuggestions: [] // This will be updated when analyzing
            })
          } catch (error) {
            console.error("Error parsing SEO data:", error)
          }
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

  const [subscription, setSubscription] = useState<any>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)

  const fetchSubscriptionStatus = async () => {
    setIsLoadingSubscription(true)
    try {
      const response = await fetchWithAuth("http://127.0.0.1:8000/api/subscription/details/", {}, router, toast)

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
    if (!isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please log in to access this feature.",
        variant: "destructive",
      })
      router.push("/auth/login?returnUrl=" + encodeURIComponent(window.location.pathname))
      return
    }

    if (!content) {
      toast({
        title: "Content required",
        description: "Please enter some content to paraphrase.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await withLoading(async () => {
      const response = await fetchWithAuth(
          "http://127.0.0.1:8000/api/paraphrase/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
            body: JSON.stringify({ content }),
        },
        router,
        toast,
      )

      if (!response.ok) {
          throw new Error("Failed to paraphrase content")
      }

      const data = await response.json()

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
            originalContent: content,
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
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleSaveAsDraft function to use fetchWithAuth
  const handleSaveAsDraft = async () => {
    setIsLoading(true)
    try {
      const response = await fetchWithAuth(
        "http://127.0.0.1:8000/api/save-draft/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            title: originalTitle,
            url: originalUrl,
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
      } else {
        toast({
          title: "Success",
          description: "Content saved as draft successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handlePublish function to remove activity recording
  const handlePublish = async () => {
    setIsLoading(true)
    try {
      const response = await fetchWithAuth(
        "http://127.0.0.1:8000/api/publish/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            title: originalTitle,
            url: originalUrl,
            seo_data: seoAnalysis ? {
              meta_description: metaDescription,
              focus_keywords: focusKeywords,
              seo_score: seoAnalysis.score,
              readability_score: seoAnalysis.readabilityScore,
              keyword_density: seoAnalysis.keywordDensity,
            } : null
          }),
        },
        router,
        toast,
      )

      const data = await response.json()

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      } else {
        // Save to recent posts
        addRecentPost({
          title: originalTitle,
                url: originalUrl,
          date: new Date().toISOString(),
          excerpt: content.substring(0, 150) + "..."
        });

        toast({
          title: "Success",
          description: "Content published successfully",
        })

        // Clear the stored paraphrased content since we've published it
        localStorage.removeItem("paraphrasedContent");
        
        // Redirect to dashboard
        router.push("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to analyze SEO
  const analyzeSEO = async () => {
    if (!subscription?.plan?.name.toLowerCase().includes('ultimate')) {
      toast({
        title: "Ultimate Plan Required",
        description: "SEO analysis is only available for Ultimate plan subscribers.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetchWithAuth(
        "http://127.0.0.1:8000/api/analyze-seo/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            title: originalTitle,
            meta_description: metaDescription,
            focus_keywords: focusKeywords,
          }),
        },
        router,
        toast
      )

      if (!response.ok) {
        throw new Error("Failed to analyze SEO")
      }

      const data = await response.json()
      setSeoAnalysis(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze SEO. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger 
            value="seo" 
            disabled={!subscription?.plan?.name.toLowerCase().includes('ultimate')}
          >
            SEO
            <Badge variant="secondary" className="ml-2">Ultimate</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
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

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Paraphrase Settings</CardTitle>
              <CardDescription>Adjust the settings for paraphrasing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Target Word Length</label>
                  <span className="text-sm text-muted-foreground">{wordLength} words</span>
                </div>
                <Slider
                  value={wordLength}
                  onValueChange={setWordLength}
                  min={100}
                  max={3000}
                  step={50}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Focus Keyword (Optional)</label>
                <Input
                  type="text"
                  placeholder="Enter a keyword to focus on"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
        <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl sm:text-2xl">Paraphrased Content</CardTitle>
                  <CardDescription>Edit and review your paraphrased content</CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  Word Count: {wordCount}
                </div>
              </div>
        </CardHeader>
        <CardContent>
              <div data-color-mode="light" className="wmde-markdown-var">
                <MDEditor
                  value={content}
                  onChange={(value) => setContent(value || "")}
                  preview="live"
                  hideToolbar={false}
                  height={500}
                  enableScroll={true}
                  textareaProps={{
                    placeholder: "Start writing your content here...",
                  }}
                  previewOptions={{
                    skipHtml: false,
                    urlTransform: (url: string) => url,
                  }}
                />
              </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleSaveAsDraft} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button variant="default" onClick={handlePublish} disabled={isLoading}>
            <ArrowLeft className="h-4 w-4 mr-2 rotate-90" />
            Publish
          </Button>
        </CardFooter>
      </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          {!subscription?.plan?.name.toLowerCase().includes('ultimate') ? (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>SEO Optimization</CardTitle>
                <CardDescription>
                  Upgrade to Ultimate plan to unlock advanced SEO features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold">Unlock Advanced SEO Features</h3>
                    <p className="text-sm text-muted-foreground">
                      Get detailed SEO analysis, keyword tracking, and performance metrics
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/pricing")}
                    className="w-full sm:w-auto"
                  >
                    Upgrade Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Enhanced SEO Settings Card */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">SEO Settings</CardTitle>
                  <CardDescription>Optimize your content for search engines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <div className="relative">
                        <Textarea
                          id="metaDescription"
                          value={metaDescription}
                          onChange={(e) => setMetaDescription(e.target.value)}
                          placeholder="Enter meta description (max 160 characters)"
                          className="min-h-[100px]"
                          maxLength={160}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                          {metaDescription.length}/160
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="focusKeywords">Focus Keywords</Label>
                      <div className="flex flex-wrap gap-2">
                        {focusKeywords.map((keyword, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {keyword}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => {
                                setFocusKeywords(focusKeywords.filter((_, i) => i !== index))
                              }}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="focusKeywords"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          placeholder="Add focus keyword"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newKeyword.trim()) {
                              e.preventDefault()
                              setFocusKeywords([...focusKeywords, newKeyword.trim()])
                              setNewKeyword("")
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (newKeyword.trim()) {
                              setFocusKeywords([...focusKeywords, newKeyword.trim()])
                              setNewKeyword("")
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Analyze Button */}
                  <Button
                    onClick={analyzeSEO}
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Analyze SEO
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Enhanced SEO Analysis Results */}
              {seoAnalysis && (
                <Card className="shadow-md">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="text-lg sm:text-xl">SEO Analysis</CardTitle>
                        <CardDescription>Overall Score: {seoAnalysis.score}/100</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("editor")}
                        className="w-full sm:w-auto"
                      >
                        Back to Editor
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Progress bar with target indicators */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Score</span>
                        <span>Target: 60</span>
                      </div>
                      <Progress value={seoAnalysis.score} className="h-2" />
                    </div>
                    
                    {/* Suggestions */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Suggestions</h4>
                      <div className="space-y-2">
                        {seoAnalysis.suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className={`flex items-start space-x-2 p-2 rounded-lg ${
                              suggestion.type === "success"
                                ? "bg-green-50 dark:bg-green-950"
                                : suggestion.type === "warning"
                                ? "bg-yellow-50 dark:bg-yellow-950"
                                : "bg-red-50 dark:bg-red-950"
                            }`}
                          >
                            {suggestion.type === "success" ? (
                              <CheckCircle className="h-4 w-4 mt-1 text-green-500" />
                            ) : suggestion.type === "warning" ? (
                              <AlertTriangle className="h-4 w-4 mt-1 text-yellow-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 mt-1 text-red-500" />
                            )}
                            <span className="text-sm">{suggestion.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Keyword Density</h4>
                        <div className="space-y-2">
                          {seoAnalysis.keywordDensity && Object.entries(seoAnalysis.keywordDensity).map(([keyword, density]) => (
                            <div key={keyword} className="flex justify-between text-sm">
                              <span>{keyword}</span>
                              <span>{density.toFixed(2)}%</span>
                            </div>
                          ))}
                          {(!seoAnalysis.keywordDensity || Object.keys(seoAnalysis.keywordDensity).length === 0) && (
                            <p className="text-sm text-muted-foreground">No keyword density data available</p>
                          )}
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Readability Score</h4>
                        <p className="text-2xl font-bold">{seoAnalysis.readabilityScore}</p>
                        <p className="text-sm text-muted-foreground">
                          {seoAnalysis.readabilityScore >= 60
                            ? "Good readability"
                            : "Consider simplifying"}
                        </p>
                      </div>
                    </div>

                    {/* Title Suggestions */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Title Suggestions</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {seoAnalysis.titleSuggestions?.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="justify-start text-left h-auto py-2 px-4 break-words whitespace-normal"
                            onClick={() => {
                              setOriginalTitle(suggestion)
                              toast({
                                title: "Title Updated",
                                description: "The title has been updated with the suggestion.",
                              })
                            }}
                          >
                            <span className="text-sm line-clamp-2">{suggestion}</span>
                          </Button>
                        ))}
                        {(!seoAnalysis.titleSuggestions || seoAnalysis.titleSuggestions.length === 0) && (
                          <p className="text-sm text-muted-foreground">No title suggestions available</p>
                        )}
                      </div>
                    </div>

                    {/* Action Items */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Recommended Actions</h4>
                      <div className="space-y-2">
                        {seoAnalysis.suggestions
                          .filter(s => s.type !== 'success')
                          .map((suggestion, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-2 p-2 bg-muted rounded-lg"
                            >
                              <CheckCircle className="h-4 w-4 mt-1" />
                              <span className="text-sm">{suggestion.message}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Post-Publish Analytics */}
              {seoAnalytics && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">SEO Performance</CardTitle>
                    <CardDescription>Track your content's SEO performance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Score Comparison */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Score Progress</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Initial Score</p>
                          <p className="text-2xl font-bold">{seoAnalytics.initialScore}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Score</p>
                          <p className="text-2xl font-bold">{seoAnalytics.currentScore}</p>
                        </div>
                      </div>
                    </div>

                    {/* Keyword Rankings */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Keyword Rankings</h4>
                      <div className="space-y-2">
                        {seoAnalytics.keywordRankings.map((ranking, index) => (
                          <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 bg-muted rounded-lg gap-2">
                            <span className="text-sm">{ranking.keyword}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground">
                                {ranking.initialRank} → {ranking.currentRank}
                              </span>
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Traffic Stats */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Traffic Sources</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-2 bg-muted rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Organic</p>
                          <p className="text-2xl font-bold">{seoAnalytics.trafficStats.organic}</p>
                        </div>
                        <div className="p-2 bg-muted rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Social</p>
                          <p className="text-2xl font-bold">{seoAnalytics.trafficStats.social}</p>
                        </div>
                        <div className="p-2 bg-muted rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Referral</p>
                          <p className="text-2xl font-bold">{seoAnalytics.trafficStats.referral}</p>
                        </div>
                      </div>
                    </div>

                    {/* Engagement Metrics */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Engagement</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-2 bg-muted rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Time on Page</p>
                          <p className="text-2xl font-bold">{seoAnalytics.engagement.timeOnPage}s</p>
                        </div>
                        <div className="p-2 bg-muted rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Bounce Rate</p>
                          <p className="text-2xl font-bold">{seoAnalytics.engagement.bounceRate}%</p>
                        </div>
                        <div className="p-2 bg-muted rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Shares</p>
                          <p className="text-2xl font-bold">{seoAnalytics.engagement.shares}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Paraphrase Again</CardTitle>
          <CardDescription>Adjust parameters and paraphrase the content again</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
    </div>
  )
}

