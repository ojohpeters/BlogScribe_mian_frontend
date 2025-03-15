import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()
    const { url } = body

    // Validate input
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Cannot paraphrase this site at the moment" }, { status: 400 })
    }

    // Fetch content from the URL
    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`)
      }

      const htmlContent = await response.text()

      // Extract text content from HTML (basic extraction)
      const textContent = extractTextFromHtml(htmlContent)

      if (!textContent || textContent.trim().length < 50) {
        return NextResponse.json({ error: "Cannot paraphrase this site at the moment" }, { status: 400 })
      }

      // Use AI SDK to paraphrase the text
      const result = await generateText({
        model: openai("gpt-4o"),
        prompt: `Paraphrase the following text while maintaining its meaning but using different wording and structure:\n\n${textContent.substring(0, 4000)}`,
        temperature: 0.7,
        maxTokens: 1000,
      })

      // Return the paraphrased text with the correct key "Paraphrased"
      return NextResponse.json({ Paraphrased: result.text })
    } catch (fetchError) {
      console.error("Error fetching URL:", fetchError)
      return NextResponse.json({ error: "Cannot paraphrase this site at the moment" }, { status: 400 })
    }
  } catch (error) {
    console.error("Paraphrasing error:", error)

    // Return the specified error message
    return NextResponse.json({ error: "Cannot paraphrase this site at the moment" }, { status: 400 })
  }
}

// Basic function to extract text from HTML
function extractTextFromHtml(html: string): string {
  // Remove scripts, styles, and HTML tags
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return text
}

