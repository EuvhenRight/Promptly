'use client';
import Link from 'next/link';
import {
  Bot,
  Menu,
  Search,
  ShoppingCart,
  User,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <div className="mr-4 hidden items-center md:flex">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl font-bold">PromptVerse</span>
          </Link>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col gap-4 p-4">
                <Link href="/" className="flex items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  <span className="font-headline text-xl font-bold">
                    PromptVerse
                  </span>
                </Link>
                <nav className="flex flex-col gap-2">
                  <Button variant="ghost" className="justify-start">Categories</Button>
                  <Button variant="ghost" className="justify-start">Explore</Button>
                  <Button variant="ghost" className="justify-start">Top Creators</Button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-1 items-center justify-center md:justify-start">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search prompts..." className="pl-10" />
            </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <ShoppingCart className="h-5 w-5" />
            <span className="sr-only">Cart</span>
          </Button>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost">
              <LogIn className="mr-2 h-4 w-4" />
              Log In
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up
            </Button>
          </div>
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">User profile</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
