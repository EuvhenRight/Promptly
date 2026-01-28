export type Prompt = {
  id: string;
  authorId: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  rating: {
    average: number;
    count: number;
  };
  tags: string[];
};

export type Creator = {
  uid: string;
  displayName: string;
  avatarUrl: string;
  isSeller: boolean;
  stats: {
    totalSales: number;
    monthlySales: number;
    weeklySales: number;
    reputation: number;
  };
};

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
  },
];

export const DUMMY_CREATORS: Creator[] = [
  {
    uid: '1',
    displayName: 'PixelForge',
    avatarUrl: 'https://picsum.photos/seed/1/40/40',
    isSeller: true,
    stats: { totalSales: 56200, monthlySales: 4300, weeklySales: 950, reputation: 99 },
  },
  {
    uid: '2',
    displayName: 'ArtisanAI',
    avatarUrl: 'https://picsum.photos/seed/2/40/40',
    isSeller: true,
    stats: { totalSales: 78000, monthlySales: 5100, weeklySales: 1200, reputation: 98 },
  },
  {
    uid: '3',
    displayName: 'DreamWeaver',
    avatarUrl: 'https://picsum.photos/seed/3/40/40',
    isSeller: true,
    stats: { totalSales: 41500, monthlySales: 3200, weeklySales: 750, reputation: 97 },
  },
  {
    uid: '4',
    displayName: 'SynthSprite',
    avatarUrl: 'https://picsum.photos/seed/4/40/40',
    isSeller: true,
    stats: { totalSales: 25000, monthlySales: 2800, weeklySales: 600, reputation: 95 },
  },
    {
    uid: '5',
    displayName: 'GigaPrompt',
    avatarUrl: 'https://picsum.photos/seed/5/40/40',
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

// This is a helper to find placeholder images from the JSON file
// We are re-exporting it from here for convenience in components
import { PlaceHolderImages } from './placeholder-images';
export const placeholderImages = PlaceHolderImages;
