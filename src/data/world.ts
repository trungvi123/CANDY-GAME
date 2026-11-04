export type ZoneId = "candy-village" | "crystal-forest" | "shadow-cave";
export interface Point { x: number; y: number }
export interface Zone { id: ZoneId; name: string; subtitle: string; level: number; icon: string; description: string; tint: string; }
export interface WorldNpc { id: string; name: string; icon: string; x: number; y: number; role: string; dialogue: string; }
export interface WorldMonster { id: string; name: string; icon: string; x: number; y: number; level: number; hp: number; attack: number; exp: number; gold: number; dropId: string; }
export const ZONES: Zone[] = [
  { id: "candy-village", name: "Làng Kẹo Khởi Nguyên", subtitle: "Khu an toàn · Cấp 1+", level: 1, icon: "🏡", description: "Ngôi làng yên bình nơi các nhà thám hiểm bắt đầu hành trình.", tint: "village" },
  { id: "crystal-forest", name: "Rừng Thạch Anh", subtitle: "Khu dã ngoại · Cấp 3+", level: 3, icon: "🌲", description: "Khu rừng pha lê lấp lánh, nơi slime và sói tinh linh sinh sống.", tint: "forest" },
  { id: "shadow-cave", name: "Hang Động Bóng Tối", subtitle: "Khu nguy hiểm · Cấp 5+", level: 5, icon: "🕳️", description: "Hang sâu chứa những sinh vật bị bóng tối tha hóa.", tint: "cave" }
];
export const NPCS: Record<ZoneId, WorldNpc[]> = {
  "candy-village": [
    { id: "elder", name: "Trưởng Làng Mật", icon: "🧙", x: 4, y: 4, role: "Giao nhiệm vụ", dialogue: "Chào nhà thám hiểm! Hãy giúp làng dọn sạch lũ Slime Kẹo quanh cổng phía đông." },
    { id: "merchant", name: "Thương Nhân Bơ", icon: "🧑‍🌾", x: 12, y: 4, role: "Cửa hàng", dialogue: "Ta có bình hồi phục và trang bị tốt cho chuyến phiêu lưu của bạn." }
  ],
  "crystal-forest": [
    { id: "ranger", name: "Tuần Lâm Pha Lê", icon: "🏹", x: 3, y: 3, role: "Giao nhiệm vụ", dialogue: "Rừng đang bị lũ Sói Pha Lê quấy phá. Hãy giúp chúng tôi!" }
  ],
  "shadow-cave": [
    { id: "sage", name: "Hiền Giả U Minh", icon: "🧙‍♀️", x: 3, y: 3, role: "Giao nhiệm vụ", dialogue: "Bóng tối đang lan rộng. Hãy đánh bại Hắc Slime để thu thập tinh thể." }
  ]
};
export const MONSTERS: Record<ZoneId, WorldMonster[]> = {
  "candy-village": [
    { id: "jelly", name: "Slime Kẹo", icon: "🟢", x: 8, y: 4, level: 1, hp: 85, attack: 7, exp: 28, gold: 12, dropId: "jelly-gel" },
    { id: "gum", name: "Thỏ Kẹo Dẻo", icon: "🐰", x: 14, y: 8, level: 2, hp: 110, attack: 9, exp: 36, gold: 16, dropId: "sweet-carrot" }
  ],
  "crystal-forest": [
    { id: "crystal-slime", name: "Slime Pha Lê", icon: "💎", x: 8, y: 5, level: 3, hp: 170, attack: 13, exp: 55, gold: 28, dropId: "crystal-shard" },
    { id: "crystal-wolf", name: "Sói Pha Lê", icon: "🐺", x: 14, y: 8, level: 4, hp: 220, attack: 17, exp: 72, gold: 36, dropId: "wolf-fang" }
  ],
  "shadow-cave": [
    { id: "dark-slime", name: "Hắc Slime", icon: "🟣", x: 8, y: 5, level: 5, hp: 290, attack: 21, exp: 95, gold: 48, dropId: "dark-crystal" },
    { id: "cave-drake", name: "Tiểu Long U Minh", icon: "🐉", x: 14, y: 8, level: 6, hp: 390, attack: 27, exp: 130, gold: 65, dropId: "drake-scale" }
  ]
};
export const WALLS: Record<ZoneId, Point[]> = {
  "candy-village": [{x:0,y:0},{x:1,y:0},{x:16,y:0},{x:17,y:0},{x:0,y:11},{x:17,y:11},{x:6,y:2},{x:6,y:3},{x:10,y:7},{x:10,y:8}],
  "crystal-forest": [{x:0,y:0},{x:1,y:0},{x:16,y:0},{x:17,y:0},{x:0,y:11},{x:17,y:11},{x:5,y:3},{x:5,y:4},{x:5,y:5},{x:11,y:2},{x:11,y:3},{x:11,y:4},{x:2,y:8},{x:3,y:8}],
  "shadow-cave": [{x:0,y:0},{x:1,y:0},{x:16,y:0},{x:17,y:0},{x:0,y:11},{x:17,y:11},{x:5,y:2},{x:5,y:3},{x:5,y:4},{x:12,y:6},{x:12,y:7},{x:12,y:8},{x:8,y:2},{x:9,y:2}]
};
