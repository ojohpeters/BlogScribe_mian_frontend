import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function PaymentSuccessLoading() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Payment Verification</CardTitle>
          <CardDescription>We're verifying your payment...</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
            <p className="text-center text-muted-foreground">
              Please wait while we verify your payment with Paystack...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

