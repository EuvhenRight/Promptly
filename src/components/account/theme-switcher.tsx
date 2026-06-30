'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '../ui/button'

export function ThemeSwitcher({ isPro }: { isPro: boolean }) {
	const { theme, setTheme } = useTheme()
	const isDarkMode = theme === 'dark'

	const toggleTheme = (checked: boolean) => {
		if (isPro) {
			setTheme(checked ? 'dark' : 'light')
		}
	}

	if (!isPro) {
		return (
			<div className='flex items-center justify-between rounded-lg border p-4 bg-muted/50'>
				<div className='flex flex-col space-y-1'>
					<div className='flex items-center gap-2'>
						<span className='font-medium'>Dark Mode</span>
						<Badge
							variant='outline'
							className='border-primary text-primary font-bold'
						>
							PRO
						</Badge>
					</div>
					<span className='font-normal leading-snug text-muted-foreground'>
						Upgrade to PRO to unlock dark mode.
					</span>
				</div>
				<Button asChild>
					<Link href='/account/plans'>Upgrade</Link>
				</Button>
			</div>
		)
	}

	return (
		<div className='flex items-center justify-between rounded-lg border p-4'>
			<Label
				htmlFor='theme-switch'
				className='flex flex-col space-y-1 cursor-pointer'
			>
				<div className='flex items-center gap-2'>
					<span>Dark Mode</span>
					<Badge
						variant='outline'
						className='border-primary text-primary font-bold'
					>
						PRO
					</Badge>
				</div>
				<span className='font-normal leading-snug text-muted-foreground'>
					Toggle between light and dark themes.
				</span>
			</Label>
			<div className='flex items-center gap-2'>
				<Sun className='h-5 w-5' />
				<Switch
					id='theme-switch'
					checked={isDarkMode}
					onCheckedChange={toggleTheme}
					disabled={!isPro}
				/>
				<Moon className='h-5 w-5' />
			</div>
		</div>
	)
}