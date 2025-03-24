"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function FloatingLabelInput({ className, label, error, type, ...props }: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isPassword = type === "password"
  const inputType = isPassword ? (showPassword ? "text" : "password") : type

  useEffect(() => {
    setHasValue(!!props.value)
  }, [props.value])

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type={inputType}
          className={cn(
            "peer h-14 w-full rounded-md border bg-background px-4 pt-4 pb-1.5 text-sm ring-offset-background",
            isPassword && "pr-10",
            "placeholder-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            error ? "border-destructive" : "border-input",
            className,
          )}
          placeholder=" "
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false)
            setHasValue(!!e.target.value)
          }}
          onChange={(e) => {
            setHasValue(!!e.target.value)
            props.onChange?.(e)
          }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-0"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        <label
          className={cn(
            "absolute left-4 top-4 z-10 origin-[0] transform text-sm duration-200 ease-out",
            (isFocused || hasValue) && "-translate-y-2 scale-75 text-xs",
            isFocused ? "text-primary" : "text-muted-foreground",
            error && (isFocused ? "text-destructive" : "text-destructive/80"),
          )}
        >
          {label}
        </label>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

