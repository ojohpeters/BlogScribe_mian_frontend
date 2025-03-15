export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("authToken")

  if (!token) {
    throw new Error("No authentication token found")
  }

  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  }

  const response = await fetch(url, authOptions)

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }

  return response
}

// Add a function to check if user is authenticated
export function isAuthenticated() {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem("authToken")
}

