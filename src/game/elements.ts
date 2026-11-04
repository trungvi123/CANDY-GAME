export type ElementId = "fire" | "water" | "lightning" | "wood" | "dark" | "light";

export interface ElementInfo {
  id: ElementId;
  name: string;
  symbol: string;
  color: number;
  css: string;
  description: string;
}

export const ELEMENTS: ElementInfo[] = [
  { id: "fire", name: "Hỏa", symbol: "✦", color: 0xff654f, css: "#ff654f", description: "Gây sát thương" },
  { id: "water", name: "Thủy", symbol: "◆", color: 0x45c9ff, css: "#45c9ff", description: "Hồi phục" },
  { id: "lightning", name: "Lôi", symbol: "ϟ", color: 0xffd34e, css: "#ffd34e", description: "Tăng chí mạng" },
  { id: "wood", name: "Mộc", symbol: "❋", color: 0x66d68b, css: "#66d68b", description: "Hồi năng lượng" },
  { id: "dark", name: "Ám", symbol: "✧", color: 0xb18aff, css: "#b18aff", description: "Xuyên giáp" },
  { id: "light", name: "Quang", symbol: "✺", color: 0xfff0a6, css: "#fff0a6", description: "Tạo khiên" }
];

export const ELEMENT_BY_ID = Object.fromEntries(ELEMENTS.map(e => [e.id, e])) as Record<ElementId, ElementInfo>;

export function randomElement(): ElementId {
  return ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)].id;
}