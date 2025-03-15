import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const headersList = headers()
    const authorization = headersList.get("Authorization")

    if (!authorization) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Forward the request to the backend API
    const response = await fetch("http://127.0.0.1:8000/api/fetched/", {
      method: "GET",
      headers: {
        Authorization: authorization,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching recent posts:", error)
    return NextResponse.json({ error: "Failed to fetch recent posts" }, { status: 500 })
  }
}

