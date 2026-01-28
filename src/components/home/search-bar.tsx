'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

export default function SearchBar() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search over 2.7k AI prompts..."
            className="pl-10 h-12 text-base rounded-full bg-muted border-transparent focus-visible:ring-primary focus-visible:bg-background focus-visible:border-border"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px] h-12 rounded-full text-base">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              <SelectItem value="midjourney">Midjourney</SelectItem>
              <SelectItem value="sdxl">SDXL</SelectItem>
              <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="featured">
            <SelectTrigger className="w-full md:w-[180px] h-12 rounded-full text-base">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="top">Top</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-3">About 2,718 results</p>
    </div>
  );
}
