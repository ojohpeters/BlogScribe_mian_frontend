"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExternalLink, Search, RefreshCw } from "lucide-react"
import type { BlogPost } from "@/types/blog"

interface PostListProps {
  posts: Record<string, string>
  onParaphrase: (post: BlogPost) => void
  isParaphrasing: boolean
  selectedPostUrl?: string
}

export default function PostList({ posts, onParaphrase, isParaphrasing, selectedPostUrl }: PostListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPosts = Object.entries(posts)
    .filter(([title]) => title.toLowerCase().includes(searchTerm.toLowerCase()))
    .map(([title, url]) => ({ title, url }))

  if (Object.keys(posts).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10">
        <h3 className="text-lg font-medium">No posts available</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Click the "Get Posts" button to fetch your WordPress blog posts.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search posts..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map((post) => (
          <Card key={post.url} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium line-clamp-2" title={post.title}>
                {post.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground break-all line-clamp-2" title={post.url}>
                {post.url}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between pt-0">
              <Button variant="outline" size="sm" onClick={() => window.open(post.url, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onParaphrase(post)}
                disabled={isParaphrasing}
                className={selectedPostUrl === post.url && isParaphrasing ? "bg-primary text-primary-foreground" : ""}
              >
                {selectedPostUrl === post.url && isParaphrasing ? (
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

      {filteredPosts.length === 0 && searchTerm && (
        <div className="text-center p-4">
          <p className="text-muted-foreground">No posts match your search criteria.</p>
        </div>
      )}
    </div>
  )
}

