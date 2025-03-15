"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, label, error, type, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)

    React.useEffect(() => {
      setHasValue(!!props.value)
    }, [props.value])

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "peer h-14 w-full rounded-md border bg-background px-4 pt-4 pb-1.5 text-sm ring-offset-background placeholder-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            error ? "border-destructive" : "border-input",
            className,
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false)
            setHasValue(!!e.target.value)
          }}
          onChange={(e) => setHasValue(!!e.target.value)}
          {...props}
        />
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
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    )
  },
)
FloatingLabelInput.displayName = "FloatingLabelInput"

export { FloatingLabelInput }

