"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Eye, Loader2, RefreshCw } from "lucide-react"
import { fetchWithAuth, isAuthenticated } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface CategoryMap {
  [key: string]: string
}

interface TagMap {
  [key: string]: string
}

// Add this interface for posts
interface Post {
  id: number
  url: string
  title: string
}

export default function WordPressManagement() {
  const router = useRouter()
  const { toast } = useToast()
  const [categories, setCategories] = useState<CategoryMap>({})
  const [tags, setTags] = useState<TagMap>({})
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshingCategories, setIsRefreshingCategories] = useState(false)
  const [isRefreshingTags, setIsRefreshingTags] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [isRefreshingPosts, setIsRefreshingPosts] = useState(false)

  const fetchPosts = async () => {
    setIsRefreshingPosts(true)
    try {
      const response = await fetchWithAuth("https://blogbackend-crimson-frog-3248.fly.dev/api/get-posts/", {})
      console.log("Posts response status:", response.status)
      const data = await response.json()
      console.log("Posts response data:", data)

      // Transform the URLs into Post objects
      const formattedPosts = Object.entries(data).map(([index, url]) => ({
        id: Number.parseInt(index),
        url: url as string,
        // Extract title from URL
        title: extractTitleFromUrl(url as string),
      }))

      setPosts(formattedPosts)
      console.log("Posts set:", formattedPosts)
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast({
        title: "Error",
        description: "Failed to fetch posts",
        variant: "destructive",
      })
    } finally {
      setIsRefreshingPosts(false)
    }
  }

  // Helper function to extract a title from a URL
  const extractTitleFromUrl = (url: string): string => {
    try {
      // Remove protocol and domain
      const path = new URL(url).pathname
      // Get the last part of the path
      const slug = path.split("/").filter(Boolean).pop() || ""
      // Convert slug to title case
      return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    } catch (e) {
      // If URL parsing fails, return the URL as is
      return url
    }
  }

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please log in to access WordPress management.",
        variant: "destructive",
      })
      router.push("/auth/login?returnUrl=" + encodeURIComponent(window.location.pathname))
      return
    }

    fetchCategoriesAndTags()
    fetchPosts()
  }, [router, toast])

  const fetchCategoriesAndTags = async () => {
    setIsLoading(true)
    try {
      // Fetch categories
      const categoriesResponse = await fetchWithAuth(
        "https://blogbackend-crimson-frog-3248.fly.dev/api/get-categories/",
        {},
      )
      console.log("Categories response status:", categoriesResponse.status)
      const categoriesData = await categoriesResponse.json()
      console.log("Categories response data:", categoriesData)

      if (categoriesData.Message === "Error") {
        throw new Error("Failed to fetch categories")
      }

      setCategories(categoriesData)
      console.log("Categories set:", categoriesData)

      // Fetch tags
      const tagsResponse = await fetchWithAuth("https://blogbackend-crimson-frog-3248.fly.dev/api/get-tags/", {})
      console.log("Tags response status:", tagsResponse.status)
      const tagsData = await tagsResponse.json()
      console.log("Tags response data:", tagsData)

      if (tagsData.error) {
        throw new Error(tagsData.error)
      }

      setTags(tagsData)
      console.log("Tags set:", tagsData)

      // Store in localStorage
      localStorage.setItem("wordpress_categories", JSON.stringify(categoriesData))
      localStorage.setItem("wordpress_tags", JSON.stringify(tagsData))
    } catch (error) {
      console.error("Error fetching data:", error)
      if (error instanceof Error) {
        if (error.message === "No authentication token found") {
          toast({
            title: "Authentication required",
            description: "Please log in to access WordPress management.",
            variant: "destructive",
          })
          router.push("/auth/login?returnUrl=" + encodeURIComponent(window.location.pathname))
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch categories and tags",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    localStorage.setItem("selected_category", categoryId)
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
      localStorage.setItem("selected_tags", JSON.stringify(newTags))
      return newTags
    })
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "Success",
      description: "URL copied to clipboard!",
    })
  }

  const refreshCategories = async () => {
    setIsRefreshingCategories(true)
    try {
      const response = await fetchWithAuth("https://blogbackend-crimson-frog-3248.fly.dev/api/get-categories/", {})
      const data = await response.json()
      setCategories(data)
      localStorage.setItem("wordpress_categories", JSON.stringify(data))
      toast({
        title: "Success",
        description: "Categories refreshed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh categories",
        variant: "destructive",
      })
    } finally {
      setIsRefreshingCategories(false)
    }
  }

  const refreshTags = async () => {
    setIsRefreshingTags(true)
    try {
      const response = await fetchWithAuth("https://blogbackend-crimson-frog-3248.fly.dev/api/get-tags/", {})
      const data = await response.json()
      setTags(data)
      localStorage.setItem("wordpress_tags", JSON.stringify(data))
      toast({
        title: "Success",
        description: "Tags refreshed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh tags",
        variant: "destructive",
      })
    } finally {
      setIsRefreshingTags(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">WordPress Management</h1>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Posts</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPosts}
                disabled={isRefreshingPosts}
                className="h-8 w-8 p-0 shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshingPosts ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {isRefreshingPosts ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No posts found. Click the refresh button to fetch posts.
                </div>
              ) : (
                <div className="grid gap-4 w-full">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex flex-col p-4 border rounded-lg hover:bg-secondary/50 overflow-hidden"
                    >
                      <div className="w-full mb-3">
                        <p className="break-words text-sm sm:text-base">{post.title}</p>
                      </div>
                      <div className="flex gap-2 justify-end mt-2">
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(post.url)}>
                          <Copy className="h-4 w-4 mr-2" />
                          <span>Copy</span>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.open(post.url, "_blank")}>
                          <Eye className="h-4 w-4 mr-2" />
                          <span>View</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Categories</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshCategories}
                disabled={isRefreshingCategories}
                className="h-8 w-8 p-0 shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshingCategories ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(categories).map(([id, name]) => (
                    <Button
                      key={id}
                      variant={selectedCategory === id ? "default" : "outline"}
                      className="w-full justify-start min-h-[2.5rem] h-auto whitespace-normal text-left break-words"
                      onClick={() => handleCategorySelect(id)}
                    >
                      <span className="line-clamp-2">{name}</span>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tags</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshTags}
                disabled={isRefreshingTags}
                className="h-8 w-8 p-0 shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshingTags ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(tags).map(([id, name]) => (
                    <Button
                      key={id}
                      variant={selectedTags.includes(id) ? "default" : "outline"}
                      className="w-full justify-start min-h-[2.5rem] h-auto whitespace-normal text-left break-words"
                      onClick={() => handleTagToggle(id)}
                    >
                      <span className="line-clamp-2">{name}</span>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

