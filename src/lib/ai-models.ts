export type AiModel = {
    id: string; // Unique identifier for the dropdown
    name: string; // User-facing name
    ref: `${string}/${string}:${string}`; // Replicate model:version hash
    plans: ('free' | 'starter' | 'pro')[]; // Which plans can access this model
    supportsAspectRatio?: boolean;
};

// We can expand this list with more models from Replicate.
// See https://replicate.com/collections/text-to-image for examples.
// IMPORTANT: The `ref` MUST be the full version hash.
export const AVAILABLE_MODELS: AiModel[] = [
    {
        id: 'stable-diffusion-3',
        name: 'Stable Diffusion 3',
        ref: 'stability-ai/stable-diffusion-3:fde492d5a9e9768a335044b93c233181b37bce82b13289047f68cf503e433435',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: true,
    },
    {
        id: 'flux-1-dev',
        name: 'FLUX.1 Dev (experimental)',
        ref: 'black-forest-labs/flux.1-dev:da8c8b7ade9487920785196f131109405d46f53e34d7d4c82e666a7b8e5c84b1',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: false, // Uses width/height
    },
    {
        id: 'ideogram-1.0',
        name: 'Ideogram 1.0',
        ref: 'ideogram/ideogram-1.0:b94b49653696245133b9c7b2c589e49b805408a385f0611e868e82e5414d021c',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: true,
    },
    {
        id: 'sdxl',
        name: 'SDXL',
        ref: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: false,
    },
    {
        id: 'openjourney',
        name: 'OpenJourney (Midjourney Style)',
        ref: 'prompthero/openjourney:9936c2001faa2194a261c01381f90e65261879985476014a0a37a334593a05eb',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: false,
    },
];
