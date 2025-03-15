"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { BlogPost } from "@/types/blog"

interface ParaphrasePreviewProps {
  post: BlogPost | null
  paraphrasedContent: string
  isLoading: boolean
}

export default function ParaphrasePreview({ post, paraphrasedContent, isLoading }: ParaphrasePreviewProps) {
  const { toast } = useToast()

  const copyToClipboard = async () => {
    if (!paraphrasedContent) return

    try {
      await navigator.clipboard.writeText(paraphrasedContent)
      toast({
        title: "Copied to clipboard",
        description: "The paraphrased content has been copied to your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the content to clipboard.",
        variant: "destructive",
      })
    }
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10">
        <h3 className="text-lg font-medium">No post selected</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Select a post and click "Paraphrase" to see the paraphrased content here.
        </p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{post.title}</CardTitle>
            <CardDescription className="mt-1">
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Original post
              </a>
            </CardDescription>
          </div>
          {paraphrasedContent && (
            <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center gap-1">
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : paraphrasedContent ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: paraphrasedContent.replace(/\n/g, "<br />") }} />
          </div>
        ) : (
          <p className="text-muted-foreground italic">Click "Paraphrase" on a post to generate paraphrased content.</p>
        )}
      </CardContent>
    </Card>
  )
}

