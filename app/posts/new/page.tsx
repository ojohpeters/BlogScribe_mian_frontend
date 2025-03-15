"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const Editor = dynamic(() => import("@/components/editor").then((mod) => mod.Editor), {
  ssr: false,
})

interface Category {
  id: string
  name: string
}

interface Tag {
  id: string
  name: string
}

export default function NewPostPage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [error, setError] = useState<string | null>(null)
  const [encryptedSettings, setEncryptedSettings] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
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
  }

  const handlePublish = async () => {
    setError(null)
    setIsLoading(true)
    try {
      const response = await fetch("https://localhost/publishNewPost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category,
          tags: selectedTags,
          encryptedBlogSettings: encryptedSettings,
        }),
      })

      if (response.ok) {
        toast({
          title: "Post published successfully",
          description: "Your new blog post has been published.",
        })
        router.push("/posts")
      } else {
        throw new Error("Failed to publish post")
      }
    } catch (error) {
      console.error("Error publishing post:", error)
      setError("Failed to publish post. Please check your settings and try again.")
      toast({
        title: "Error publishing post",
        description: "There was a problem publishing your post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">New Post</h1>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-6">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            type="text"
            placeholder="Post Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-2"
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full">
          <Label htmlFor="tags">Tags</Label>
          <MultiSelect
            options={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
            selected={selectedTags}
            onChange={setSelectedTags}
            placeholder="Select tags"
            className="w-full"
          />
        </div>
        <div>
          <Label>Content</Label>
          <Editor content={content} setContent={setContent} />
        </div>
        <Button onClick={handlePublish} className="mt-6" disabled={isLoading}>
          {isLoading ? "Publishing..." : "Publish Post"}
        </Button>
      </div>
    </div>
  )
}

