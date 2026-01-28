'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { Bot, Home, FileText, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

function AdminNavLink({ href, children, icon: Icon }: { href: string, children: React.ReactNode, icon: React.ElementType }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link href={href} className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            isActive && "bg-muted text-primary"
        )}>
            <Icon className="h-4 w-4" />
            {children}
        </Link>
    )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    const isLoading = isUserLoading || isProfileLoading;
    if (isLoading) {
      return; // Still checking, wait.
    }

    if (!user || userProfile?.role !== 'admin') {
      router.replace('/'); // Redirect to home if not logged in or not an admin
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg">Verifying access...</p>
      </div>
    );
  }

  if (userProfile?.role === 'admin' && user) {
    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <div className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/admin" className="flex items-center gap-2 font-semibold">
                  <Bot className="h-6 w-6 text-primary" />
                  <span className="">Promptly Admin</span>
                </Link>
              </div>
              <div className="flex-1">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                  <AdminNavLink href="/admin" icon={Home}>Dashboard</AdminNavLink>
                  <AdminNavLink href="/admin/prompts" icon={FileText}>Prompts</AdminNavLink>
                  <AdminNavLink href="/admin/users" icon={Users}>Users</AdminNavLink>
                </nav>
              </div>
            </div>
          </div>
          <div className="flex flex-col">
             <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                {/* Mobile Nav could go here */}
                <div className="w-full flex-1" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full">
                        <Avatar className="h-8 w-8">
                           <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'Admin'} />
                           <AvatarFallback>{user.displayName?.charAt(0) ?? 'A'}</AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/')}>Back to App</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/')}>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
             </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              {children}
            </main>
          </div>
        </div>
    );
  }

  // Fallback for the brief moment before redirect, or if role is not admin
  return null;
}
