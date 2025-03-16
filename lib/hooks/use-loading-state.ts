import { useLoading } from "@/contexts/loading-context"
import { useState } from "react"

export function useLoadingState() {
  const { setIsLoading: setGlobalLoading } = useLoading()
  const [isLoading, setIsLoading] = useState(false)

  const withLoading = async <T>(operation: () => Promise<T>): Promise<T> => {
    setIsLoading(true)
    setGlobalLoading(true)
    try {
      return await operation()
    } finally {
      setIsLoading(false)
      setGlobalLoading(false)
    }
  }

  return {
    isLoading,
    withLoading,
  }
} 