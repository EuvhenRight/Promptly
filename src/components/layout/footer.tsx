import Link from 'next/link';
import { Bot } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <p className="text-lg font-semibold font-headline text-foreground">Promptly</p>
        </div>
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Promptly. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm">
          <Link href="#" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="#" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
