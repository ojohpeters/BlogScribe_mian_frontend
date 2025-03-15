import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const headersList = headers()
    const authorization = headersList.get("Authorization")

    if (!authorization) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    const { action_type, details, url } = body

    // Validate input
    if (!action_type) {
      return NextResponse.json({ error: "Action type is required" }, { status: 400 })
    }

    // Forward the request to the backend API
    const response = await fetch("http://127.0.0.1:8000/api/record-activity/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify({
        action_type,
        details,
        url,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error recording activity:", error)
    return NextResponse.json({ error: "Failed to record activity" }, { status: 500 })
  }
}

