"use client"

import { useState } from "react"
import Link from "next/link"
import { Home, PenTool, Settings, Menu } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Sidebar() {
  const [open, setOpen] = useState(false)

  const NavItems = () => (
    <>
      <Link href="/" className="flex items-center space-x-2 hover:text-primary">
        <Home size={20} />
        <span>Dashboard</span>
      </Link>
      <Link href="/posts" className="flex items-center space-x-2 hover:text-primary">
        <PenTool size={20} />
        <span>Posts</span>
      </Link>
      <Link href="/settings" className="flex items-center space-x-2 hover:text-primary">
        <Settings size={20} />
        <span>Settings</span>
      </Link>
    </>
  )

  return (
    <>
      <aside className="w-64 bg-secondary text-secondary-foreground p-6 hidden lg:block">
        <h2 className="text-2xl font-bold mb-6">Sports Blog</h2>
        <nav className="space-y-4">
          <NavItems />
        </nav>
        <div className="absolute bottom-6">
          <ModeToggle />
        </div>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden fixed top-4 left-4 z-50">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="h-full bg-secondary text-secondary-foreground p-6">
            <h2 className="text-2xl font-bold mb-6">Sports Blog</h2>
            <nav className="space-y-4" onClick={() => setOpen(false)}>
              <NavItems />
            </nav>
            <div className="absolute bottom-6">
              <ModeToggle />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

