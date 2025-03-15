import type React from "react"
;('"use client')

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const Navigation = () => {
  const pathname = usePathname()

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Blog Post Manager
          </Link>
          <div className="flex space-x-4">
            <NavLink href="/" active={pathname === "/"}>
              Home
            </NavLink>
            <NavLink href="/make-post" active={pathname === "/make-post"}>
              Make Post
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  )
}

const NavLink = ({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) => {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      {children}
    </Link>
  )
}

export default Navigation

