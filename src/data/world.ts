export interface WorldZone {
  id: string; name: string; region: string; level: number; description: string;
  monsters: string[]; recommendedPower: number; rewardGold: number;
}
export interface Monster {
  id: string; name: string; level: number; hp: number; attack: number; defense: number;
  exp: number; gold: number; element: "fire" | "water" | "lightning" | "wood" | "dark" | "light";
}
export interface Quest {
  id: string; title: string; description: string; target: string; required: number;
  exp: number; gold: number;
}
export const WORLD_ZONES: WorldZone[] = [
  { id: "starter-village", name: "Làng Kẹo Khởi Nguyên", region: "Đồng Bằng Kẹo Ngọt", level: 1, description: "Ngôi làng yên bình nơi các nhà mạo hiểm bắt đầu hành trình.", monsters: ["Slime Đường", "Bọ Cánh Cam"], recommendedPower: 20, rewardGold: 15 },
  { id: "crystal-forest", name: "Rừng Thạch Anh", region: "Rừng Phía Đông", level: 3, description: "Khu rừng phát sáng với những tinh thể nguyên tố và quái vật canh giữ.", monsters: ["Sóc Tinh Thể", "Ent Kẹo"], recommendedPower: 45, rewardGold: 35 },
  { id: "shadow-cave", name: "Hang Động Bóng Tối", region: "Dãy Núi U Minh", level: 5, description: "Mê cung dưới lòng đất, nơi Xà Yêu U Minh tích tụ sức mạnh.", monsters: ["Dơi U Minh", "Xà Yêu U Minh"], recommendedPower: 75, rewardGold: 60 },
  { id: "dragon-wastes", name: "Hoang Mạc Rồng Kẹo", region: "Miền Nam Cổ Đại", level: 8, description: "Vùng đất khắc nghiệt của những con rồng nguyên tố cổ xưa.", monsters: ["Rồng Hỏa Tâm", "Long Vương Đường"], recommendedPower: 120, rewardGold: 100 }
];
export const MONSTERS: Monster[] = [
  { id: "sugar-slime", name: "Slime Đường", level: 1, hp: 45, attack: 5, defense: 1, exp: 18, gold: 8, element: "water" },
  { id: "crystal-squirrel", name: "Sóc Tinh Thể", level: 3, hp: 90, attack: 11, defense: 4, exp: 35, gold: 16, element: "lightning" },
  { id: "shadow-bat", name: "Dơi U Minh", level: 5, hp: 145, attack: 17, defense: 7, exp: 58, gold: 27, element: "dark" },
  { id: "shadow-serpent", name: "Xà Yêu U Minh", level: 6, hp: 260, attack: 22, defense: 10, exp: 120, gold: 50, element: "fire" },
  { id: "candy-dragon", name: "Rồng Hỏa Tâm", level: 8, hp: 420, attack: 32, defense: 15, exp: 210, gold: 95, element: "fire" }
];
export const QUESTS: Quest[] = [
  { id: "first-hunt", title: "Nhiệm vụ đầu tiên", description: "Đánh bại 3 Slime Đường để bảo vệ dân làng.", target: "sugar-slime", required: 3, exp: 60, gold: 35 },
  { id: "crystal-patrol", title: "Tuần tra Rừng Thạch Anh", description: "Khám phá khu rừng và đánh bại 2 Sóc Tinh Thể.", target: "crystal-squirrel", required: 2, exp: 110, gold: 70 },
  { id: "shadow-threat", title: "Mối đe dọa U Minh", description: "Đánh bại Xà Yêu U Minh.", target: "shadow-serpent", required: 1, exp: 180, gold: 120 }
];