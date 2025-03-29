"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  UserPlus,
  Mail,
  LogIn,
  CreditCard,
  Link2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Key,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function HowToUse() {
  const [activeTab, setActiveTab] = useState("getting-started")

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container max-w-6xl px-4 py-12 mx-auto">
        <div className="text-center mb-12">
          <motion.h1
            className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            How to Use BlogScribe
          </motion.h1>
          <motion.p
            className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Follow these simple steps to get started with our powerful WordPress content management tool
          </motion.p>
        </div>

        <Tabs defaultValue="getting-started" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-3xl">
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="using-features">Using Features</TabsTrigger>
              <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="getting-started">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {/* Step 1: Register */}
              <motion.div variants={item}>
                <Card className="h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
                  <div className="bg-primary/10 p-6 flex items-center justify-center">
                    <UserPlus className="h-12 w-12 text-primary" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3 flex items-center">
                      <span className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">
                        1
                      </span>
                      Register
                    </h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>Fill in all required information on the registration page</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>Double-check your WordPress username as it cannot be changed later</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>Use a WordPress App Password (not your regular login password)</span>
                      </li>
                    </ul>

                    <Accordion type="single" collapsible className="mt-4">
                      <AccordionItem value="app-password">
                        <AccordionTrigger className="text-sm font-medium text-primary">
                          How to get a WordPress App Password
                        </AccordionTrigger>
                        <AccordionContent>
                          <ol className="space-y-2 text-sm text-muted-foreground ml-5 list-decimal">
                            <li>Log in to your WordPress Admin Dashboard</li>
                            <li>Go to Users On The Sidebar → All Users → Locate your Username</li>
                            <li>Tap on your Username →Takes you to Profile Page</li>
                            <li>Scroll down to Application Passwords section</li>
                            <li>Enter "BlogScribe" as the name</li>
                            <li>Click "Add New Application Password"</li>
                            <li>Copy the generated password</li>
                          </ol>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 2: Verify Email */}
              <motion.div variants={item}>
                <Card className="h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
                  <div className="bg-primary/10 p-6 flex items-center justify-center">
                    <Mail className="h-12 w-12 text-primary" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3 flex items-center">
                      <span className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">
                        2
                      </span>
                      Verify Email
                    </h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>Check your email inbox for a verification link</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>If not found, check your spam/junk folder</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>Click the verification link to activate your account</span>
                      </li>
                    </ul>
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                      <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mr-2" />
                        <p>
                          Verification emails sometimes land in spam folders. Add our email to your contacts to prevent
                          this.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 3: Log in and Subscribe */}
              <motion.div variants={item}>
                <Card className="h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
                  <div className="bg-primary/10 p-6 flex items-center justify-center">
                    <LogIn className="h-12 w-12 text-primary" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3 flex items-center">
                      <span className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">
                        3
                      </span>
                      Log in & Subscribe
                    </h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>Log in with your email and password</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>You'll be prompted to subscribe to a plan</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>To try the tool first, click "Blog Scribe" to visit the landing page</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>Scroll to "Try It Now" section to test features</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 4: Choose a Subscription */}
              <motion.div variants={item}>
                <Card className="h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
                  <div className="bg-primary/10 p-6 flex items-center justify-center">
                    <CreditCard className="h-12 w-12 text-primary" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3 flex items-center">
                      <span className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">
                        4
                      </span>
                      Choose a Plan
                    </h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>Select a subscription plan that fits your needs</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>Complete payment via Paystack</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>You'll receive a confirmation email after successful payment</span>
                      </li>
                    </ul>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                      <p className="flex">
                        <Key className="h-5 w-5 text-blue-500 shrink-0 mr-2" />
                        <span>All plans include WordPress integration and AI-powered paraphrasing</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 5: Verify Profile URL */}
              <motion.div variants={item}>
                <Card className="h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
                  <div className="bg-primary/10 p-6 flex items-center justify-center">
                    <Link2 className="h-12 w-12 text-primary" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3 flex items-center">
                      <span className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">
                        5
                      </span>
                      Verify Profile URL
                    </h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>Go to your Profile page in the dashboard</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>Ensure your Website URL ends with a slash (/)</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>Example: https://yourwebsite.com/</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>If it doesn't end with a slash, update and save changes</span>
                      </li>
                    </ul>
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                      <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mr-2" />
                        <p>Missing the trailing slash is a common cause of connection issues!</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 6: Sync WordPress */}
              <motion.div variants={item}>
                <Card className="h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
                  <div className="bg-primary/10 p-6 flex items-center justify-center">
                    <RefreshCw className="h-12 w-12 text-primary" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3 flex items-center">
                      <span className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">
                        6
                      </span>
                      Sync WordPress
                    </h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>Return to your Dashboard</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>Click on "Sync WordPress" button</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>This ensures your WordPress connection works properly</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2 mt-0.5" />
                        <span>You're now ready to use all features!</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="using-features">
            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Globe className="h-6 w-6 mr-2 text-primary" />
                    Fetching Blog Posts
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Easily import existing Blog contents for paraphrasing and management.
                  </p>
                  <ol className="space-y-3 ml-5 list-decimal">
                    <li className="text-muted-foreground">Go to "Make Post" in the Navbar</li>
                    <li className="text-muted-foreground">Click "Fetch Posts" to get latest blog content on your selected category</li>
                    <li className="text-muted-foreground">View and select posts to paraphrase or edit</li>
                    <li className="text-muted-foreground">Use the filter options to find specific content</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <RefreshCw className="h-6 w-6 mr-2 text-primary" />
                    Paraphrasing Content
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Transform your content with AI-powered paraphrasing to create unique variations.
                  </p>
                  <ol className="space-y-3 ml-5 list-decimal">
                    <li className="text-muted-foreground">Select a post from your fetched content</li>
                    <li className="text-muted-foreground">Click "Paraphrase" to generate new versions</li>
                    <li className="text-muted-foreground">Review and edit the paraphrased content</li>
                    <li className="text-muted-foreground">If you are on our Ultimate Plan you will have access to our SEO Analyzer to enhance your post</li>
                    <li className="text-muted-foreground">Publish directly to your WordPress site or save as draft</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Link2 className="h-6 w-6 mr-2 text-primary" />
                    URL Paraphrasing
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Paraphrase content from any URL to create new blog posts for your WordPress site.
                  </p>
                  <ol className="space-y-3 ml-5 list-decimal">
                    <li className="text-muted-foreground">Go to "URL Paraphraser" in the dashboard</li>
                    <li className="text-muted-foreground">Enter the URL of the content you want to paraphrase</li>
                    <li className="text-muted-foreground">Click "Paraphrase" to generate new content</li>
                    <li className="text-muted-foreground">Edit and publish to your WordPress site</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <CreditCard className="h-6 w-6 mr-2 text-primary" />
                    Managing Subscription
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    View and manage your subscription details and usage limits.
                  </p>
                  <ol className="space-y-3 ml-5 list-decimal">
                    <li className="text-muted-foreground">Go to "Subscription" in your dashboard</li>
                    <li className="text-muted-foreground">View your current plan and usage statistics</li>
                    <li className="text-muted-foreground">Check remaining daily requests</li>
                    <li className="text-muted-foreground">Upgrade your plan if needed for more features</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="troubleshooting">
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="error-1">
                  <AccordionTrigger className="text-lg font-medium">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      WordPress Connection Failed
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3">
                    <p>This usually happens due to incorrect credentials or URL format.</p>
                    <h4 className="font-medium text-foreground">How to fix:</h4>
                    <ol className="space-y-2 ml-5 list-decimal">
                      <li>Ensure your WordPress URL ends with a slash (/)</li>
                      <li>Verify you're using an App Password, not your login password</li>
                      <li>Check that your WordPress username is correct</li>
                      <li>Make sure your WordPress site has REST API enabled</li>
                      <li>Try regenerating a new App Password in WordPress</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="error-2">
                  <AccordionTrigger className="text-lg font-medium">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      Daily Limit Reached
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3">
                    <p>You've reached the maximum number of requests allowed by your subscription plan.</p>
                    <h4 className="font-medium text-foreground">How to fix:</h4>
                    <ul className="space-y-2">
                      <li>Wait until tomorrow when your limit resets</li>
                      <li>Upgrade to a higher tier plan with more daily requests</li>
                      <li>Check your usage statistics in the Subscription page</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="error-3">
                  <AccordionTrigger className="text-lg font-medium">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      Paraphrasing Failed
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3">
                    <p>The AI paraphrasing service encountered an error processing your content.</p>
                    <h4 className="font-medium text-foreground">How to fix:</h4>
                    <ul className="space-y-2">
                      <li>Try with a smaller portion of text</li>
                      <li>
                        Ensure your content doesn't contain special characters or formatting that might cause issues
                      </li>
                      <li>Wait a few minutes and try again</li>
                      <li>If the problem persists, contact support</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="error-4">
                  <AccordionTrigger className="text-lg font-medium">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      Payment Failed Or Unable To Be Verified
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3">
                    <p>Your payment could not be processed successfully.</p>
                    <h4 className="font-medium text-foreground">How to fix:</h4>
                    <ul className="space-y-2">
                      <li>Verify Subscription Status By going to the dashboard</li>
                      <li>Check that your payment details are correct</li>
                      <li>Ensure you have sufficient funds in your account</li>
                      <li>Try a different payment method if available</li>
                      <li>Contact your bank if the transaction is being declined</li>
                      <li>Try again later or contact support if the issue persists</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="error-5">
                  <AccordionTrigger className="text-lg font-medium">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      Email Verification Link Expired
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3">
                    <p>The verification link in your email has expired.</p>
                    <h4 className="font-medium text-foreground">How to fix:</h4>
                    <ul className="space-y-2">
                      <li>Go to the login page</li>
                      <li>Click on th get new link button</li>
                      <li>Enter your email address</li>
                      <li>You'll receive a new email with a fresh verification link</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent value="faq">
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1">
                  <AccordionTrigger className="text-lg font-medium">What is BlogScribe?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    BlogScribe is an AI-powered content management tool that helps WordPress users create unique content
                    through paraphrasing. It allows you to fetch existing WordPress posts, paraphrase them, and publish
                    new versions directly to your WordPress site.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2">
                  <AccordionTrigger className="text-lg font-medium">
                    Do I need a WordPress site to use BlogScribe?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, BlogScribe is designed specifically for WordPress users. You need an active WordPress site with
                    REST API enabled to connect with our service.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3">
                  <AccordionTrigger className="text-lg font-medium">
                    What is an App Password and why do I need it?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    An App Password is a special password in WordPress that gives specific applications limited access
                    to your WordPress site. It's more secure than using your main password because it has restricted
                    permissions and can be revoked without changing your main password.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-4">
                  <AccordionTrigger className="text-lg font-medium">
                    How many requests can I make per day?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The number of daily requests depends on your subscription plan. Basic plans typically allow 5
                    requests per day, while premium plans offer more. You can view your current limit and usage in the
                    Subscription section of your dashboard.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-5">
                  <AccordionTrigger className="text-lg font-medium">Can I cancel my subscription?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, you can cancel your subscription at any time. Your access will continue until the end of your
                    current billing period. To cancel, go to the Subscription page in your dashboard and follow the
                    cancellation instructions.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-6">
                  <AccordionTrigger className="text-lg font-medium">
                    Is the paraphrased content unique?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, our AI-powered paraphrasing tool creates unique variations of your content while preserving the
                    original meaning. However, we recommend reviewing and editing the paraphrased content before
                    publishing to ensure it meets your quality standards.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-7">
                  <AccordionTrigger className="text-lg font-medium">
                    How do I get help if I have more questions?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    If you have additional questions or need support, you can contact our customer service team through
                    the "Help" section in your dashboard. We also have a comprehensive knowledge base with articles and
                    tutorials to help you get the most out of BlogScribe.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center">
          <Link href="/auth/register">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Register Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>

          <div className="mt-16 max-w-3xl mx-auto">
            {/* Video Tutorial Section - YouTube Embed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 mb-8"
            >
              <h3 className="text-xl font-bold mb-4 text-center">Registration Guide Video</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-2xl mx-auto">
                Watch our quick video guide that walks you through the registration process. This video focuses
                specifically on creating your account and setting up your WordPress connection correctly.
              </p>

              <div className="relative w-full pb-[56.25%] h-0 rounded-lg overflow-hidden shadow-lg">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/KH-4gLc2D5Y"
                  title="BlogScribe Registration Guide"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </motion.div>

            {/* Latency Hint Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8"
            >
              <div className="flex items-start">
                <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-2 mr-4">
                  <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-1">Experiencing Delays?</h3>
                  <p className="text-blue-700 dark:text-blue-400 text-sm">
                    Sometimes errors may occur due to network latency or server load. If you encounter any unexpected
                    behavior, try refreshing the page. Most temporary issues resolve with a simple refresh.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

