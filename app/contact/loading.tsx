import { Loader2 } from "lucide-react"

export default function ContactLoading() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading contact form...</p>
      </div>
    </div>
  )
}

