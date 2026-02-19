export type AiModel = {
    id: string; // Unique identifier for the dropdown
    name: string; // User-facing name
    ref: string; // Replicate model version hash
    type: 'image' | 'video'; // Type of model
    plans: ('free' | 'starter' | 'pro')[]; // Which plans can access this model
    cost: number; // Cost in credits for one generation
    supportsAspectRatio?: boolean;
};

// This list is updated based on your suggestions and publicly available models on Replicate.
export const AVAILABLE_MODELS: AiModel[] = [
    // --- Image Models ---
    {
        id: 'flux-schnell',
        name: 'FLUX.1 [schnell] — швидкий і дешевий',
        ref: 'black-forest-labs/flux.1-schnell:e6c2b168b03b35a76159495111b933a39e03d42c310313f84852d431c3855b4a',
        type: 'image',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: true,
        cost: 10,
    },
    {
        id: 'stable-diffusion-3',
        name: 'Stable Diffusion 3',
        ref: 'stability-ai/stable-diffusion-3:fde492d5a9e9768a335044b93c233181b37bce82b13289047f68cf503e433435',
        type: 'image',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: true,
        cost: 20,
    },
    {
        id: 'ideogram-1.0',
        name: 'Ideogram 1.0 — текст у зображеннях',
        ref: 'ideogram/ideogram-1.0:b94b49653696245133b9c7b2c589e49b805408a385f0611e868e82e5414d021c',
        type: 'image',
        plans: ['starter', 'pro'],
        supportsAspectRatio: true,
        cost: 30,
    },
    {
        id: 'openjourney',
        name: 'OpenJourney (Midjourney Style)',
        ref: 'prompthero/openjourney:9936c2001faa2194a261c01381f90e65261879985476014a0a37a334593a05eb',
        type: 'image',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: false,
        cost: 15,
    },

    // --- Video Models ---
    {
        id: 'google-veo-3.1-fast',
        name: 'Google Veo 3.1 [Fast]',
        ref: 'google/veo-3.1-fast',
        type: 'video',
        plans: ['pro'],
        supportsAspectRatio: true,
        cost: 150,
    },
    {
        id: 'stability-stable-video-diffusion',
        name: 'Stable Video Diffusion',
        ref: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51d3159fa3a7deab854a6a1aa68c3',
        type: 'video',
        plans: ['starter', 'pro'],
        supportsAspectRatio: false, // Requires image input
        cost: 100,
    },
];
