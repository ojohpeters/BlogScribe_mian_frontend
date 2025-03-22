import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { DesktopNav } from "@/components/desktop-nav"
import { MobileNav } from "@/components/mobile-nav"
import { SubscriptionBanner } from "@/components/ui/subscription-banner"
import { UserProvider } from "@/lib/user-context"
import { SubscriptionProvider } from "@/lib/subscription-context"
import "./globals.css"
import { LoadingProvider } from "@/contexts/loading-context"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "BlogScribe - AI-Powered Blog Management",
  description: "Manage and optimize your WordPress blog with AI-powered tools",
    generator: 'v0.dev, Ojoh Peters'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <LoadingProvider>
            <UserProvider>
              <SubscriptionProvider>
                <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
                  <DesktopNav />
                  <main className="flex-grow container mx-auto px-4 sm:px-6 py-6 md:py-10 pt-[60px]">
                    {/* SubscriptionBanner will only show for authenticated users with expired subscriptions */}
                    <SubscriptionBanner />
                    {children}
                  </main>
                  <MobileNav />
                </div>
                <Toaster />
              </SubscriptionProvider>
            </UserProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
