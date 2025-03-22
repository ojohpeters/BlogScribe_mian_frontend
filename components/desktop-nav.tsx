"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, FileEdit } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/lib/user-context"
import Link from "next/link"
import { PageLoading } from "@/components/ui/page-loading"
import { useMediaQuery } from "@/hooks/use-media-query"

interface DesktopNavProps {
  onLogout?: () => void
}

// Simplified NavLink component with direct navigation
const NavLink = ({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) => {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary cursor-pointer",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {children}
    </Link>
  )
}

export function DesktopNav({ onLogout }: DesktopNavProps) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user, clearUserData } = useUser()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Check authentication status when component mounts or user changes
    if (isMounted) {
      const token = localStorage.getItem("authToken")
      if (token) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    }
  }, [isMounted, user])

  if (!isDesktop || !isMounted) {
    return null
  }

  const handleLogout = async () => {
    if (onLogout) {
      onLogout()
    } else {
      // Default logout behavior
      try {
        const token = localStorage.getItem("authToken")
        const refreshToken = localStorage.getItem("refreshToken")

        if (token && refreshToken) {
          const response = await fetch("https://blogbackend-crimson-frog-3248.fly.dev/api/users/logout/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ refresh: refreshToken }),
          })

          if (!response.ok) {
            // Still remove tokens even if logout fails on server
          }
        }
      } catch (error) {
        console.error("Error during logout:", error)
      } finally {
        // Always remove tokens from localStorage
        localStorage.removeItem("authToken")
        localStorage.removeItem("refreshToken")
        // Clear user data
        clearUserData()
        setIsAuthenticated(false)

        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        })

        router.push("/")
      }
    }
  }

  const publicRoutes = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
  ]

  // Update the routes array to ensure proper navigation
  const authRoutes = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/make-post", label: "Make Post" },
    { href: "/fetched-posts", label: "Fetched Posts" },
    { href: "/url-paraphraser", label: "URL Paraphraser" },
  ]

  const routes = isAuthenticated ? authRoutes : publicRoutes

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U"
    return user.username.charAt(0).toUpperCase()
  }

  return (
    <>
      <PageLoading />
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="hidden items-center space-x-2 md:flex">
              <span className="hidden font-bold text-xl bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent sm:inline-block">
                BlogScribe
              </span>
            </Link>
            <nav className="hidden gap-6 md:flex">
              {routes.map((route) => (
                <NavLink key={route.href} href={route.href} active={pathname === route.href}>
                  {route.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full border-2 border-primary/10 hover:border-primary/30 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" alt={user?.username || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary">{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.username || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email || "user@example.com"}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/subscription" className="cursor-pointer">
                      <FileEdit className="mr-2 h-4 w-4" />
                      <span>Subscription</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="rounded-full px-4">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="rounded-full px-4 shadow-sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}

