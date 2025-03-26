import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add this function to handle API responses and check for token expiration
export async function handleApiResponse(response: Response, router: any, toast: any) {
  if (response.ok) {
    return response
  }

  if (response.status === 401) {
    try {
      // Check if response is JSON before trying to parse it
      const contentType = response.headers.get("content-type")
      let errorData

      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json()
      } else {
        // Log the raw response for debugging
        const responseText = await response.text()
        console.error("Non-JSON response received:", responseText)
        return response
      }

      // Case 1: No authentication credentials provided
      if (errorData.detail === "Authentication credentials were not provided.") {
        console.warn("401 Unauthorized - No token provided")
        return response
      }

      // Case 2: Token is invalid or expired
      if (errorData.code === "token_not_valid") {
        console.warn("401 Unauthorized - Token expired, attempting refresh...")

        const refreshed = await refreshToken()
        if (refreshed) {
          console.log("Token refreshed successfully. Retrying request...")
          return { retryWithNewToken: true }
        }

        // Only if refresh fails, we consider it a session expiration
        console.warn("Token refresh failed")
        return response
      }

      // Case 3: Other authentication issues
      return response
    } catch (error) {
      console.error("Error handling 401 response:", error)
      return response
    }
  }

  return response
}

// Function to refresh the token
export async function refreshToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem("refreshToken")

    if (!refreshToken) {
      return false
    }

    const response = await fetch("https://blogbackend-crimson-frog-3248.fly.dev/api/users/token/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      return false
    }

    // Check if response is JSON before trying to parse it
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Non-JSON response received:", await response.text())
      return false
    }

    const data = await response.json()

    // Store the new access token
    if (data.access) {
      localStorage.setItem("authToken", data.access)
      return true
    }

    return false
  } catch (error) {
    console.error("Error refreshing token:", error)
    return false
  }
}

// Function to clear auth tokens
export function clearAuthTokens() {
  localStorage.removeItem("authToken")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("userData") // Also clear user data
}

// Add a function to check if user is authenticated
export function isAuthenticated() {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem("authToken")
}

// Add timeout wrapper for fetch
const fetchWithTimeout = async (url: string, options: RequestInit): Promise<Response> => {
  try {
    const response = await fetch(url, options)
    return response
  } catch (error) {
    // Just pass through the original error without timeout handling
    throw error
  }
}

// Function to make authenticated API requests with automatic token refresh
export async function fetchWithAuth(url: string, options: RequestInit = {}, router: any, toast: any) {
  try {
    const token = localStorage.getItem("authToken")
    if (!token) {
      // Don't redirect or show toast here, just return a 401 response
      return new Response(JSON.stringify({ error: "No authentication token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    })

    // If response is 401, check if it's a token expiration
    if (response.status === 401) {
      try {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()

          // Check if it's a token expiration error
          if (errorData.code === "token_not_valid") {
            console.log("Token expired, attempting to refresh...")

            // Try to refresh the token
            const refreshed = await refreshToken()

            if (refreshed) {
              // Token refreshed successfully, retry the original request
              const newToken = localStorage.getItem("authToken")
              return fetch(url, {
                ...options,
                headers: {
                  ...options.headers,
                  Authorization: `Bearer ${newToken}`,
                },
              })
            } else {
              // Refresh failed, return 401 without redirecting
              console.warn("Token refresh failed")
              return new Response(JSON.stringify({ error: "Token refresh failed" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
              })
            }
          }
        }
      } catch (parseError) {
        console.error("Error parsing 401 response:", parseError)
      }
    }

    return response
  } catch (error) {
    console.error("Error in fetchWithAuth:", error)
    return new Response(JSON.stringify({ error: "Network error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Check if user has subscribed before (only indicates past subscription, not current status)
export async function hasUserSubscribedBefore(router: any, toast: any): Promise<boolean> {
  try {
    const response = await fetchWithAuth(
      "https://blogbackend-crimson-frog-3248.fly.dev/api/users/user/",
      {},
      router,
      toast,
    )

    if (!response.ok) {
      return false
    }

    // Check if response is JSON before trying to parse it
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Non-JSON response received:", await response.text())
      return false
    }

    const userData = await response.json()
    // Note: has_subscribed only indicates if a user has subscribed in the past, not current status
    return userData.has_subscribed === true
  } catch (error) {
    console.error("Error checking subscription history:", error)
    return false
  }
}

// Check if user has an active subscription
export async function hasActiveSubscription(router: any, toast: any): Promise<boolean> {
  try {
    const response = await fetchWithAuth(
      "https://blogbackend-crimson-frog-3248.fly.dev/api/subscription/details/",
      {},
      router,
      toast,
    )

    if (!response.ok) {
      return false
    }

    // Check if response is JSON before trying to parse it
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Non-JSON response received:", await response.text())
      return false
    }

    const data = await response.json()
    // Explicitly check for "active" status
    return data.status === "active"
  } catch (error) {
    console.error("Error checking active subscription:", error)
    return false
  }
}

// Interface for recent post
export interface RecentPost {
  title: string
  excerpt?: string
  date: string
  url: string
}

// Function to add a new recent post
export function addRecentPost(post: RecentPost) {
  try {
    const existingPosts = getRecentPosts()
    const newPosts = [post, ...existingPosts].slice(0, 10) // Keep only last 10 posts
    localStorage.setItem("recentPosts", JSON.stringify(newPosts))
    return true
  } catch (error) {
    console.error("Error saving recent post:", error)
    return false
  }
}

// Function to get recent posts
export function getRecentPosts(): RecentPost[] {
  try {
    const posts = localStorage.getItem("recentPosts")
    if (!posts) return []

    // Safely parse JSON with error handling
    try {
      return JSON.parse(posts)
    } catch (parseError) {
      console.error("Error parsing recent posts JSON:", parseError)
      // If JSON is invalid, reset it
      localStorage.removeItem("recentPosts")
      return []
    }
  } catch (error) {
    console.error("Error getting recent posts:", error)
    return []
  }
}

