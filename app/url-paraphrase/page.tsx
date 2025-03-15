"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft, Link } from "lucide-react"
import { isAuthenticated, fetchWithAuth } from "@/lib/utils"

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

export default function UrlParaphrase() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleParaphrase = async () => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please log in to access this feature.",
        variant: "destructive",
      })
      router.push("/auth/login?returnUrl=" + encodeURIComponent(window.location.pathname))
      return
    }

    if (!url) {
      toast({
        title: "URL required",
        description: "Please enter a URL to paraphrase.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetchWithAuth(
        "http://127.0.0.1:8000/api/paraphrase/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        },
        router,
        toast,
      )

      if (!response.ok) {
        throw new Error("Failed to paraphrase content")
      }

      const data: ParaphrasedContent = await response.json()

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      } else {
        // Handle different response formats
        const paraphrasedContent = {
          ...data,
          // Ensure we have the correct content field
          content: data.Paraphrased || data.paraphrased_content || data.Post || "",
          // Keep the original URL and title
          originalUrl: url,
          originalTitle: data.title || "",
        }

        // Store the paraphrased content in localStorage
        localStorage.setItem("paraphrasedContent", JSON.stringify(paraphrasedContent))
        
        // Redirect to the paraphrase page
        router.push("/paraphrase")
        
        toast({
          title: "Success",
          description: "Content paraphrased successfully",
        })
      }
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">URL Paraphrase</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Enter URL to Paraphrase</CardTitle>
          <CardDescription>
            Provide a URL of the content you want to paraphrase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">URL</label>
            </div>
            <Input
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
            />
          </div>

          <Button 
            onClick={handleParaphrase} 
            disabled={isLoading} 
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Paraphrasing...
              </>
            ) : (
              "Paraphrase Content"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 