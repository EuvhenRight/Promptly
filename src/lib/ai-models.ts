export type AiModel = {
    id: string; // Unique identifier for the dropdown
    name: string; // User-facing name
    ref: `${string}/${string}`; // Replicate model reference WITHOUT version
    plans: ('free' | 'starter' | 'pro')[]; // Which plans can access this model
    supportsAspectRatio?: boolean;
};

// We can expand this list with more models from Replicate.
// See https://replicate.com/collections/text-to-image for examples.
export const AVAILABLE_MODELS: AiModel[] = [
    {
        id: 'stable-diffusion-3',
        name: 'Stable Diffusion 3',
        ref: 'stability-ai/stable-diffusion-3',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: true,
    },
    {
        id: 'stable-diffusion-2',
        name: 'Stable Diffusion 2.1',
        ref: 'stability-ai/stable-diffusion-2-1',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: false,
    },
    {
        id: 'sdxl',
        name: 'SDXL',
        ref: 'stability-ai/sdxl',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: false,
    },
    {
        id: 'playground-v2.5',
        name: 'Playground v2.5',
        ref: 'playgroundai/playground-v2.5',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: false,
    },
    {
        id: 'openjourney',
        name: 'OpenJourney (Midjourney Style)',
        ref: 'prompthero/openjourney',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: false,
    }
];
