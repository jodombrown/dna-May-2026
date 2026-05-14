export const BANNER_GRADIENTS = {
  // DNA Brand (Default)
  dna: {
    name: 'DNA Brand',
    css: 'linear-gradient(135deg, hsl(151, 75%, 50%) 0%, hsl(151, 75%, 30%) 100%)',
    tailwind: 'bg-gradient-to-br from-[hsl(151,75%,50%)] to-[hsl(151,75%,30%)]',
    category: 'brand'
  },
  
  // African Cultural Themes
  kente: {
    name: 'Kente Gold',
    css: 'linear-gradient(135deg, hsl(45, 90%, 50%) 0%, hsl(25, 85%, 45%) 50%, hsl(15, 80%, 35%) 100%)',
    tailwind: 'bg-gradient-to-br from-yellow-500 via-orange-600 to-red-700',
    category: 'african'
  },
  maasai: {
    name: 'Maasai Red',
    css: 'linear-gradient(135deg, hsl(0, 75%, 45%) 0%, hsl(350, 80%, 35%) 100%)',
    tailwind: 'bg-gradient-to-br from-red-600 to-red-800',
    category: 'african'
  },
  sahara: {
    name: 'Sahara Sands',
    css: 'linear-gradient(180deg, hsl(35, 60%, 70%) 0%, hsl(25, 70%, 50%) 50%, hsl(15, 65%, 40%) 100%)',
    tailwind: 'bg-gradient-to-b from-amber-200 via-orange-400 to-amber-700',
    category: 'african'
  },
  nile: {
    name: 'Nile Waters',
    css: 'linear-gradient(135deg, hsl(190, 70%, 50%) 0%, hsl(210, 60%, 40%) 100%)',
    tailwind: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    category: 'african'
  },
  savanna: {
    name: 'Savanna Sunset',
    css: 'linear-gradient(180deg, hsl(25, 90%, 55%) 0%, hsl(45, 85%, 50%) 40%, hsl(200, 40%, 30%) 100%)',
    tailwind: 'bg-gradient-to-b from-orange-500 via-yellow-500 to-neutral-700',
    category: 'african'
  },
  baobab: {
    name: 'Baobab Dusk',
    css: 'linear-gradient(135deg, hsl(280, 40%, 35%) 0%, hsl(25, 70%, 45%) 100%)',
    tailwind: 'bg-gradient-to-br from-copper-800 to-orange-600',
    category: 'african'
  },
  kilimanjaro: {
    name: 'Kilimanjaro',
    css: 'linear-gradient(180deg, hsl(200, 30%, 85%) 0%, hsl(200, 50%, 60%) 40%, hsl(151, 50%, 35%) 100%)',
    tailwind: 'bg-gradient-to-b from-neutral-200 via-sky-400 to-emerald-700',
    category: 'african'
  },
  
  // Original gradients
  cultural: {
    name: 'Cultural Warmth',
    css: 'linear-gradient(135deg, hsl(18, 60%, 55%) 0%, hsl(38, 70%, 60%) 100%)',
    tailwind: 'bg-gradient-to-br from-[hsl(18,60%,55%)] to-[hsl(38,70%,60%)]',
    category: 'classic'
  },
  sunset: {
    name: 'Afro-Futuristic',
    css: 'linear-gradient(135deg, hsl(25, 85%, 60%) 0%, hsl(270, 60%, 55%) 100%)',
    tailwind: 'bg-gradient-to-br from-[hsl(25,85%,60%)] to-[hsl(270,60%,55%)]',
    category: 'classic'
  },
  ocean: {
    name: 'Professional Ocean',
    css: 'linear-gradient(135deg, hsl(200, 80%, 50%) 0%, hsl(220, 70%, 40%) 100%)',
    tailwind: 'bg-gradient-to-br from-blue-400 to-blue-700',
    category: 'classic'
  },
  earth: {
    name: 'Earth Tones',
    css: 'linear-gradient(180deg, hsl(18, 60%, 35%) 0%, hsl(151, 75%, 30%) 100%)',
    tailwind: 'bg-gradient-to-b from-[hsl(18,60%,35%)] to-[hsl(151,75%,30%)]',
    category: 'classic'
  },
  night: {
    name: 'Night Sky',
    css: 'linear-gradient(135deg, hsl(230, 30%, 20%) 0%, hsl(250, 40%, 15%) 100%)',
    tailwind: 'bg-gradient-to-br from-neutral-700 to-neutral-900',
    category: 'classic'
  },
  gold: {
    name: 'Golden Hour',
    css: 'linear-gradient(135deg, hsl(38, 70%, 50%) 0%, hsl(45, 85%, 60%) 100%)',
    tailwind: 'bg-gradient-to-br from-yellow-600 to-yellow-400',
    category: 'classic'
  },
  ruby: {
    name: 'Ruby Passion',
    css: 'linear-gradient(135deg, hsl(350, 70%, 45%) 0%, hsl(25, 85%, 55%) 100%)',
    tailwind: 'bg-gradient-to-br from-red-600 to-[hsl(25,85%,55%)]',
    category: 'classic'
  },
};

export type BannerGradientKey = keyof typeof BANNER_GRADIENTS;
export const DEFAULT_GRADIENT: BannerGradientKey = 'dna';
