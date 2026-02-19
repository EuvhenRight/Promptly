'use client';

import { generateImage, type GenerateImageInput } from '@/ai/flows/generate-image-flow';
import { generateVideo, type GenerateVideoInput } from '@/ai/flows/generate-video-flow';
import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import { deductCreditsForGeneration } from '@/firebase/users';
import { useRouter } from 'next/navigation';
import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const imageFormSchema = z.object({
    prompt: z.string().min(1, 'Please enter a prompt.'),
    model: z.string().min(1, 'Please select a model.'),
    aspectRatio: z.string().optional(),
});

const videoFormSchema = z.object({
    prompt: z.string().min(1, 'Please enter a prompt.'),
    model: z.string().min(1, 'Please select a model.'),
    duration: z.coerce.number().min(2).max(8).default(5),
    aspectRatio: z.string().optional(),
});

type ImageFormValues = z.infer<typeof imageFormSchema>;
type VideoFormValues = z.infer<typeof videoFormSchema>;

export default function GeneratePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Media states
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    
    const [referenceImage, setReferenceImage] = useState<File | null>(null);
    const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);

    const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
    const credits = userProfile?.credits ?? 0;

    const imageModels = useMemo(() => AVAILABLE_MODELS.filter(m => m.type === 'image'), []);
    const videoModels = useMemo(() => AVAILABLE_MODELS.filter(m => m.type === 'video'), []);
    
    const imageForm = useForm<ImageFormValues>({
        resolver: zodResolver(imageFormSchema),
        defaultValues: { prompt: '', model: imageModels[0]?.id, aspectRatio: '1:1' },
    });

    const videoForm = useForm<VideoFormValues>({
        resolver: zodResolver(videoFormSchema),
        defaultValues: { prompt: '', model: videoModels[0]?.id, duration: 5, aspectRatio: '16:9' },
    });
    
    const selectedImageModel = imageModels.find(m => m.id === imageForm.watch('model'));
    const selectedVideoModel = videoModels.find(m => m.id === videoForm.watch('model'));

    const currentGenerationCost = activeTab === 'image' 
        ? (selectedImageModel?.cost ?? 0)
        : (selectedVideoModel?.cost ?? 0);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setReferenceImage(file);
            const reader = new FileReader();
            reader.onloadend = () => { setReferenceImagePreview(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };
    
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); };
    
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            setReferenceImage(file);
            const reader = new FileReader();
            reader.onloadend = () => { setReferenceImagePreview(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const checkCreditsAndSignIn = (cost: number) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Not signed in', description: 'Please sign in to generate content.' });
            return false;
        }
        if (credits < cost) {
            toast({
                variant: 'destructive',
                title: 'Insufficient Credits',
                description: `You need at least ${cost} credits.`,
                action: <Link href="/account/plans#credits">Buy Credits</Link>
            });
            return false;
        }
        return true;
    };
    
    async function onImageSubmit(data: ImageFormValues) {
        if (!checkCreditsAndSignIn(currentGenerationCost)) return;

        setIsGenerating(true);
        setGeneratedImageUrl(null);
        setGeneratedVideoUrl(null);

        try {
            const result = await generateImage({
                modelId: data.model,
                prompt: data.prompt,
                referenceImageUrl: referenceImagePreview ?? undefined,
                aspectRatio: data.aspectRatio,
            });
            setGeneratedImageUrl(result.imageUrl);
            if (firestore && user) await deductCreditsForGeneration(firestore, user.uid, currentGenerationCost);
            toast({ title: 'Image generated successfully!' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
        } finally {
            setIsGenerating(false);
        }
    }

    async function onVideoSubmit(data: VideoFormValues) {
        if (!checkCreditsAndSignIn(currentGenerationCost)) return;
        
        setIsGenerating(true);
        setGeneratedImageUrl(null);
        setGeneratedVideoUrl(null);
        
        try {
            const result = await generateVideo({
                modelId: data.model,
                prompt: data.prompt,
                duration: data.duration,
                aspectRatio: data.aspectRatio,
            });
            setGeneratedVideoUrl(result.videoUrl);
            if (firestore && user) await deductCreditsForGeneration(firestore, user.uid, currentGenerationCost);
            toast({ title: 'Video generated successfully!' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Video Generation Failed', description: error.message });
        } finally {
            setIsGenerating(false);
        }
    }

    const handleCreatePromptClick = () => {
        if (!generatedImageUrl && !generatedVideoUrl) {
            toast({ variant: 'destructive', title: 'Nothing to publish', description: 'Please generate an image or video first.' });
            return;
        }

        const promptTitle = activeTab === 'image' ? imageForm.getValues('prompt') : videoForm.getValues('prompt');
        const modelId = activeTab === 'image' ? imageForm.getValues('model') : videoForm.getValues('model');
        const mediaUrl = generatedImageUrl || generatedVideoUrl;

        const queryParams = new URLSearchParams({
            title: promptTitle.split(' ').slice(0, 6).join(' '),
            privateContent: promptTitle,
            imageUrl: mediaUrl || '',
            model: modelId,
        });

        router.push(`/submit?${queryParams.toString()}`);
    };

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
                        >
                            <Video className="mr-2 h-4 w-4" /> Video
                        </Button>
                    </div>

                    {activeTab === 'image' && (
                        <Form {...imageForm}>
                            <form onSubmit={imageForm.handleSubmit(onImageSubmit)} className="space-y-6">
                                {/* Image Form Fields */}
                                <FormField control={imageForm.control} name="model" render={({ field }) => (
                                    <FormItem><FormLabel>Select a model</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Choose an image model" /></SelectTrigger></FormControl><SelectContent>{imageModels.map(model => (<SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={imageForm.control} name="aspectRatio" render={({ field }) => (
                                    <FormItem><FormLabel>Aspect Ratio</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Choose an aspect ratio" /></SelectTrigger></FormControl><SelectContent><SelectItem value="1:1">1:1 (Square)</SelectItem><SelectItem value="16:9">16:9 (Widescreen)</SelectItem><SelectItem value="2:3">2:3 (Portrait)</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={imageForm.control} name="prompt" render={({ field }) => (
                                    <FormItem><FormLabel>Prompt</FormLabel><FormControl><Textarea placeholder="A beautiful sunset over mountains..." rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormItem>
                                    <FormLabel>Reference Image (Optional)</FormLabel>
                                    <div className="relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary" onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => document.getElementById('file-upload')?.click()}>
                                        <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                                        {referenceImagePreview ? (
                                            <><Image src={referenceImagePreview} alt="Reference preview" layout="fill" className="object-contain rounded-md" /><Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6 z-10" onClick={(e) => { e.stopPropagation(); setReferenceImage(null); setReferenceImagePreview(null); }}><X className="h-4 w-4" /></Button></>
                                        ) : (
                                            <div className="space-y-1"><Upload className="mx-auto h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Click or drag & drop</p></div>
                                        )}
                                    </div>
                                </FormItem>
                            </form>
                        </Form>
                    )}

                    {activeTab === 'video' && (
                         <Form {...videoForm}>
                            <form onSubmit={videoForm.handleSubmit(onVideoSubmit)} className="space-y-6">
                                {/* Video Form Fields */}
                                <FormField control={videoForm.control} name="model" render={({ field }) => (
                                    <FormItem><FormLabel>Select a model</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Choose a video model" /></SelectTrigger></FormControl><SelectContent>{videoModels.map(model => (<SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={videoForm.control} name="aspectRatio" render={({ field }) => (
                                    <FormItem><FormLabel>Aspect Ratio</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Choose an aspect ratio" /></SelectTrigger></FormControl><SelectContent><SelectItem value="16:9">16:9 (Widescreen)</SelectItem><SelectItem value="9:16">9:16 (Portrait)</SelectItem><SelectItem value="1:1">1:1 (Square)</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={videoForm.control} name="duration" render={({ field }) => (
                                    <FormItem><FormLabel>Duration: {field.value} seconds</FormLabel><FormControl><Slider defaultValue={[5]} min={2} max={8} step={1} onValueChange={(v) => field.onChange(v[0])} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={videoForm.control} name="prompt" render={({ field }) => (
                                    <FormItem><FormLabel>Prompt</FormLabel><FormControl><Textarea placeholder="A majestic dragon soaring..." rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                             </form>
                        </Form>
                    )}

                    <div className="space-y-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground flex justify-between">
                            <span>Cost:</span>
                            <span className="flex items-center gap-1"><Coins className="h-4 w-4 text-amber-500" />{currentGenerationCost} credits</span>
                        </p>
                        <Button onClick={activeTab === 'image' ? imageForm.handleSubmit(onImageSubmit) : videoForm.handleSubmit(onVideoSubmit)} className="w-full" size="lg" disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate
                        </Button>
                         <Card>
                            <CardContent className="pt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Coins className="h-5 w-5 text-amber-500" />
                                    <div>
                                        <p className="font-bold">{credits.toLocaleString()} Credits</p>
                                        {credits < currentGenerationCost && <p className="text-xs text-destructive">Not enough credits!</p>}
                                    </div>
                                </div>
                                <Button variant="link" asChild><Link href="/account/plans#credits">Buy more</Link></Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="lg:col-span-8 xl:col-span-9 p-6 flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                    <div className="w-full max-w-4xl space-y-4">
                        {isGenerating && (
                            <div className="space-y-4 text-center">
                                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                                <h3 className="text-lg font-semibold">Generating...</h3>
                                <p className="text-muted-foreground">This may take a moment.</p>
                            </div>
                        )}
                        {!isGenerating && !generatedImageUrl && !generatedVideoUrl && (
                            <div className="text-center text-muted-foreground">
                                <Sparkles className="mx-auto h-12 w-12" />
                                <h3 className="mt-4 text-lg font-semibold">Your generation will appear here</h3>
                            </div>
                        )}
                        {generatedImageUrl && (
                             <Card>
                                <CardHeader>
                                    <CardTitle>Generated Image</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Image src={generatedImageUrl} alt="Generated image" width={1024} height={1024} className="rounded-lg" />
                                    <Button onClick={handleCreatePromptClick}>Publish as Prompt</Button>
                                </CardContent>
                            </Card>
                        )}
                        {generatedVideoUrl && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Generated Video</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <video src={generatedVideoUrl} controls autoPlay loop className="rounded-lg w-full" />
                                     <Button onClick={handleCreatePromptClick}>Publish as Prompt</Button>
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
