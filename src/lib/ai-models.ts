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
        id: 'sdxl',
        name: 'SDXL',
        ref: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: false,
    },
    {
        id: 'playground-v2.5',
        name: 'Playground v2.5',
        ref: 'playgroundai/playground-v2.5:59570a9d422c0b801edd531189c44d1502b45a057201b54fa31572922a488e04',
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
    {
        id: 'stable-diffusion-2-1',
        name: 'Stable Diffusion 2.1',
        ref: 'stability-ai/stable-diffusion-2-1:db21e45d3f7023abc2a46ee38a23973f6dce167b653d32b545f5585a7008d872',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: false,
    },
];
