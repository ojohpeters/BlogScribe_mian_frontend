import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()
    const { text } = body

    // Validate input
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Cannot paraphrase this site at the moment" }, { status: 400 })
    }

    // Use AI SDK to paraphrase the text
    const result = await generateText({
      model: openai("gpt-4o"),
      prompt: `Paraphrase the following text while maintaining its meaning but using different wording and structure:\n\n${text}`,
      temperature: 0.7, // Add some variability to the output
      maxTokens: 1000, // Limit the response length
    })

    // Return the paraphrased text with the correct key "Paraphrased"
    return NextResponse.json({ Paraphrased: result.text })
  } catch (error) {
    console.error("Paraphrasing error:", error)

    // Return the specified error message
    return NextResponse.json({ error: "Cannot paraphrase this site at the moment" }, { status: 500 })
  }
}

