import Dexie, { type EntityTable } from "dexie";
import type { MixObservation, Paint, Recipe } from "../domain/types";

export const db = new Dexie("OleoPalette") as Dexie & {
  paints: EntityTable<Paint, "id">;
  recipes: EntityTable<Recipe, "id">;
  observations: EntityTable<MixObservation, "id">;
};

db.version(1).stores({
  paints: "id, name, brand, available",
  recipes: "id, createdAt",
});
db.version(2).stores({
  paints: "id, name, brand, available",
  recipes: "id, createdAt",
  observations: "id, createdAt",
});
