export interface Label {
  id: string;
  name: string;
  color: string;
  createdDate: string;
  lastUpdated: string;
  isActive: boolean;
  presentationCount: number;
}

export interface CreateLabelRequest {
  name: string;
  color: string;
}

export interface UpdateLabelRequest {
  name: string;
  color: string;
  isActive: boolean;
}

export interface LabelWithPresentations extends Label {
  presentations: PresentationSummary[];
}

export interface PresentationSummary {
  id: string;
  title: string;
  createdDate: string;
}

// Predefined color options for labels (pastel colors)
export const LABEL_COLORS = [
  '#FFB3BA', // Pastel Pink
  '#BAE1FF', // Pastel Blue
  '#BAFFC9', // Pastel Green
  '#FFFFBA', // Pastel Yellow
  '#FFB3F7', // Pastel Purple
  '#FFB366', // Pastel Orange
  '#B3F0FF', // Pastel Cyan
  '#FFB3D9', // Pastel Rose
  '#D4FFB3', // Pastel Lime
  '#E6B3FF', // Pastel Lavender
  '#B3FFE6', // Pastel Mint
  '#FFE6B3', // Pastel Peach
  '#B3D9FF', // Pastel Sky Blue
  '#FFD9B3', // Pastel Apricot
  '#E6FFB3', // Pastel Chartreuse
] as const;

// Mapping of hex colors to descriptive names
export const COLOR_NAMES: Record<string, string> = {
  '#FFB3BA': 'Pink',
  '#BAE1FF': 'Blue',
  '#BAFFC9': 'Green',
  '#FFFFBA': 'Yellow',
  '#FFB3F7': 'Purple',
  '#FFB366': 'Orange',
  '#B3F0FF': 'Cyan',
  '#FFB3D9': 'Rose',
  '#D4FFB3': 'Lime',
  '#E6B3FF': 'Lavender',
  '#B3FFE6': 'Mint',
  '#FFE6B3': 'Peach',
  '#B3D9FF': 'Sky Blue',
  '#FFD9B3': 'Apricot',
  '#E6FFB3': 'Chartreuse',
};

export type LabelColor = typeof LABEL_COLORS[number];
