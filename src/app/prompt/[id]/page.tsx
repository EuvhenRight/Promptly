'use client'

import dynamic from 'next/dynamic'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { Skeleton } from '@/components/ui/skeleton'

// Loading skeleton component
const PromptPageSkeleton = () => (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8'>
         <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12'>
            <div className='space-y-4'>
                <Skeleton className='w-full aspect-[3/4]' />
            </div>
            <div className='space-y-6'>
                <div className='space-y-3'>
                    <Skeleton className='h-10 w-3/4' />
                    <div className='flex items-center gap-4'>
                        <Skeleton className='h-12 w-12 rounded-full' />
                        <Skeleton className='h-6 w-1/4' />
                    </div>
                </div>
                <Skeleton className='h-6 w-1/2' />
                <div className='flex flex-wrap gap-2'>
                    <Skeleton className='h-6 w-20 rounded-full' />
                    <Skeleton className='h-6 w-24 rounded-full' />
                    <Skeleton className='h-6 w-16 rounded-full' />
                </div>
                <Skeleton className='h-20 w-full' />
                <Skeleton className='h-56 w-full' />
            </div>
        </div>
      </main>
      <Footer />
    </div>
)

// Dynamically import the client component with SSR turned off.
// This ensures the page renders only on the client, which can fix
// hydration errors or issues with server-side rendering on specific hosting environments.
const PromptClientPage = dynamic(() => import('./prompt-client-page'), {
  ssr: false,
  loading: () => <PromptPageSkeleton />,
})

export default function Page() {
  return <PromptClientPage />
}
