import type { Metadata } from 'next'
import Script from 'next/script'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'
import './globals.css'

export const metadata: Metadata = {
  title: 'David Maynard | Software Artist',
  description: 'Personal website running on Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
          <div className="container">
          <header className="header">
            <div className="logo">
              <a href="/">David Maynard</a>
            </div>
            <nav className="nav-links">
              <a href="/">Home</a>
              <a href="/about">About</a>
              <a href="/blog">Blog</a>
              <ThemeToggle />
            </nav>
          </header>
          <main>
            {children}
          </main>
        </div>
        </ThemeProvider>
        <Script strategy="afterInteractive" data-goatcounter="https://dmaynard.goatcounter.com/count" src="//gc.zgo.at/count.js" />
      </body>
    </html>
  )
}
