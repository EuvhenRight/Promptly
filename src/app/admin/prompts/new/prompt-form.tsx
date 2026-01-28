'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const promptFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  price: z.coerce
    .number({ invalid_type_error: 'Price must be a number.' })
    .min(0, 'Price cannot be negative.')
    .default(0),
  categories: z.string().min(1, 'Please add at least one category.'),
  tags: z.string().min(1, 'Please add at least one tag.'),
  privateContent: z.string().min(10, 'The private prompt content is required.'),
});

export type PromptFormValues = z.infer<typeof promptFormSchema>;

interface PromptFormProps {
  onSubmit: (values: PromptFormValues) => Promise<void>;
  initialData?: Partial<PromptFormValues>;
  isEditing?: boolean;
  isSubmitting?: boolean;
}

export function PromptForm({ onSubmit, initialData, isEditing = false, isSubmitting = false }: PromptFormProps) {
  const router = useRouter();
  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      price: 0,
      categories: '',
      tags: '',
      privateContent: '',
    },
  });

  const handleFormSubmit = async (values: PromptFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Cyberpunk Cityscape" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Public Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A detailed description of what this prompt generates."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="privateContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Private Prompt Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="The actual prompt text that users will purchase."
                          className="min-h-[150px] font-mono"
                          {...field}
                        />
                      </FormControl>
                       <FormDescription>
                        This content is hidden until a user purchases the prompt.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
             <Card>
              <CardHeader>
                <CardTitle>Metadata & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="4.99" {...field} />
                      </FormControl>
                       <FormDescription>
                        Enter 0 for a free prompt.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categories</FormLabel>
                      <FormControl>
                        <Input placeholder="Characters, Environments" {...field} />
                      </FormControl>
                      <FormDescription>
                        Comma-separated values.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="photorealistic, 8k, high detail" {...field} />
                      </FormControl>
                      <FormDescription>
                        Comma-separated values. Helps with search.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

             <Card>
              <CardHeader>
                <CardTitle>Image Uploader</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Image uploader coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4">
           <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
           </Button>
           <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Prompt'}
           </Button>
        </div>
      </form>
    </Form>
  );
}
