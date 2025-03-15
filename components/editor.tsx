"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bold, Italic, List, ListOrdered, Image, Link } from "lucide-react"
import { useTheme } from "next-themes"

interface EditorProps {
  content: string
  setContent: (content: string) => void
}

export function Editor({ content, setContent }: EditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { theme } = useTheme()

  const handleMarkdownAction = (action: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const selectedText = content.substring(start, end)
      let replacement = ""

      switch (action) {
        case "bold":
          replacement = `**${selectedText}**`
          break
        case "italic":
          replacement = `*${selectedText}*`
          break
        case "unordered-list":
          replacement = `\n- ${selectedText}`
          break
        case "ordered-list":
          replacement = `\n1. ${selectedText}`
          break
        case "image":
          replacement = `![${selectedText}](image_url)`
          break
        case "link":
          replacement = `[${selectedText}](url)`
          break
      }

      const newContent = content.substring(0, start) + replacement + content.substring(end)
      setContent(newContent)

      // Set focus back to textarea and update cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(start + replacement.length, start + replacement.length)
        }
      }, 0)
    }
  }

  useEffect(() => {
    if (activeTab === "write" && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [activeTab])

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "write" | "preview")}>
        <div className="flex justify-between items-center mb-2">
          <TabsList>
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={() => handleMarkdownAction("bold")}>
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleMarkdownAction("italic")}>
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleMarkdownAction("unordered-list")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleMarkdownAction("ordered-list")}>
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleMarkdownAction("image")}>
              <Image className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleMarkdownAction("link")}>
              <Link className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <TabsContent value="write" className="mt-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[500px] p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
            placeholder="Write your post content here..."
          />
        </TabsContent>
        <TabsContent value="preview" className="mt-0">
          <div className="w-full h-[500px] p-4 border rounded-md overflow-auto bg-background text-foreground">
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

