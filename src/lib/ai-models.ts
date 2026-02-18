export type AiModel = {
    id: string; // Unique identifier for the dropdown
    name: string; // User-facing name
    ref: string; // Replicate model version hash
    plans: ('free' | 'starter' | 'pro')[]; // Which plans can access this model
    supportsAspectRatio?: boolean;
    costEstimate?: string; // приблизно, для кредитів
};

// This list is updated based on your suggestions and publicly available models on Replicate.
// Models like Imagen 4 are not included as they are not publicly available on the platform.
export const AVAILABLE_MODELS: AiModel[] = [
    // FLUX family (Black Forest Labs)
    {
        id: 'flux-schnell',
        name: 'FLUX.1 [schnell] — швидкий і дешевий',
        ref: 'black-forest-labs/flux.1-schnell:e6c2b168b03b35a76159495111b933a39e03d42c310313f84852d431c3855b4a',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: true,
        costEstimate: 'дуже дешево (~0.01–0.03 €)'
    },
    {
        id: 'flux-dev',
        name: 'FLUX.1 [dev] — відкрита версія',
        ref: 'black-forest-labs/flux.1-dev:da8c8b7ade9487920785196f131109405d46f53e34d7d4c82e666a7b8e5c84b1',
        plans: ['starter', 'pro'],
        supportsAspectRatio: true,
        costEstimate: 'середньо (~0.02–0.05 €)'
    },

    // Other popular models
     {
        id: 'stable-diffusion-3',
        name: 'Stable Diffusion 3',
        ref: 'stability-ai/stable-diffusion-3:fde492d5a9e9768a335044b93c233181b37bce82b13289047f68cf503e433435',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: true,
        costEstimate: 'дешево',
    },
    {
        id: 'ideogram-1.0',
        name: 'Ideogram 1.0 — текст у зображеннях',
        ref: 'ideogram/ideogram-1.0:b94b49653696245133b9c7b2c589e49b805408a385f0611e868e82e5414d021c',
        plans: ['starter', 'pro'],
        supportsAspectRatio: true,
        costEstimate: 'середньо'
    },
    {
        id: 'openjourney',
        name: 'OpenJourney (Midjourney Style)',
        ref: 'prompthero/openjourney:9936c2001faa2194a261c01381f90e65261879985476014a0a37a334593a05eb',
        plans: ['free', 'starter', 'pro'],
        supportsAspectRatio: false,
        costEstimate: 'дешево'
    },
];
