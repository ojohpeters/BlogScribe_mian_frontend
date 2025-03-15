import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add this function to handle API responses and check for token expiration
export async function handleApiResponse(response: Response, router: any, toast: any) {
  if (response.ok) {
    return response;
  }

  // Check if the response is a 401 Unauthorized
  if (response.status === 401) {
    try {
      const errorData = await response.json();
      
      // Check if this is a token expiration error
      if (errorData.code === "token_not_valid" && 
          errorData.messages?.some((msg: any) => msg.message === "Token is expired")) {
        
        // Try to refresh the token
        const refreshed = await refreshToken();

        if (refreshed) {
          // If token refresh was successful, return a signal to retry the original request
          return { retryWithNewToken: true };
        }
      }
      
      // If token refresh failed or it wasn't a token expiration error
      clearAuthTokens();

      toast({
        title: "Session expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });

      // Redirect to login page with return URL
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/auth/login?returnUrl=${returnUrl}`);
      throw new Error("Session expired");
    } catch (error) {
      // If we can't parse the error response, still handle as auth error
      clearAuthTokens();
      toast({
        title: "Authentication Error",
        description: "Please log in again.",
        variant: "destructive",
      });
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/auth/login?returnUrl=${returnUrl}`);
      throw new Error("Authentication failed");
    }
  }

  // For other error types, just return the response for further handling
  return response;
}

// Function to refresh the token
export async function refreshToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem("refreshToken")

    if (!refreshToken) {
      return false
    }

    const response = await fetch("http://127.0.0.1:8000/api/users/token/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
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
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // Just pass through the original error without timeout handling
    throw error;
  }
}

// Function to make authenticated API requests with automatic token refresh
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  router: any,
  toast: any,
  retryCount = 2
): Promise<Response> {
  const token = localStorage.getItem("authToken")

  if (!token) {
    throw new Error("No authentication token found")
  }

  // Add authorization header
  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  }

  let lastError;
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}/${retryCount + 1} for ${url}`);
      const response = await fetch(url, authOptions);
      
      // Log response status
      console.log(`Response status: ${response.status} for ${url}`);

      // Handle potential token expiration first
      if (response.status === 401) {
        const handledResponse = await handleApiResponse(response, router, toast);
        if (handledResponse && "retryWithNewToken" in handledResponse) {
          console.log("Retrying with new token");
          const newToken = localStorage.getItem("authToken");
          const retryOptions = {
            ...authOptions,
            headers: {
              ...authOptions.headers,
              Authorization: `Bearer ${newToken}`,
            },
          };
          const retryResponse = await fetch(url, retryOptions);
          if (!retryResponse.ok) {
            throw new Error(`Request failed with status ${retryResponse.status}`);
          }
          return retryResponse;
        }
        throw new Error("Authentication failed");
      }
      
      // For non-401 errors
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return response;
    } catch (error: unknown) {
      lastError = error;
      
      // Check if the request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Request aborted for ${url}`);
        throw error; // Don't retry aborted requests
      }
      
      console.error(`Attempt ${attempt + 1} failed for ${url}:`, error);
      
      // Only show error message on final attempt and if it's not an abort
      if (attempt === retryCount && !(error instanceof Error && error.name === 'AbortError')) {
        // Show specific error messages via toast for non-network errors
        if (error instanceof Error) {
          const errorMessage = error.message;
          // Only show toast for specific error messages, not generic network errors
          if (!errorMessage.includes('Failed to fetch') && 
              !errorMessage.includes('network') &&
              !errorMessage.includes('timeout')) {
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
          }
        }
      }
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        continue;
      }
    }
  }

  // If we've exhausted all retries, throw the original error
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Request failed");
}

// Check if user has subscribed before
export async function hasUserSubscribedBefore(router: any, toast: any): Promise<boolean> {
  try {
    const response = await fetchWithAuth("http://127.0.0.1:8000/api/users/user/", {}, router, toast)

    if (!response.ok) {
      return false
    }

    const userData = await response.json()
    return userData.has_subscribed === true
  } catch (error) {
    console.error("Error checking subscription history:", error)
    return false
  }
}

// Check if user has an active subscription
export async function hasActiveSubscription(router: any, toast: any): Promise<boolean> {
  try {
    const response = await fetchWithAuth("http://127.0.0.1:8000/api/subscription/details/", {}, router, toast)

    if (!response.ok) {
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
  title: string;
  excerpt?: string;
  date: string;
  url: string;
}

// Function to add a new recent post
export function addRecentPost(post: RecentPost) {
  try {
    const existingPosts = getRecentPosts();
    const newPosts = [post, ...existingPosts].slice(0, 10); // Keep only last 10 posts
    localStorage.setItem('recentPosts', JSON.stringify(newPosts));
    return true;
  } catch (error) {
    console.error('Error saving recent post:', error);
    return false;
  }
}

// Function to get recent posts
export function getRecentPosts(): RecentPost[] {
  try {
    const posts = localStorage.getItem('recentPosts');
    return posts ? JSON.parse(posts) : [];
  } catch (error) {
    console.error('Error getting recent posts:', error);
    return [];
  }
}

