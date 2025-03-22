"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Update matches state initially
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    // Set up listener for changes
    const listener = () => {
      setMatches(media.matches)
    }

    // Add listener
    media.addEventListener("change", listener)

    // Clean up
    return () => {
      media.removeEventListener("change", listener)
    }
  }, [matches, query])

  return matches
}

