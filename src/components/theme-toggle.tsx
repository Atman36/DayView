'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('theme')
    const enabled = stored ? stored === 'dark' : getSystemPrefersDark()
    setIsDark(enabled)
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    const root = document.documentElement
    if (next) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={toggle} title={isDark ? 'Светлая тема' : 'Тёмная тема'} aria-label="Переключить тему">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}


