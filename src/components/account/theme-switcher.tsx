'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const isDarkMode = theme === 'dark'

  const toggleTheme = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light')
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <Label htmlFor="theme-switch" className="flex flex-col space-y-1">
        <div className="flex items-center gap-2">
          <span>Dark Mode</span>
          <Badge variant="outline" className="border-primary text-primary font-bold">PRO</Badge>
        </div>
        <span className="font-normal leading-snug text-muted-foreground">
          Toggle between light and dark themes.
        </span>
      </Label>
      <div className="flex items-center gap-2">
        <Sun className="h-5 w-5" />
        <Switch
          id="theme-switch"
          checked={isDarkMode}
          onCheckedChange={toggleTheme}
        />
        <Moon className="h-5 w-5" />
      </div>
    </div>
  )
}
