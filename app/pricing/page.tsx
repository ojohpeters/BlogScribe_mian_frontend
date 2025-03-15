"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PricingPlans from "@/components/PricingPlans"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState("monthly")

  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
          Choose Your Plan
        </h1>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your WordPress blog management needs. All plans include our core AI-powered
          paraphrasing technology.
        </p>
      </div>

      <div className="flex justify-center mb-10">
        <Tabs defaultValue="monthly" className="w-[400px]" onValueChange={setBillingCycle}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" disabled>
              Yearly (Save 20%)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <PricingPlans showFeaturedOnly={false} />
      </div>

      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">How does the subscription work?</h3>
            <p className="text-muted-foreground">
              Our subscriptions are billed monthly and provide you with a daily limit of requests. You can upgrade or
              downgrade your plan at any time.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">What happens if I reach my daily limit?</h3>
            <p className="text-muted-foreground">
              Once you reach your daily limit, you'll need to wait until the next day to make more requests or upgrade
              to a higher plan for increased limits.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Can I cancel my subscription?</h3>
            <p className="text-muted-foreground">
              Yes, you can cancel your subscription at any time. Your access will remain active until the end of your
              current billing period.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">
              We accept major credit cards, debit cards, and bank transfers for all subscription plans.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

