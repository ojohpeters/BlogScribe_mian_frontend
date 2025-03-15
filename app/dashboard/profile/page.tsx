"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { fetchWithAuth } from "@/lib/utils"

export default function Profile() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [wordpressUsername, setWordpressUsername] = useState("")
  const [wordpressUrl, setWordpressUrl] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [wordpressPassword, setWordpressPassword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchProfileData()
  }, [])

  // Update the fetchProfileData function to use fetchWithAuth
  const fetchProfileData = async () => {
    try {
      const response = await fetchWithAuth("http://127.0.0.1:8000/api/users/user/", {}, router, toast)

      if (!response.ok) {
        throw new Error("Failed to fetch profile data")
      }

      const data = await response.json()
      console.log("Profile data:", data) // Log the data for debugging
      setUsername(data.username || "")
      setEmail(data.email || "")
      setWordpressUsername(data.wordpress_username || "")
      setWordpressUrl(data.wordpress_url || "")
      // We don't set the WordPress password here for security reasons
    } catch (error) {
      console.error("Error fetching profile data:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleSave function to use fetchWithAuth
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const response = await fetchWithAuth(
        "http://127.0.0.1:8000/api/users/update/",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            current_password: currentPassword,
            new_password: newPassword,
            wordpress_username: wordpressUsername,
            wordpress_url: wordpressUrl,
            wordpress_password: wordpressPassword,
          }),
        },
        router,
        toast,
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "Failed to update profile")
      }

      toast({
        title: "Success",
        description: "Your profile has been updated.",
      })

      // Clear sensitive fields after successful update
      setCurrentPassword("")
      setNewPassword("")
      setWordpressPassword("")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Manage your account and WordPress credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="username">Username</label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email">Email</label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="currentPassword">Current Password</label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="newPassword">New Password</label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="wordpressUsername">WordPress Username</label>
                <Input
                  id="wordpressUsername"
                  value={wordpressUsername}
                  onChange={(e) => setWordpressUsername(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="wordpressUrl">WordPress URL</label>
                <Input
                  id="wordpressUrl"
                  type="url"
                  value={wordpressUrl}
                  onChange={(e) => setWordpressUrl(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="wordpressPassword">WordPress Password</label>
                <Input
                  id="wordpressPassword"
                  type="password"
                  value={wordpressPassword}
                  onChange={(e) => setWordpressPassword(e.target.value)}
                  placeholder="Enter to update WordPress password"
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

