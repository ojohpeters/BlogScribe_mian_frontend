"use client"

import { useEffect, useState } from "react"
import { PenTool } from "lucide-react"

interface GlobalLoadingProps {
  isLoading: boolean
}

export function GlobalLoading({ isLoading }: GlobalLoadingProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Add a small delay to prevent flickering for very quick operations
    const timeout = setTimeout(() => {
      setIsVisible(isLoading)
    }, 100)

    return () => clearTimeout(timeout)
  }, [isLoading])

  useEffect(() => {
    if (!isVisible) return

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div 
        className="absolute w-8 h-8 animate-pulse"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="w-full h-full rounded-full bg-primary/10"></div>
        <PenTool className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary animate-bounce" />
      </div>
    </div>
  )
} 