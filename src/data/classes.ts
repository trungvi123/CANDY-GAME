export type ClassId = "fireblade" | "frostmage" | "stormshadow" | "stoneguard";

export interface HeroClass {
  id: ClassId;
  name: string;
  role: string;
  icon: string;
  color: string;
  hp: number;
  attack: number;
  defense: number;
  skillName: string;
  skillDescription: string;
}

export const HERO_CLASSES: HeroClass[] = [
  { id: "fireblade", name: "Hỏa Kiếm", role: "Công kích", icon: "⚔", color: "#ff765f", hp: 120, attack: 18, defense: 7, skillName: "Liệt Diệm Trảm", skillDescription: "Gây sát thương lớn lên quái vật." },
  { id: "frostmage", name: "Băng Pháp", role: "Khống chế", icon: "❄", color: "#72d9ff", hp: 112, attack: 16, defense: 9, skillName: "Băng Tinh Thuật", skillDescription: "Gây sát thương và làm suy yếu đòn đánh kế tiếp." },
  { id: "stormshadow", name: "Lôi Ảnh", role: "Chí mạng", icon: "ϟ", color: "#ffd45f", hp: 108, attack: 20, defense: 6, skillName: "Lôi Quang Kích", skillDescription: "Đòn đánh mạnh, có cơ hội chí mạng." },
  { id: "stoneguard", name: "Thạch Vệ", role: "Phòng thủ", icon: "⬟", color: "#8de0a5", hp: 140, attack: 14, defense: 12, skillName: "Thạch Giáp", skillDescription: "Gây sát thương nhẹ và hồi phục." }
];