import type { ClassId } from "../data/classes";
import { ITEMS, type GameItem } from "../data/items";
export interface PlayerProgress {
  name: string; classId: ClassId; level: number; exp: number; gold: number;
  hp: number; mp: number; inventory: string[]; equipment: Partial<Record<"weapon" | "armor" | "accessory", string>>;
  defeated: Record<string, number>; claimedQuests: string[];
}
export const SAVE_KEY = "candy-game-phase2-v1";
export const createInitialProgress = (classId: ClassId = "fireblade"): PlayerProgress => ({
  name: "Nhà Thám Hiểm", classId, level: 1, exp: 0, gold: 100, hp: 120, mp: 40,
  inventory: ["wooden-sword", "sugar-armor", "heart-candy"],
  equipment: { weapon: "wooden-sword", armor: "sugar-armor" }, defeated: {}, claimedQuests: []
});
export function loadProgress(): PlayerProgress {
  if (typeof window === "undefined") return createInitialProgress();
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialProgress();
    const parsed = JSON.parse(raw) as PlayerProgress;
    if (!parsed || typeof parsed.level !== "number" || !Array.isArray(parsed.inventory)) return createInitialProgress();
    return { ...createInitialProgress(parsed.classId), ...parsed };
  } catch { return createInitialProgress(); }
}
export function saveProgress(progress: PlayerProgress): void {
  try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch { /* Storage may be disabled or full. */ }
}
export function expToNextLevel(level: number): number { return level * 100; }
export function grantExp(progress: PlayerProgress, amount: number): PlayerProgress {
  let level = progress.level, exp = progress.exp + amount;
  while (exp >= expToNextLevel(level)) { exp -= expToNextLevel(level); level++; }
  return { ...progress, level, exp };
}
export function equippedStats(progress: PlayerProgress): { attack: number; defense: number } {
  return (["weapon", "armor", "accessory"] as const).reduce((total, slot) => {
    const item = ITEMS.find((candidate: GameItem) => candidate.id === progress.equipment[slot]);
    return { attack: total.attack + (item?.attack ?? 0), defense: total.defense + (item?.defense ?? 0) };
  }, { attack: 0, defense: 0 });
}