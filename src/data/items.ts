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
export type ItemType = "consumable" | "material" | "weapon" | "armor" | "accessory";
export interface Item { id: string; name: string; icon: string; type: ItemType; description: string; price: number; value?: number; attack?: number; defense?: number; }
export const ITEMS: Item[] = [
  { id: "small-potion", name: "Bình Máu Nhỏ", icon: "🧪", type: "consumable", description: "Hồi 60 HP.", price: 25, value: 60 },
  { id: "mana-potion", name: "Bình Mana", icon: "🧴", type: "consumable", description: "Hồi 40 MP.", price: 20, value: 40 },
  { id: "jelly-gel", name: "Keo Slime", icon: "🟢", type: "material", description: "Nguyên liệu quái vật cấp thấp.", price: 8 },
  { id: "sweet-carrot", name: "Cà Rốt Đường", icon: "🥕", type: "material", description: "Đặc sản của Thỏ Kẹo Dẻo.", price: 10 },
  { id: "crystal-shard", name: "Mảnh Pha Lê", icon: "💎", type: "material", description: "Tinh thể năng lượng trong rừng.", price: 18 },
  { id: "wolf-fang", name: "Nanh Sói", icon: "🦷", type: "material", description: "Chiến lợi phẩm của Sói Pha Lê.", price: 22 },
  { id: "dark-crystal", name: "Tinh Thể Bóng Tối", icon: "🔮", type: "material", description: "Tinh thể hấp thụ ma lực u minh.", price: 30 },
  { id: "drake-scale", name: "Vảy Rồng U Minh", icon: "🐲", type: "material", description: "Vảy cứng của tiểu long.", price: 42 },
  { id: "wood-sword", name: "Kiếm Gỗ Kẹo", icon: "🗡️", type: "weapon", description: "+4 ATK.", price: 90, attack: 4 },
  { id: "crystal-vest", name: "Áo Giáp Pha Lê", icon: "🛡️", type: "armor", description: "+5 DEF.", price: 110, defense: 5 },
  { id: "lucky-charm", name: "Bùa May Mắn", icon: "🍀", type: "accessory", description: "+2 ATK, +2 DEF.", price: 130, attack: 2, defense: 2 }
];
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(item => [item.id, item])) as Record<string, Item>;
export const STARTER_INVENTORY: Record<string, number> = { "small-potion": 3, "mana-potion": 2 };
