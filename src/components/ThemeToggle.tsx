"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button 
        className="theme-toggle-btn" 
        aria-label="Toggle Theme" 
        style={{ visibility: 'hidden' }}
      >
        ☀️
      </button>
    )
  }

  return (
    <button
      className="theme-toggle-btn"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle Theme"
      title="Toggle Dark/Light Mode"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  )
}
