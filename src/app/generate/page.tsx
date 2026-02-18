'use client';

import { generateImage, type GenerateImageInput } from '@/ai/flows/generate-image-flow';
import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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


const formSchema = z.object({
    prompt: z.string().min(1, 'Please enter a prompt.'),
    model: z.string().min(1, 'Please select a model.'),
});

type GenerationFormValues = z.infer<typeof formSchema>;

export default function GeneratePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('image');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [referenceImage, setReferenceImage] = useState<File | null>(null);
    const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);

    const userProfileRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [firestore, user]
    );
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
    const userPlan = userProfile?.planId ?? 'free';
    const credits = userProfile?.credits ?? 0;

    const accessibleModels = useMemo(
        () => AVAILABLE_MODELS.filter(model => model.plans.includes(userPlan)),
        [userPlan]
    );

    const form = useForm<GenerationFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            prompt: '',
            model: accessibleModels[0]?.id,
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
        setIsGenerating(true);
        setGeneratedImageUrl(null);

        const selectedModel = AVAILABLE_MODELS.find(m => m.id === data.model);
        if (!selectedModel) {
            toast({ variant: 'destructive', title: 'Invalid model selected.' });
            setIsGenerating(false);
            return;
        }

        const generationInput: GenerateImageInput = {
            model: selectedModel.ref,
            prompt: data.prompt,
            referenceImageUrl: referenceImagePreview ?? undefined,
        };

        try {
            const result = await generateImage(generationInput);
            setGeneratedImageUrl(result.imageUrl);
            toast({ title: 'Image generated successfully!' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
        } finally {
            setIsGenerating(false);
        }
    }

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
                                    <span>2 credits</span>
                                </p>
                                <Button type="submit" className="w-full" size="lg" disabled={isGenerating}>
                                    {isGenerating ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="mr-2 h-4 w-4" />
                                    )}
                                    Generate image
                                </Button>
                                <Card>
                                    <CardContent className="pt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Coins className="h-5 w-5 text-amber-500" />
                                            <div>
                                                <p className="font-bold">{credits.toLocaleString()} Credits</p>
                                                {credits < 10 && <p className="text-xs text-destructive">Running low!</p>}
                                            </div>
                                        </div>
                                        <Button variant="link" asChild>
                                            <Link href="/account/plans">Buy more</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </form>
                    </Form>
                </div>

                {/* Right Panel */}
                <div className="lg:col-span-8 xl:col-span-9 p-6 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.3) 1px, transparent 0)',
                    backgroundSize: '20px 20px',
                }}>
                    <div className="w-full max-w-2xl text-center">
                        {isGenerating && (
                            <div className="space-y-4">
                                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                                <h3 className="text-lg font-semibold">Generating your masterpiece...</h3>
                                <p className="text-muted-foreground">This may take a moment.</p>
                            </div>
                        )}
                        {!isGenerating && !generatedImageUrl && (
                            <div className="space-y-4">
                                <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground" />
                                <h3 className="text-xl font-semibold">Your generated media will show here</h3>
                                <p className="text-muted-foreground">Use the form to the left to start</p>
                            </div>
                        )}
                        {!isGenerating && generatedImageUrl && (
                           <Card className="relative group overflow-hidden">
                                <Image src={generatedImageUrl} alt="Generated image" width={1024} height={1024} className="w-full h-auto object-contain" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <Button size="icon" asChild>
                                        <a href={generatedImageUrl} download="generated-image.png">
                                            <Download />
                                        </a>
                                    </Button>
                                     <Dialog>
                                        <DialogTrigger asChild>
                                            <Button size="icon"><Expand /></Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-7xl w-full p-0 bg-transparent border-none shadow-none" hideCloseButton>
                                            <Image src={generatedImageUrl} alt="Generated image" width={1920} height={1080} className="w-full h-auto object-contain max-h-[90vh] rounded-lg" />
                                            <DialogClose className="absolute right-4 top-4 rounded-full p-2 bg-black/50 text-white opacity-80 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary data-[state=open]:text-muted-foreground">
                                                <X className="h-8 w-8" />
                                                <span className="sr-only">Close</span>
                                            </DialogClose>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
    