'use client'

export default function CommunityFeed() {
	return (
		<div className='space-y-4'>
			<h2 className='font-headline text-xl font-bold flex items-center gap-2'>
				<span>📢</span> Community Feed
			</h2>
			<div className='rounded-lg border bg-card p-8 text-center text-muted-foreground'>
				<p>No activity yet</p>
			</div>
		</div>
	)
}
