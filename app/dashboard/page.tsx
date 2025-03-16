"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, RefreshCw, CreditCard, BarChart3, FileText, Plus, Clock, Newspaper } from "lucide-react"
import { format } from "date-fns"
import { fetchWithAuth, getRecentPosts, type RecentPost } from "@/lib/utils"
import { useUserSubscription } from "./layout"

interface SubscriptionDetails {
  plan: {
    name: string
    daily_limit: number
  }
  status: string
  expires_at: string
  requests_today: number
}

interface UserActivityDetails {
  id: number
  daily_api_requests: number
  fetched_posts: number
  paraphrased: number
  user: number
  severity: string
}

interface DashboardStats {
  total_posts: number
  total_paraphrased: number
}

interface APIPost {
  title: string;
  excerpt?: string;
  created_at?: string;
  published_at?: string;
  url?: string;
}

export default function Dashboard() {
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [userActivity, setUserActivity] = useState<UserActivityDetails | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { hasSubscribedBefore, hasActivePlan, subscriptionData } = useUserSubscription()

  useEffect(() => {
    let isSubscribed = true;
    const abortController = new AbortController();

    const loadDashboardData = async () => {
      // Load each piece of data independently
      const loadActivity = async () => {
        try {
          if (!isSubscribed) return;
          await fetchUserActivity(abortController.signal);
        } catch (error: unknown) {
          if (!isSubscribed) return;
          if (error instanceof Error && error.name === 'AbortError') {
            return; // Silently handle aborted requests
          }
          console.error('Error loading activity:', error);
          // Set fallback activity data without showing error
          setUserActivity({
            id: 0,
            user: 0,
            fetched_posts: 0,
            paraphrased: 0,
            daily_api_requests: 0,
            severity: "none"
          });
        }
      };

      const loadStats = async () => {
        try {
          if (!isSubscribed) return;
          await fetchDashboardStats(abortController.signal);
        } catch (error: unknown) {
          if (!isSubscribed) return;
          if (error instanceof Error && error.name === 'AbortError') {
            return; // Silently handle aborted requests
          }
          console.error('Error loading stats:', error);
        }
      };

      // Start all loads in parallel but handle them independently
      if (!isSubscribed) return;
      
      await Promise.allSettled([
        loadActivity(),
        loadStats()
      ]);
    };

    loadDashboardData();

    // Cleanup function
    return () => {
      isSubscribed = false;
      abortController.abort();
    };
  }, []);

  // Fetch user activity details from the API
  const fetchUserActivity = async (signal?: AbortSignal) => {
    try {
      const response = await fetchWithAuth(
        "http://127.0.0.1:8000/api/details/",
        { signal },
        router,
        toast
      );

      const data = await response.json();
      const activityData = Array.isArray(data) && data.length > 0 ? data[0] : null;

      if (!activityData) {
        setUserActivity({
          id: 0,
          user: 0,
          fetched_posts: 0,
          paraphrased: 0,
          daily_api_requests: 0,
          severity: "none"
        });
        return;
      }

      setUserActivity({
        id: activityData.id,
        user: activityData.user,
        fetched_posts: activityData.fetched_posts,
        paraphrased: activityData.paraphrased || 0,
        daily_api_requests: activityData.daily_api_requests,
        severity: "none"
      });
    } catch (error: unknown) {
      // Set default values on error
      setUserActivity({
        id: 0,
        user: 0,
        fetched_posts: 0,
        paraphrased: 0,
        daily_api_requests: 0,
        severity: "none"
      });

      // Only show specific API errors via toast, ignore network and timeout errors
      if (error instanceof Error && 
          !error.name.includes('AbortError') && 
          !error.message.includes('Failed to fetch') && 
          !error.message.includes('network') &&
          !error.message.includes('timeout')) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  // Update the fetchDashboardStats function to calculate stats from userActivity
  const fetchDashboardStats = async (signal?: AbortSignal) => {
    setIsLoadingStats(true)
    try {
      // Calculate stats from userActivity data
      setStats({
        total_posts: userActivity?.fetched_posts || 0,
        total_paraphrased: userActivity?.paraphrased || 0
      })
    } catch (error: unknown) {
      console.error("Error calculating dashboard stats:", error)
      // Keep existing data if any
      if (!stats) {
      setStats({
          total_posts: 0,
          total_paraphrased: 0
        })
      }
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Update stats when userActivity changes
  useEffect(() => {
    if (userActivity && stats) {
      setStats({
        total_posts: userActivity.fetched_posts,
        total_paraphrased: userActivity.paraphrased
      })
    }
  }, [userActivity])

  // Function to refresh all data
  const refreshAllData = () => {
    fetchDashboardStats()
    fetchUserActivity()
  }

  // Handle navigation to different pages
  const navigateTo = (path: string) => {
    router.push(path)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Update the Dashboard page for a more modern look
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage your WordPress blog content</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshAllData} disabled={isLoadingStats} className="rounded-full">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStats ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="rounded-full shadow-sm hover:shadow transition-all duration-200"
            onClick={() => navigateTo("/make-post")}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Subscription and Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Subscription Card */}
        <Card className="md:col-span-2 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-bl-full"></div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-lg flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-primary" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            {!subscriptionData ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No active subscription found</p>
                <Button
                  onClick={() => navigateTo("/pricing")}
                  size="sm"
                  className="relative overflow-hidden group rounded-full"
                >
                  <span className="relative z-10">View Plans</span>
                  <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    {subscriptionData.plan.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`font-medium px-3 py-1 rounded-full text-sm ${
                      subscriptionData.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expires:</span>
                  <span className="font-medium">{formatDate(subscriptionData.expires_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Daily Usage:</span>
                  <span className="font-medium">
                    {userActivity?.daily_api_requests || 0} / {subscriptionData.plan.daily_limit || 0} requests
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2.5 mt-2 overflow-hidden">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${((userActivity?.daily_api_requests || 0) / (subscriptionData.plan.daily_limit || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Posts Card */}
        <Card className="overflow-hidden relative group hover:border-primary/50 transition-colors duration-300">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 dark:bg-primary/10 rounded-bl-full group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors duration-300"></div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            {isLoadingStats ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="text-center">
                <p className="text-3xl font-bold">{stats?.total_posts || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">WordPress posts</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paraphrased Content Card */}
        <Card className="overflow-hidden relative group hover:border-primary/50 transition-colors duration-300">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 dark:bg-primary/10 rounded-bl-full group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors duration-300"></div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              Paraphrased
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            {isLoadingStats ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="text-center">
                <p className="text-3xl font-bold">{stats?.total_paraphrased || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">AI-enhanced posts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6">
        {/* Quick Actions Card */}
        <Card className="overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 dark:bg-primary/10 rounded-bl-full"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage your blog</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <Button
              className="w-full justify-start relative overflow-hidden group rounded-full shadow-sm hover:shadow transition-all duration-200"
              onClick={() => navigateTo("/make-post")}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="relative z-10">Create New Post</span>
              <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start relative overflow-hidden group rounded-full"
              onClick={() => navigateTo("/fetched-posts")}
            >
              <Newspaper className="mr-2 h-4 w-4" />
              <span className="relative z-10">View Fetched Posts</span>
              <span className="absolute inset-0 bg-muted transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start relative overflow-hidden group rounded-full"
              onClick={() => navigateTo("/dashboard/subscription")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span className="relative z-10">Manage Subscription</span>
              <span className="absolute inset-0 bg-muted transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
            </Button>
            {subscriptionData && subscriptionData.plan.name === "Ultimate" && (
              <Button
                variant="outline"
                className="w-full justify-start relative overflow-hidden group rounded-full"
                onClick={() => navigateTo("/url-paraphraser")}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                <span className="relative z-10">URL Paraphraser</span>
                <span className="absolute inset-0 bg-muted transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

