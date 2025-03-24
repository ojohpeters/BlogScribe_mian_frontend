import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function EmailVerifyLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>Verifying your email address...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Please wait while we verify your email address...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

