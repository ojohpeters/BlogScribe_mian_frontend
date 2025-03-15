"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface PaymentPlanProps {
  currentPlan: string
  onPlanChange: (plan: string) => void
}

export default function PaymentPlan({ currentPlan, onPlanChange }: PaymentPlanProps) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan)
  const { toast } = useToast()

  useEffect(() => {
    setSelectedPlan(currentPlan)
  }, [currentPlan])

  const handlePlanChange = () => {
    // In a real application, you would integrate with a payment gateway here
    onPlanChange(selectedPlan)
    toast({
      title: "Plan updated",
      description: `You have successfully subscribed to the ${selectedPlan} plan.`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Plan</CardTitle>
        <CardDescription>Choose your subscription plan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="plan1"
            name="plan"
            value="PLAN1"
            checked={selectedPlan === "PLAN1"}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="form-radio h-4 w-4 text-primary"
          />
          <label
            htmlFor="plan1"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            PLAN1 - $50/month
          </label>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          5 requests per day, unlimited paraphrasing, and access to all features
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handlePlanChange} disabled={selectedPlan === currentPlan}>
          {currentPlan === "PLAN1" ? "Current Plan" : "Upgrade to PLAN1"}
        </Button>
      </CardFooter>
    </Card>
  )
}

