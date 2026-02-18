export type AiModel = {
    id: string; // Unique identifier for the dropdown
    name: string; // User-facing name
    ref: `${string}/${string}:${string}`; // Replicate model version reference
    plans: ('free' | 'starter' | 'pro')[]; // Which plans can access this model
};

// We can expand this list with more models from Replicate.
// See https://replicate.com/collections/text-to-image for examples.
export const AVAILABLE_MODELS: AiModel[] = [
    {
        id: 'stable-diffusion-3',
        name: 'Stable Diffusion 3',
        ref: 'stability-ai/stable-diffusion-3:fde492d5a9e9d4a234a41e95e1975001d784a9b5f925e01694a15993b9c44d15',
        plans: ['free', 'starter', 'pro'],
    },
    {
        id: 'stable-diffusion-2',
        name: 'Stable Diffusion 2.1',
        ref: 'stability-ai/stable-diffusion-2-1:b7aa9a23d3839446f53480a71109047e170c01377461a35560b45d2334849a63',
        plans: ['free', 'starter', 'pro'],
    },
    {
        id: 'sdxl',
        name: 'SDXL',
        ref: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        plans: ['free', 'starter', 'pro'],
    },
    {
        id: 'playground-v2.5',
        name: 'Playground v2.5',
        ref: 'playgroundai/playground-v2.5:59570a9cf54033a859b840594e9eba532986423985474668f448c4146313ed43',
        plans: ['free', 'starter', 'pro'],
    },
    {
        id: 'openjourney',
        name: 'OpenJourney (Midjourney Style)',
        ref: 'prompthero/openjourney:9936c2001faa2194a261c01381f90e65261879985476014a0a37a334593a05eb',
        plans: ['free', 'starter', 'pro'],
    }
];
