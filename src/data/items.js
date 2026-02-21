// Items for Stage 3 (shop) and Stage 4 (lab)
export const microorganisms = [
  {
    id: 'nitrosomonas',
    name: 'Bakteri Nitrosomonas',
    price: 500,
    description: 'Mengoksidasi amonia menjadi nitrit. Penting untuk siklus nitrogen.',
    icon: '🦠',
    color: 0x22c55e
  },
  {
    id: 'nitrobacter',
    name: 'Bakteri Nitrobacter',
    price: 400,
    description: 'Mengoksidasi nitrit menjadi nitrat. Melengkapi siklus nitrogen.',
    icon: '🧫',
    color: 0x3b82f6
  },
  {
    id: 'aspergillus',
    name: 'Jamur Aspergillus niger',
    price: 300,
    description: 'Menguraikan senyawa organik kompleks. Menurunkan COD dan BOD.',
    icon: '🍄',
    color: 0xa855f7
  }
];

export const labTools = [
  { id: 'beaker', name: 'Beaker Glass', icon: '🧪', description: '500 mL - Untuk menampung sampel' },
  { id: 'erlenmeyer', name: 'Erlenmeyer Flask', icon: '⚗️', description: '250 mL - Untuk titrasi' },
  { id: 'ph_meter', name: 'pH Meter', icon: '📊', description: 'Digital - Mengukur tingkat keasaman' },
  { id: 'do_meter', name: 'DO Meter', icon: '💧', description: 'Mengukur oksigen terlarut' },
  { id: 'spectro', name: 'Spektrofotometer', icon: '🔬', description: 'Mengukur COD dan BOD' },
  { id: 'aerator', name: 'Pompa Aerator', icon: '💨', description: 'Aerasi larutan' },
  { id: 'tank', name: 'Tangki Pencampur', icon: '🪣', description: '10 L - Reaktor biologis' }
];

export const labMaterials = [
  { id: 'vinasse', name: 'Limbah Vinasse', icon: '🟤', description: '1 Liter - Sampel limbah' },
  { id: 'starter', name: 'Bakteri Starter', icon: '🦠', description: '100 mL - Kultur campuran' },
  { id: 'nutrients', name: 'Nutrisi (N, P, K)', icon: '🌿', description: '50 mL - Suplemen pertumbuhan' },
  { id: 'water', name: 'Air Destilasi', icon: '💧', description: '500 mL - Pelarut steril' }
];

export const requiredTools = ['beaker', 'ph_meter', 'spectro', 'aerator', 'tank'];
export const requiredMaterials = ['vinasse', 'starter', 'nutrients'];
