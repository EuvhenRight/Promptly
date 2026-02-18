'use client';

import { generateImage, type GenerateImageInput } from '@/ai/flows/generate-image-flow';
import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { AVAILABLE_MODELS, type AiModel } from '@/lib/ai-models';
import type { UserProfile } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { doc } from 'firebase/firestore';
import { Coins, Download, Expand, ImageIcon, Loader2, Sparkles, Upload, Video, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { deductCreditsForGeneration, createPrompt, type CreatePromptData } from '@/firebase/users';
import { useRouter } from 'next/navigation';
import { PromptForm, type PromptFormValues } from '@/app/admin/prompts/new/prompt-form';
import { rehostImage } from '@/app/admin/prompts/actions';
import { useCategories } from '@/hooks/use-categories';
import { useTypes } from '@/hooks/use-types';
import { useModels } from '@/hooks/use-models';


const formSchema = z.object({
    prompt: z.string().min(1, 'Please enter a prompt.'),
    model: z.string().min(1, 'Please select a model.'),
    aspectRatio: z.string().optional(),
});

type GenerationFormValues = z.infer<typeof formSchema>;

const GENERATION_COST = 25;

export default function GeneratePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('image');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [referenceImage, setReferenceImage] = useState<File | null>(null);
    const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
    const [isSubmittingPrompt, setIsSubmittingPrompt] = useState(false);

    const { categories } = useCategories();
    const { types } = useTypes();
    const { models } = useModels();

    const userProfileRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [firestore, user]
    );
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
    const userPlan = userProfile?.planId ?? 'free';
    const credits = userProfile?.credits ?? 0;

    const accessibleModels = useMemo(
        () => AVAILABLE_MODELS, // All models accessible for now
        []
    );

    const form = useForm<GenerationFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            prompt: '',
            model: accessibleModels[0]?.id,
            aspectRatio: '1:1',
        },
    });

    useEffect(() => {
        if (accessibleModels.length > 0 && !form.getValues('model')) {
            form.setValue('model', accessibleModels[0].id);
        }
    }, [accessibleModels, form]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setReferenceImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            setReferenceImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    async function onSubmit(data: GenerationFormValues) {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Not signed in',
                description: 'Please sign in to generate images.',
            });
            return;
        }
        if (credits < GENERATION_COST) {
            toast({
                variant: 'destructive',
                title: 'Insufficient Credits',
                description: `You need at least ${GENERATION_COST} credits to generate an image.`,
                action: <Link href="/account/plans#credits">Buy Credits</Link>
            });
            return;
        }

        setIsGenerating(true);
        setGeneratedImageUrl(null);

        const generationInput: GenerateImageInput = {
            modelId: data.model,
            prompt: data.prompt,
            referenceImageUrl: referenceImagePreview ?? undefined,
            aspectRatio: data.aspectRatio,
        };

        try {
            const result = await generateImage(generationInput);
            setGeneratedImageUrl(result.imageUrl);

            if (firestore) {
                await deductCreditsForGeneration(firestore, user.uid, GENERATION_COST);
            }

            toast({ title: 'Image generated successfully!' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
        } finally {
            setIsGenerating(false);
        }
    }

    const handleCreatePrompt = async (data: PromptFormValues) => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
            return;
        }
        if (!generatedImageUrl) {
            toast({ variant: 'destructive', title: 'No Image', description: 'An image must be generated first.' });
            return;
        }
    
        setIsSubmittingPrompt(true);
    
        try {
            toast({ title: 'Saving your image...', description: 'Please wait.' });
            const rehostedImageUrl = await rehostImage(generatedImageUrl, `gen-${Date.now()}`);
    
            const promptData: CreatePromptData = {
                title: data.title,
                description: data.description,
                price: data.price,
                isPrivate: data.isPrivate,
                categoryId: data.categoryId,
                typeId: data.typeId,
                modelId: data.modelId,
                tags: data.tags,
                privateContent: data.privateContent,
                imageUrl: rehostedImageUrl,
            };
    
            toast({ title: 'Creating prompt...', description: 'Just a moment.' });
            const result = await createPrompt(firestore, user.uid, promptData);
    
            if (result.success && result.promptId) {
                toast({ title: 'Prompt Created!', description: 'Your prompt has been successfully published.' });
                router.push(`/prompt/${result.promptId}`);
            } else {
                throw new Error(result.error || 'An unknown error occurred while saving the prompt.');
            }
    
        } catch (error: any) {
            console.error('Failed to create prompt from generated image:', error);
            toast({ variant: 'destructive', title: 'Error Creating Prompt', description: error.message });
        } finally {
            setIsSubmittingPrompt(false);
        }
    };
    
    const selectedModelInfo = accessibleModels.find(m => m.id === form.getValues('model'));
    const firestoreModel = models.find(m => m.name === selectedModelInfo?.name);
    const imagesType = types.find(t => t.name.toLowerCase() === 'images');
    const availableCategories = categories.filter(c => c.name && c.id);
    const randomCategory = availableCategories.length > 0 
        ? availableCategories[Math.floor(Math.random() * availableCategories.length)] 
        : null;

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-12">
                {/* Left Panel */}
                <div className="lg:col-span-4 xl:col-span-3 border-r bg-muted/20 p-6 space-y-6">
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setActiveTab('image')}
                            variant={activeTab === 'image' ? 'default' : 'outline'}
                            className="flex-1"
                        >
                            <ImageIcon className="mr-2 h-4 w-4" /> Image
                        </Button>
                        <Button
                            onClick={() => setActiveTab('video')}
                            variant={activeTab === 'video' ? 'default' : 'outline'}
                            className="flex-1"
                            disabled
                        >
                            <Video className="mr-2 h-4 w-4" /> Video
                        </Button>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select a model</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose a model" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {accessibleModels.map(model => (
                                                    <SelectItem key={model.id} value={model.id}>
                                                        {model.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="aspectRatio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Aspect Ratio</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose an aspect ratio" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="1:1">1:1 (Square)</SelectItem>
                                                <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                                                <SelectItem value="2:3">2:3 (Portrait)</SelectItem>
                                                <SelectItem value="21:9">21:9 (Cinematic)</SelectItem>
                                                <SelectItem value="9:16">9:16 (Tall Portrait)</SelectItem>
                                                <SelectItem value="9:21">9:21 (Extra Tall)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="prompt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prompt</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="A beautiful sunset over mountains..."
                                                rows={5}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormItem>
                                <FormLabel>Reference Image (Optional)</FormLabel>
                                <div
                                    className="relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary"
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                                    {referenceImagePreview ? (
                                        <>
                                            <Image src={referenceImagePreview} alt="Reference preview" layout="fill" className="object-contain rounded-md" />
                                             <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 h-6 w-6 z-10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setReferenceImage(null);
                                                    setReferenceImagePreview(null);
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="space-y-1">
                                            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 10MB</p>
                                        </div>
                                    )}
                                </div>
                            </FormItem>

                            <div className="space-y-4">
                               <p className="text-sm text-muted-foreground flex justify-between">
                                    <span>Cost:</span>
                                    <span>{GENERATION_COST} credits</span>
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    <Button type="submit" className="w-full" size="lg" disabled={isGenerating}>
                                        {isGenerating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="mr-2 h-4 w-4" />
                                        )}
                                        Generate image
                                    </Button>
                                </div>
                                <Card>
                                    <CardContent className="pt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Coins className="h-5 w-5 text-amber-500" />
                                            <div>
                                                <p className="font-bold">{credits.toLocaleString()} Credits</p>
                                                {credits < GENERATION_COST && <p className="text-xs text-destructive">Running low!</p>}
                                            </div>
                                        </div>
                                        <Button variant="link" asChild>
                                            <Link href="/account/plans#credits">Buy more</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </form>
                    </Form>
                </div>

                {/* Right Panel */}
                <div className="lg:col-span-8 xl:col-span-9 p-6 flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.3) 1px, transparent 0)',
                    backgroundSize: '20px 20px',
                }}>
                    <div className="w-full max-w-4xl">
                        {isGenerating && (
                            <div className="space-y-4 text-center">
                                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                                <h3 className="text-lg font-semibold">Generating...</h3>
                                <p className="text-muted-foreground">This may take a moment.</p>
                            </div>
                        )}
                        {!isGenerating && !generatedImageUrl && (
                            <div className="text-center">
                                <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">AI Image Generation</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Enter a prompt on the left to start generating. Your image will appear here.
                                </p>
                            </div>
                        )}
                        {!isGenerating && generatedImageUrl && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Finalize and Submit Your Prompt</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <PromptForm 
                                        onSubmit={handleCreatePrompt}
                                        isSubmitting={isSubmittingPrompt}
                                        initialData={{
                                            title: form.getValues('prompt').split(' ').slice(0, 6).join(' '),
                                            privateContent: form.getValues('prompt'),
                                            imageUrl: generatedImageUrl,
                                            categoryId: randomCategory?.id || '',
                                            typeId: imagesType?.id || '',
                                            modelId: firestoreModel?.id || '',
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
