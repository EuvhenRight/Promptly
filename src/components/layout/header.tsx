'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Menu,
  Search,
  ShoppingCart,
  User,
  LogOut,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithGoogle, signOutUser } from '@/firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';


const GoogleIcon = () => (
  <svg viewBox="0 0 48" className="h-5 w-5">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.922C34.962 5.518 29.8 3.5 24 3.5C11.31 3.5 1.5 13.31 1.5 26S11.31 48.5 24 48.5c11.438 0 20.286-8.38 21.6-19.199l.011-.217z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691c2.242-2.85 5.484-4.691 9.194-4.691c3.059 0 5.842 1.154 7.961 3.039L29.263 12.2C25.423 8.796 20.262 6.5 15.5 6.5C9.933 6.5 4.952 9.658 1.453 14.168L6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 48.5c5.757 0 10.938-2.117 14.7-5.571L32.5 36.93C30.01 39.205 27.205 40.5 24 40.5c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l6.04-6.04C34.963 5.518 29.802 3.5 24 3.5c-12.69 0-22.5 9.81-22.5 22.5S11.31 48.5 24 48.5z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.922C34.962 5.518 29.8 3.5 24 3.5C11.31 3.5 1.5 13.31 1.5 26S11.31 48.5 24 48.5c11.438 0 20.286-8.38 21.6-19.199l.011-.217z"
    />
  </svg>
);


export default function Header() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
        
        {/* Left: Title and Mobile Nav */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl font-bold">Promptly</span>
          </Link>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>
                    <Link href="/" className="flex items-center gap-2">
                      <Bot className="h-6 w-6 text-primary" />
                      <span className="font-headline text-xl font-bold">
                        Promptly
                      </span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-8 flex flex-col gap-4">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search prompts..." className="pl-10" />
                  </div>
                  <nav className="mt-4 flex flex-col gap-2">
                    <Button variant="ghost" asChild className="justify-start">
                      <Link href="#">Pricing</Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start">
                      <Link href="#">Community</Link>
                    </Button>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Spacer */}
        <div className="hidden flex-1 md:block" />

<<<<<<< HEAD
        <div className="flex flex-1 items-center w-full md:justify-center">
          <div className="relative w-full max-w-xl ">
=======
        {/* Center: Desktop Nav & Search */}
        <div className="hidden md:flex items-center gap-6">
           <nav className="flex items-center gap-6 text-sm">
             <Link href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</Link>
             <Link href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">Community</Link>
           </nav>
           <div className="relative w-full max-w-xs">
>>>>>>> 83dbbcc (Робитимо тепер крок за кроком)
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search prompts..." className="pl-10" />
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: Cart & Auth */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <Link href="/cart" className="hidden md:block">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Cart</span>
            </Button>
          </Link>

          {isUserLoading ? (
            <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{user.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userProfile?.role === 'admin' && (
                  <DropdownMenuItem onSelect={() => router.push('/admin')}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOutUser}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={signInWithGoogle}>
              <GoogleIcon />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
