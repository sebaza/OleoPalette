export interface Paint {
  id: string;
  name: string;
  brand?: string;
  pigmentCode?: string;
  hex: string;
  available: boolean;
  notes?: string;
  densityGPerMl?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  paint: Pick<Paint, "id" | "name" | "brand" | "hex" | "densityGPerMl">;
  fraction: number;
}

export interface Recipe {
  id: string;
  targetHex: string;
  estimatedHex: string;
  model: "digital-heuristic";
  ingredients: Ingredient[];
  deltaE: number;
  createdAt: string;
}

export interface MixObservation {
  id: string;
  recipe: Recipe;
  observedHex: string;
  lighting?: string;
  paintState?: "wet" | "dry" | "unknown";
  notes?: string;
  createdAt: string;
}
