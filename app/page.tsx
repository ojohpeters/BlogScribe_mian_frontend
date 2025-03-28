"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { isAuthenticated } from "@/lib/utils"
import { fetchWithAuth } from "@/lib/auth"
import { Loader2, ArrowRight, FileText, RefreshCw, Globe, Search, Zap, Clock, Shield, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import PricingPlans from "@/components/PricingPlans"
import HowItWorksSection from "@/components/HowItWorksSection"

interface Post {
  title: string
  url: string
}

export default function Home() {
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchedPosts, setFetchedPosts] = useState<Post[]>([])
  const [showPosts, setShowPosts] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Animated text state
  const [activeWordIndex, setActiveWordIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [typedText, setTypedText] = useState("")
  const words = ["Fetch", "Paraphrase", "Optimize", "Publish"]
  const typingSpeed = 100
  const deleteSpeed = 50
  const pauseDuration = 1500
  const typingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check authentication status on client-side
    setIsLoggedIn(isAuthenticated())
    setAuthChecked(true)
  }, [])

  // Improved typewriter effect
  useEffect(() => {
    const currentWord = words[activeWordIndex]

    if (isTyping) {
      if (typedText.length < currentWord.length) {
        // Still typing the current word
        typingRef.current = setTimeout(() => {
          setTypedText(currentWord.substring(0, typedText.length + 1))
        }, typingSpeed)
      } else {
        // Finished typing, pause before deleting
        typingRef.current = setTimeout(() => {
          setIsTyping(false)
        }, pauseDuration)
      }
    } else {
      if (typedText.length > 0) {
        // Deleting the current word
        typingRef.current = setTimeout(() => {
          setTypedText(typedText.substring(0, typedText.length - 1))
        }, deleteSpeed)
      } else {
        // Move to the next word
        const nextIndex = (activeWordIndex + 1) % words.length
        setActiveWordIndex(nextIndex)
        setIsTyping(true)
      }
    }

    return () => {
      if (typingRef.current) clearTimeout(typingRef.current)
    }
  }, [typedText, isTyping, activeWordIndex, words])

  // Function to handle the "Try It Now" button click
  const handleTryItNow = async () => {
    setIsLoading(true)
    setShowPosts(false)

    try {
      // First check if user is logged in
      if (!isAuthenticated()) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access this feature.",
          variant: "destructive",
        })
        router.push("/auth/login?returnUrl=" + encodeURIComponent(window.location.pathname))
        return
      }

      const response = await fetchWithAuth("https://blogbackend-crimson-frog-3248.fly.dev/api/fetch-news/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      // Handle unauthorized response
      if (response.status === 401) {
        // Clear the invalid token
        localStorage.removeItem("authToken")
        toast({
          title: "Session Expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        })
        router.push("/auth/login?returnUrl=" + encodeURIComponent(window.location.pathname))
        return
      }

      // Handle free trial used case (429 Too Many Requests)
      if (response.status === 429) {
        const data = await response.json()
        if (data.error === "User has already used free trial. No access!") {
          toast({
            title: "Free Trial Used",
            description: "Please subscribe to continue using this feature.",
            variant: "destructive",
          })
          router.push("/pricing")
          return
        }
      }

      const data = await response.json()

      // Handle other error cases
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to fetch posts")
      }

      // Transform the data into the correct format
      let transformedData: Post[] = []
      if (typeof data === "object" && data !== null) {
        transformedData = Object.entries(data).map(([key, value]) => ({
          title: key,
          url: value as string,
        }))
      }

      // Store the posts and show them
      setFetchedPosts(transformedData)
      setShowPosts(true)

      toast({
        title: "Success!",
        description: `Retrieved ${transformedData.length} posts.`,
      })
    } catch (error) {
      console.error("Error fetching news:", error)

      // If the token is missing, redirect to login
      if (error instanceof Error && error.message === "No authentication token found") {
        toast({
          title: "Authentication Required",
          description: "Please log in to access this feature.",
          variant: "destructive",
        })
        router.push("/auth/login?returnUrl=" + encodeURIComponent(window.location.pathname))
        return
      }

      // Handle other errors
      toast({
        title: "Error",
        description: "Failed to fetch posts. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderTryItNowSection = (isMainSection = false) => (
    <section className={`py-16 sm:py-20 ${isMainSection ? "bg-secondary" : ""} relative overflow-hidden`}>
      {isMainSection && (
        <div className="absolute inset-0 bg-grid-black/[0.05] dark:bg-grid-white/[0.05] bg-[size:60px_60px]" />
      )}

      <div className="container relative mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Try Our Tools</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Fetch your WordPress posts and use our AI to paraphrase them instantly.
          </p>
          <Button size="lg" onClick={handleTryItNow} disabled={isLoading} className="relative group overflow-hidden">
            <span className="relative z-10 flex items-center">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Fetch Latest News
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </span>
            <span className="absolute inset-0 bg-primary-foreground/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
          </Button>
        </div>

        {/* Display fetched posts */}
        {showPosts && fetchedPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Available Posts</CardTitle>
                <CardDescription>
                  {isLoggedIn ? "Click on a post to paraphrase it" : "Sign up to paraphrase these posts and more"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {fetchedPosts.map((post, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col space-y-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-base sm:text-lg line-clamp-2">{post.title}</h3>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Globe className="h-4 w-4 mr-1" />
                              <a
                                href={post.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate hover:underline"
                              >
                                {post.url}
                              </a>
                            </div>
                          </div>
                          {isLoggedIn ? (
                            <Button
                              onClick={() => {
                                localStorage.setItem("paraphrasePost", JSON.stringify(post))
                                router.push("/make-post")
                              }}
                              className="w-full sm:w-auto"
                            >
                              Paraphrase This Post
                            </Button>
                          ) : (
                            <Button onClick={() => router.push("/auth/register")} className="w-full sm:w-auto">
                              Sign Up to Paraphrase
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </section>
  )

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If user is logged in, redirect to dashboard
  if (isLoggedIn) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <section className="bg-primary text-primary-foreground py-16 sm:py-20">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Welcome Back!</h2>
              <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
                Continue managing your WordPress blog with our AI-powered tools.
              </p>
              <Button
                size="lg"
                className="w-full sm:w-auto group relative overflow-hidden"
                onClick={() => router.push("/dashboard")}
              >
                <span className="relative z-10 flex items-center">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 bg-primary-foreground/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
              </Button>
            </div>
          </section>

          {/* How It Works Section */}
          <HowItWorksSection />

          {/* Try It Now Section for logged-in users */}
          {renderTryItNowSection(true)}
        </main>

        <footer className="bg-background py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="mb-4 md:mb-0">&copy; 2025 BlogScribe. All rights reserved.</p>
              <nav className="space-x-4">
                <Link href="/terms" className="hover:underline">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/contact" className="hover:underline">
                  Contact Us
                </Link>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // For non-authenticated users, show the regular landing page
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-primary via-primary/90 to-primary/80 text-primary-foreground py-16 sm:py-24 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />

          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-blob" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
          </div>

          <div className="container relative mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="relative z-10"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-block mb-4 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <span className="text-sm font-medium">AI-Powered Blog Management</span>
              </motion.div>

              <motion.h2
                className="text-4xl sm:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.4,
                  type: "spring",
                  stiffness: 100,
                }}
              >
                Supercharge Your WordPress Blog
              </motion.h2>

              {/* Improved animated text display - mobile friendly */}
              <div className="mb-6 px-4">
                <div className="text-xl sm:text-2xl md:text-3xl font-semibold flex flex-col sm:flex-row items-center justify-center">
                  <span className="mb-2 sm:mb-0 sm:mr-2">Easily</span>
                  <div className="relative h-10 w-full sm:w-auto min-w-[180px] flex items-center justify-center sm:justify-start">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={typedText}
                        className="text-white font-bold"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {typedText}
                        <motion.span
                          className="inline-block w-1 h-7 bg-white ml-0.5"
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                        />
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <span className="mt-2 sm:mt-0 sm:ml-2">Your Content</span>
                </div>
              </div>

              <motion.p
                className="text-lg sm:text-xl mb-10 max-w-3xl mx-auto leading-relaxed text-white/90"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Revolutionize your content workflow with our comprehensive WordPress companion. Import posts directly
                from up-to-date sources, transform them with state-of-the-art AI, enhance SEO performance, and publish
                polished content—all from a single dashboard.
              </motion.p>

              <motion.div
                className="space-y-4 sm:space-y-0 sm:space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto group relative overflow-hidden bg-white text-primary hover:bg-white/90"
                  >
                    <span className="relative z-10 flex items-center">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                  </Button>
                </Link>
                <Link href="#pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-primary/20 hover:bg-primary/10 text-primary hover:text-primary dark:border-white/20 dark:hover:bg-white/10 dark:text-white dark:hover:text-white"
                  >
                    View Pricing
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-24 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                Powerful Features
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our comprehensive toolkit is designed to streamline your content creation process from start to finish
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "WordPress Integration",
                  description: "Seamlessly connect to your WordPress site and import posts with a single click",
                  icon: <FileText className="h-10 w-10 text-primary" />,
                },
                {
                  title: "AI Paraphrasing",
                  description: "Transform your content with advanced AI that maintains your unique voice and style",
                  icon: <RefreshCw className="h-10 w-10 text-primary" />,
                },
                {
                  title: "URL Paraphraser",
                  description:
                    "Instantly rewrite content from any URL while preserving the original meaning and structure",
                  icon: <Globe className="h-10 w-10 text-primary" />,
                },
                {
                  title: "SEO Optimization",
                  description: "Enhance your content's search visibility with built-in SEO tools and recommendations",
                  icon: <Search className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Instant Publishing",
                  description:
                    "Create and publish new blog posts directly to your WordPress site without switching platforms",
                  icon: <Zap className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Content History",
                  description: "Access your complete history of fetched and paraphrased content for easy reference",
                  icon: <Clock className="h-10 w-10 text-primary" />,
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="flex flex-col h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm hover:bg-card/80">
                    <CardHeader className="pb-2">
                      <div className="mb-4 p-2 w-fit rounded-lg bg-primary/10">{feature.icon}</div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Benefits Section */}
        <section className="py-16 sm:py-20 bg-secondary/50 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-black/[0.05] dark:bg-grid-white/[0.05] bg-[size:60px_60px]" />

          <div className="container relative mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                Why Choose Us
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              {[
                {
                  title: "Save Time",
                  description: "Reduce content creation time by up to 70% with our streamlined workflow",
                  icon: <Clock className="h-8 w-8 text-primary" />,
                },
                {
                  title: "Unique Content",
                  description:
                    "Generate 100% unique content that passes plagiarism checks while maintaining your voice",
                  icon: <Shield className="h-8 w-8 text-primary" />,
                },
                {
                  title: "Boost Engagement",
                  description: "Improve reader engagement with professionally optimized and polished content",
                  icon: <Sparkles className="h-8 w-8 text-primary" />,
                },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col items-center p-6 rounded-xl bg-background/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-4 rounded-full bg-primary/10 mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Try It Now Section */}
        {renderTryItNowSection(true)}

        {/* Pricing Section */}
        <section id="pricing" className="py-16 sm:py-20 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                Simple Pricing
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the perfect plan for your blog management needs
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <PricingPlans showFeaturedOnly={false} />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background py-10 border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">BlogScribe</h3>
              <p className="text-muted-foreground text-sm">
                Revolutionize your content workflow with our comprehensive WordPress companion.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/dashboard"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 sm:mb-0">&copy; 2025 BlogScribe. All rights reserved.</p>
            <div className="flex space-x-4">
              <Link href="https://twitter.com" className="text-muted-foreground hover:text-primary transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-twitter"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="https://facebook.com" className="text-muted-foreground hover:text-primary transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-facebook"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="https://instagram.com" className="text-muted-foreground hover:text-primary transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-instagram"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

