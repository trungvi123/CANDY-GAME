export type ItemSlot = "weapon" | "armor" | "accessory" | "consumable";
export interface GameItem {
  id: string; name: string; slot: ItemSlot; rarity: "common" | "rare" | "epic";
  description: string; price: number; attack?: number; defense?: number; heal?: number;
}
export const ITEMS: GameItem[] = [
  { id: "wooden-sword", name: "Kiếm Gỗ Đường", slot: "weapon", rarity: "common", description: "Thanh kiếm dành cho tân thủ.", price: 45, attack: 3 },
  { id: "crystal-blade", name: "Kiếm Thạch Anh", slot: "weapon", rarity: "rare", description: "Lưỡi kiếm cộng hưởng nguyên tố.", price: 140, attack: 8 },
  { id: "sugar-armor", name: "Giáp Đường Cứng", slot: "armor", rarity: "common", description: "Bộ giáp nhẹ từ đường kết tinh.", price: 55, defense: 3 },
  { id: "guardian-plate", name: "Giáp Hộ Vệ", slot: "armor", rarity: "rare", description: "Giáp chắc chắn của vệ binh cổ.", price: 160, defense: 8 },
  { id: "heart-candy", name: "Kẹo Hồi Phục", slot: "consumable", rarity: "common", description: "Hồi 35 HP khi sử dụng.", price: 20, heal: 35 },
  { id: "lucky-charm", name: "Bùa May Mắn", slot: "accessory", rarity: "epic", description: "Bùa hộ mệnh tăng sức mạnh.", price: 220, attack: 4, defense: 2 }
];