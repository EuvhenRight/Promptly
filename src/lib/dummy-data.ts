import type { Prompt as PromptType, UserProfile } from './types';

export type Prompt = PromptType;

export type Creator = UserProfile;

export type FilterOption = {
  id: string;
  name: string;
};

export const DUMMY_PROMPTS: Prompt[] = [
  {
    id: '1',
    authorId: '1',
    title: 'Cyberpunk Cityscape',
    description: 'A highly detailed prompt for creating futuristic cyberpunk cityscapes with neon-lit streets and flying vehicles.',
    price: 4.99,
    images: ['prompt-1-img'],
    rating: { average: 4.8, count: 124 },
    tags: ['cyberpunk', 'cityscape', 'sci-fi'],
    categories: ['Midjourney'],
    stats: { views: 12500, sales: 312, likes: 2300 },
  },
  {
    id: '2',
    authorId: '2',
    title: 'Enchanted Forest Creatures',
    description: 'Create magical and whimsical creatures that inhabit an ancient, enchanted forest. Perfect for fantasy illustrations.',
    price: 2.99,
    images: ['prompt-2-img'],
    rating: { average: 4.9, count: 256 },
    tags: ['fantasy', 'creature', 'forest'],
    categories: ['Stable Diffusion'],
    stats: { views: 22100, sales: 540, likes: 4100 },
  },
  {
    id: '3',
    authorId: '3',
    title: 'Photorealistic Portraits',
    description: 'A prompt set designed to generate stunningly realistic portraits with natural lighting and emotional depth.',
    price: 9.99,
    images: ['prompt-3-img'],
    rating: { average: 4.7, count: 88 },
    tags: ['portrait', 'photorealistic', 'human'],
    categories: ['FLUX'],
    stats: { views: 8900, sales: 120, likes: 980 },
  },
  {
    id: '4',
    authorId: '1',
    title: 'Vintage Anime Style',
    description: 'Recreate the classic 90s anime aesthetic with this prompt, featuring distinct cell shading and retro color palettes.',
    price: 0,
    images: ['prompt-4-img'],
    rating: { average: 4.6, count: 312 },
    tags: ['anime', 'vintage', '90s'],
    categories: ['ChatGPT Image'],
    stats: { views: 35200, sales: 0, likes: 6200 },
  },
  {
    id: '5',
    authorId: '4',
    title: 'Abstract Fluid Dynamics',
    description: 'Generate beautiful and complex abstract images resembling fluid and smoke dynamics. Ideal for wallpapers and art prints.',
    price: 1.99,
    images: ['prompt-5-img'],
    rating: { average: 4.8, count: 95 },
    tags: ['abstract', 'fluid', 'art'],
    categories: ['Midjourney'],
    stats: { views: 7600, sales: 88, likes: 1100 },
  },
  {
    id: '6',
    authorId: '2',
    title: 'Steampunk Inventions',
    description: 'Design intricate and imaginative steampunk contraptions and inventions, full of gears, cogs, and polished brass.',
    price: 3.49,
    images: ['prompt-6-img'],
    rating: { average: 4.7, count: 150 },
    tags: ['steampunk', 'invention', 'mechanical'],
    categories: ['SDXL'],
    stats: { views: 18400, sales: 250, likes: 2900 },
  },
];

export const DUMMY_CREATORS: Creator[] = [
  {
    uid: '1',
    email: 'pixel@forge.com',
    displayName: 'PixelForge',
    photoURL: 'https://picsum.photos/seed/1/40/40',
    role: 'user',
    isSeller: true,
    stats: { totalSales: 56200, monthlySales: 4300, weeklySales: 950, reputation: 99 },
  },
  {
    uid: '2',
    email: 'artisan@ai.com',
    displayName: 'ArtisanAI',
    photoURL: 'https://picsum.photos/seed/2/40/40',
    role: 'user',
    isSeller: true,
    stats: { totalSales: 78000, monthlySales: 5100, weeklySales: 1200, reputation: 98 },
  },
  {
    uid: '3',
    email: 'dream@weaver.com',
    displayName: 'DreamWeaver',
    photoURL: 'https://picsum.photos/seed/3/40/40',
    role: 'user',
    isSeller: true,
    stats: { totalSales: 41500, monthlySales: 3200, weeklySales: 750, reputation: 97 },
  },
  {
    uid: '4',
    email: 'synth@sprite.com',
    displayName: 'SynthSprite',
    photoURL: 'https://picsum.photos/seed/4/40/40',
    role: 'user',
    isSeller: true,
    stats: { totalSales: 25000, monthlySales: 2800, weeklySales: 600, reputation: 95 },
  },
    {
    uid: '5',
    email: 'giga@prompt.com',
    displayName: 'GigaPrompt',
    photoURL: 'https://picsum.photos/seed/5/40/40',
    role: 'user',
    isSeller: true,
    stats: { totalSales: 18500, monthlySales: 1900, weeklySales: 450, reputation: 96 },
  },
];

export const DUMMY_FILTERS = {
  categories: [
    { id: 'sci-fi', name: 'Science Fiction' },
    { id: 'fantasy', name: 'Fantasy' },
    { id: 'characters', name: 'Characters' },
    { id: 'environments', name: 'Environments' },
    { id: 'abstract', name: 'Abstract' },
    { id: 'photorealism', name: 'Photorealism' },
  ],
  models: [
    { id: 'sdxl', name: 'SDXL' },
    { id: 'midjourney-v6', name: 'Midjourney v6' },
    { id: 'dall-e-3', name: 'DALL-E 3' },
    { id: 'stable-diffusion-2', name: 'Stable Diffusion 2.1' },
  ],
};

export const DUMMY_MODELS_AND_STYLES = [
  { id: 'video', name: 'Video' },
  { id: 'chatgpt-image', name: 'ChatGPT Image' },
  { id: 'midjourney', name: 'Midjourney' },
  { id: 'flux', name: 'FLUX' },
  { id: 'sora', name: 'Sora' },
  { id: 'stable-diffusion', name: 'Stable Diffusion' },
  { id: 'portraits', name: 'Portraits' },
  { id: 'photography', name: 'Photography' },
  { id: 'anime', name: 'Anime' },
  { id: 'logo', name: 'Logo' },
  { id: 'character-design', name: 'Character Design' },
];


// This is a helper to find placeholder images from the JSON file
// We are re-exporting it from here for convenience in components
import { PlaceHolderImages } from './placeholder-images';
export const placeholderImages = PlaceHolderImages;
