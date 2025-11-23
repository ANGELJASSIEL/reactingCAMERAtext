export interface InvisibleEntity {
  title: string;
  description: string;
  visualStyle: string;
  meaning: string;
  estimatedAge: string;
  rarity: 'Común' | 'Raro' | 'Legendario' | 'Artefacto';
}

export type AppMode = 'intro' | 'scanner' | 'gallery';

export interface ScanResult {
  image: string; // Base64
  entity: InvisibleEntity | null;
  timestamp: number;
}