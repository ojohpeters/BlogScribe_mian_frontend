"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import type { BlogPost } from "@/types/blog"

interface SEOFormProps {
  selectedPost: BlogPost | null
}

const formSchema = z.object({
  metaTitle: z
    .string()
    .min(10, {
      message: "Meta title must be at least 10 characters.",
    })
    .max(60, {
      message: "Meta title must not exceed 60 characters.",
    }),
  metaDescription: z
    .string()
    .min(50, {
      message: "Meta description must be at least 50 characters.",
    })
    .max(160, {
      message: "Meta description must not exceed 160 characters.",
    }),
  focusKeyword: z.string().min(2, {
    message: "Focus keyword must be at least 2 characters.",
  }),
  tags: z.string(),
  categories: z.string(),
  isFeatured: z.boolean().default(false),
})

export default function SEOForm({ selectedPost }: SEOFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      metaTitle: "",
      metaDescription: "",
      focusKeyword: "",
      tags: "",
      categories: "",
      isFeatured: false,
    },
  })

  // Update form when selected post changes
  useEffect(() => {
    if (selectedPost) {
      form.setValue("metaTitle", selectedPost.title)
      // Reset other fields to default values
      form.setValue("metaDescription", "")
      form.setValue("focusKeyword", "")
      form.setValue("tags", "")
      form.setValue("categories", "")
      form.setValue("isFeatured", false)
    }
  }, [selectedPost, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedPost) {
      toast({
        title: "No post selected",
        description: "Please select a post before saving SEO metadata.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    // Simulate API call
    setTimeout(() => {
      console.log("Saving SEO metadata:", { post: selectedPost, ...values })

      toast({
        title: "SEO metadata saved",
        description: "Your SEO metadata has been saved successfully.",
      })

      setIsSaving(false)
    }, 1500)
  }

  if (!selectedPost) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10">
        <h3 className="text-lg font-medium">No post selected</h3>
        <p className="text-sm text-muted-foreground mt-2">Select a post to manage its SEO metadata.</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Metadata</CardTitle>
        <CardDescription>Optimize your post for search engines and featured sections.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter meta title" {...field} />
                      </FormControl>
                      <FormDescription className="flex justify-between">
                        <span>Optimal length: 50-60 characters</span>
                        <span className={field.value.length > 60 ? "text-destructive" : ""}>
                          {field.value.length}/60
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter meta description" className="resize-none" {...field} />
                      </FormControl>
                      <FormDescription className="flex justify-between">
                        <span>Optimal length: 150-160 characters</span>
                        <span className={field.value.length > 160 ? "text-destructive" : ""}>
                          {field.value.length}/160
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="focusKeyword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Focus Keyword</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter focus keyword" {...field} />
                      </FormControl>
                      <FormDescription>The main keyword you want to rank for</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tags (comma separated)" {...field} />
                      </FormControl>
                      <FormDescription>Separate multiple tags with commas</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categories</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter categories (comma separated)" {...field} />
                      </FormControl>
                      <FormDescription>Separate multiple categories with commas</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Featured Post</FormLabel>
                        <FormDescription>Mark this post as featured on your blog</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save SEO Metadata"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

