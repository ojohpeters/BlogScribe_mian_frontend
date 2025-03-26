"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Copy } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { getWordCount, getReadingTime, calculateSeoScore } from "@/utils/postAnalytics"
import { TagCloud } from "@/components/tag-cloud"
import type { Tag } from "@/types/blog"

const Editor = dynamic(() => import("@/components/editor").then((mod) => mod.Editor), {
  ssr: false,
})

interface Category {
  id: string
  name: string
}

interface PostLink {
  title: string
  link: string
}

const handleApiCall = async (url: string, method: string, body: any) => {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API call failed: ${error.message}`)
    }
    throw new Error("An unexpected error occurred")
  }
}

export function Dashboard() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [length, setLength] = useState(500)
  const [encryptedSettings, setEncryptedSettings] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [postLinks, setPostLinks] = useState<PostLink[]>([])
  const [wordCount, setWordCount] = useState(0)
  const [readingTime, setReadingTime] = useState(0)
  const [seoScore, setSeoScore] = useState(0)
  const [keyword, setKeyword] = useState("")
  const { toast } = useToast()
  const router = useRouter()
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    loadData()
    loadPostLinks()
  }, [])

  useEffect(() => {
    const newWordCount = getWordCount(content)
    const newReadingTime = getReadingTime(content)
    setWordCount(newWordCount)
    setReadingTime(newReadingTime)

    const newSeoScore = calculateSeoScore(title, content, keyword)
    setSeoScore(newSeoScore)
  }, [content, title, keyword])

  const loadData = async () => {
    setIsSyncing(true)
    try {
      const savedSettings = localStorage.getItem("encryptedBlogSettings")
      if (savedSettings) {
        setEncryptedSettings(savedSettings)
      } else {
        setError("No saved settings found. Please update your WordPress details in the settings.")
      }

      const blogInfo = localStorage.getItem("blogInfo")
      if (blogInfo) {
        try {
          const parsedInfo = JSON.parse(blogInfo)
          if (parsedInfo.categories) {
            setCategories(Object.entries(parsedInfo.categories).map(([id, name]) => ({ id, name: name as string })))
          }
          if (parsedInfo.tags) {
            setTags(Object.entries(parsedInfo.tags).map(([id, name]) => ({ id, name: name as string })))
          }
        } catch (error) {
          console.error("Error parsing blog info:", error)
          setError("Failed to load blog information. Please check your settings and try again.")
        }
      } else {
        setError("No blog information found. Please update your WordPress details in the settings.")
      }
    } finally {
      setIsSyncing(false)
    }
  }

  const loadPostLinks = () => {
    const savedPostLinks = localStorage.getItem("postLinks")
    if (savedPostLinks) {
      setPostLinks(JSON.parse(savedPostLinks))
    }
  }

  const savePostLink = (title: string, link: string) => {
    const newPostLinks = [{ title, link }, ...postLinks.slice(0, 4)]
    setPostLinks(newPostLinks)
    localStorage.setItem("postLinks", JSON.stringify(newPostLinks))
  }

  const handleGeneratePost = async () => {
    setError(null)
    setIsLoading(true)
    try {
      const data = await handleApiCall("http://127.0.0.1:5000/generate_post", "POST", {
        title,
        length,
        encryptedBlogSettings: encryptedSettings,
      })
      setContent(data.content)
      toast({
        title: "Post Generated",
        description: "Your post has been generated based on the title and length. You can now edit and categorize it.",
      })
    } catch (error) {
      console.error("Error generating post:", error)
      setError(`Failed to generate post: ${error instanceof Error ? error.message : "Unknown error"}`)
      toast({
        title: "Error",
        description: "Failed to generate post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveOrPublish = async (action: "draft" | "publish") => {
    setError(null)
    setIsLoading(true)
    try {
      const endpoint = action === "draft" ? "save_draft" : "publish_post"
      const data = await handleApiCall(`http://127.0.0.1:5000/${endpoint}`, "POST", {
        title,
        content,
        encryptedBlogSettings: encryptedSettings,
        category: selectedCategory,
        tags: selectedTags,
      })

      if (data.Message === "Posted success" && data.link) {
        savePostLink(title, data.link)
        toast({
          title: `Post ${action === "draft" ? "Saved as Draft" : "Published"}`,
          description: `Your post has been successfully ${action === "draft" ? "saved as a draft" : "published"}.`,
        })
        router.push("/posts")
      } else {
        throw new Error(`Unexpected response from server`)
      }
    } catch (error) {
      console.error(`Error ${action === "draft" ? "saving draft" : "publishing"} post:`, error)
      setError(
        `Failed to ${action === "draft" ? "save draft" : "publish"} post: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
      toast({
        title: "Error",
        description: `Failed to ${action === "draft" ? "save draft" : "publish"} post. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied",
          description: "Link copied to clipboard",
        })
      },
      (err) => {
        console.error("Could not copy text: ", err)
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New Post</h1>
        <Button variant="outline" onClick={loadData} disabled={isSyncing} className="flex items-center gap-2">
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
              </svg>
              Sync
            </>
          )}
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter post title" />
        </div>
        <div>
          <Label htmlFor="keyword">Focus Keyword</Label>
          <Input
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter focus keyword"
          />
        </div>
        <div>
          <Label htmlFor="length">Length (words)</Label>
          <div className="flex items-center space-x-2">
            <Slider
              id="length"
              min={100}
              max={2000}
              step={100}
              value={[length]}
              onValueChange={(value) => setLength(value[0])}
            />
            <span>{length} words</span>
          </div>
        </div>
        <Button onClick={handleGeneratePost} disabled={isLoading || !title}>
          {isLoading ? "Generating..." : "Generate Post"}
        </Button>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tags">Tags</Label>
          <MultiSelect
            options={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
            selected={selectedTags}
            onChange={setSelectedTags}
            placeholder="Select tags"
          />
        </div>
      </div>
      <div className="space-y-4">
        <Label>Content</Label>
        <Editor content={content} setContent={setContent} />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Words: {wordCount}</span>
          <span>Reading Time: {readingTime} min</span>
          <span>SEO Score: {seoScore}/100</span>
        </div>
      </div>
      <div className="flex space-x-4">
        <Button variant="outline" onClick={() => handleSaveOrPublish("draft")} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save as Draft
        </Button>
        <Button onClick={() => handleSaveOrPublish("publish")} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Publish
        </Button>
      </div>
      {postLinks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Recent Posts</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {postLinks.map((post, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground truncate">{post.link}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(post.link)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      <TagCloud tags={tags} />
      <Toaster />
    </div>
  )
}

