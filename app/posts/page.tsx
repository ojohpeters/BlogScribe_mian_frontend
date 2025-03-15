"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Post {
  id: string
  title: string
  author: string
  date: string
  link: string
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadPostLinks()
  }, [])

  const loadPostLinks = () => {
    const storedLinks = localStorage.getItem("postLinks")
    if (storedLinks) {
      const parsedLinks = JSON.parse(storedLinks)
      setPosts(
        parsedLinks.map((link: { title: string; link: string }, index: number) => ({
          id: index.toString(),
          title: link.title,
          author: "You", // Assuming the current user is the author
          date: new Date().toISOString(), // Using current date as we don't store the date
          link: link.link,
        })),
      )
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
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        })
      },
    )
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <Link href="/posts/new">
          <Button>New Post</Button>
        </Link>
      </div>
      <Input
        type="search"
        placeholder="Search posts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
              <CardDescription>By {post.author}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{new Date(post.date).toLocaleDateString()}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => copyToClipboard(post.link)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button variant="outline" as="a" href={post.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Post
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

