import { useEffect, useMemo, useState } from "react";
import { HERO_CLASSES } from "../data/classes";
import { ITEMS, type GameItem } from "../data/items";
import { MONSTERS, QUESTS, WORLD_ZONES } from "../data/world";
import { createInitialProgress, equippedStats, expToNextLevel, grantExp, loadProgress, saveProgress, type PlayerProgress } from "../systems/playerProgress";

type Tab = "world" | "character" | "inventory" | "quests" | "shop";
export default function WorldHub() {
  const [player, setPlayer] = useState<PlayerProgress>(() => loadProgress());
  const [tab, setTab] = useState<Tab>("world");
  const [zoneId, setZoneId] = useState(WORLD_ZONES[0].id);
  const [notice, setNotice] = useState("Tiến trình được lưu tự động trên thiết bị này.");
  const zone = WORLD_ZONES.find(item => item.id === zoneId)!;
  const heroClass = HERO_CLASSES.find(item => item.id === player.classId)!;
  const stats = useMemo(() => equippedStats(player), [player]);
  useEffect(() => saveProgress(player), [player]);
  const patch = (next: PlayerProgress) => setPlayer(next);
  const defeatMonster = (monsterId: string) => {
    const monster = MONSTERS.find(item => item.id === monsterId);
    if (!monster || monster.level > player.level + 2) return;
    const defeated = { ...player.defeated, [monsterId]: (player.defeated[monsterId] ?? 0) + 1 };
    patch({ ...grantExp({ ...player, defeated }, monster.exp), gold: player.gold + monster.gold });
    setNotice(`Đã đánh bại ${monster.name}: +${monster.exp} EXP, +${monster.gold} vàng.`);
  };
  const buy = (item: GameItem) => {
    if (player.gold < item.price) { setNotice("Không đủ vàng để mua vật phẩm."); return; }
    if (player.inventory.includes(item.id)) { setNotice("Bạn đã sở hữu vật phẩm này."); return; }
    patch({ ...player, gold: player.gold - item.price, inventory: [...player.inventory, item.id] });
    setNotice(`Đã mua ${item.name}.`);
  };
  const equip = (item: GameItem) => {
    if (!player.inventory.includes(item.id) || item.slot === "consumable") return;
    patch({ ...player, equipment: { ...player.equipment, [item.slot]: item.id } });
    setNotice(`Đã trang bị ${item.name}.`);
  };
  const useItem = (item: GameItem) => {
    if (!item.heal || player.hp >= heroClass.hp) return;
    patch({ ...player, hp: Math.min(heroClass.hp, player.hp + item.heal), inventory: player.inventory.filter((id, index) => id !== item.id || player.inventory.indexOf(id) !== index) });
    setNotice(`Đã sử dụng ${item.name}, hồi ${item.heal} HP.`);
  };
  const claimQuest = (questId: string) => {
    const quest = QUESTS.find(item => item.id === questId);
    if (!quest || player.claimedQuests.includes(questId) || (player.defeated[quest.target] ?? 0) < quest.required) return;
    patch({ ...grantExp({ ...player, claimedQuests: [...player.claimedQuests, questId] }, quest.exp), gold: player.gold + quest.gold });
    setNotice(`Hoàn thành nhiệm vụ ${quest.title}: +${quest.exp} EXP, +${quest.gold} vàng.`);
  };
  const reset = () => { if (window.confirm("Xóa tiến trình Giai đoạn 2 trên thiết bị này?")) { patch(createInitialProgress(player.classId)); setNotice("Đã tạo lại tiến trình mới."); } };
  return <section className="world-hub">
    <div className="world-hub-head"><div><span className="eyebrow">GIAI ĐOẠN 2 · THẾ GIỚI MMORPG</span><h2>Thế Giới Kẹo Thần</h2><p>Khám phá vùng đất, săn quái, nhận nhiệm vụ và phát triển nhân vật.</p></div><div className="world-wallet"><b>Lv. {player.level}</b><span>✦ {player.gold} vàng</span></div></div>
    <nav className="world-tabs" aria-label="Khu vực game">{([["world","Thế giới"],["character","Nhân vật"],["inventory","Túi đồ"],["quests","Nhiệm vụ"],["shop","Cửa hàng"]] as [Tab,string][]).map(([id,label]) => <button key={id} className={tab===id?"selected":""} onClick={()=>setTab(id)}>{label}</button>)}</nav>
    <div className="world-content">
      {tab==="world" && <div className="world-grid"><div className="zone-list"><h3>Bản đồ thế giới</h3>{WORLD_ZONES.map(item=><button key={item.id} className={zoneId===item.id?"zone-card selected": "zone-card"} disabled={player.level<item.level} onClick={()=>setZoneId(item.id)}><span>Lv.{item.level}+</span><b>{item.name}</b><small>{item.region}</small></button>)}</div><div className="zone-detail"><span className="eyebrow">{zone.region}</span><h3>{zone.name}</h3><p>{zone.description}</p><div className="zone-requirement">Cấp đề xuất: {zone.level} · Sức mạnh đề xuất: {zone.recommendedPower}</div><h4>Quái vật trong khu vực</h4><div className="monster-list">{MONSTERS.filter(m=>zone.monsters.includes(m.name)).map(monster=><article className="monster-card" key={monster.id}><div><b>{monster.name}</b><small>Lv.{monster.level} · HP {monster.hp} · EXP {monster.exp} · {monster.gold} vàng</small></div><button disabled={monster.level>player.level+2} onClick={()=>defeatMonster(monster.id)}>Chiến đấu</button></article>)}</div></div></div>}
      {tab==="character" && <div className="character-sheet"><div className="character-emblem">{heroClass.icon}</div><div className="character-info"><span className="eyebrow">NHÂN VẬT · {heroClass.role}</span><h3>{player.name}</h3><p>{heroClass.name} · Cấp {player.level}</p><div className="exp-track"><i style={{width:`${player.exp/expToNextLevel(player.level)*100}%`}}/></div><small>{player.exp}/{expToNextLevel(player.level)} EXP tới cấp tiếp theo</small><div className="character-stats"><span>HP <b>{player.hp}/{heroClass.hp}</b></span><span>MP <b>{player.mp}/100</b></span><span>ATK <b>{heroClass.attack+stats.attack}</b></span><span>DEF <b>{heroClass.defense+stats.defense}</b></span></div></div></div>}
      {tab==="inventory" && <div><h3>Túi đồ · {player.inventory.length} vật phẩm</h3><div className="item-grid">{player.inventory.map((id,index)=>{const item=ITEMS.find(value=>value.id===id);return item?<article className="item-card" key={`${id}-${index}`}><span className={`rarity ${item.rarity}`}>{item.rarity}</span><b>{item.name}</b><small>{item.description}</small>{item.slot==="consumable"?<button onClick={()=>useItem(item)} disabled={player.hp>=heroClass.hp}>Sử dụng</button>:<button onClick={()=>equip(item)}>{player.equipment[item.slot]===item.id?"Đang trang bị":"Trang bị"}</button>}</article>:null;})}</div></div>}
      {tab==="quests" && <div><h3>Nhiệm vụ</h3><div className="quest-list">{QUESTS.map(quest=>{const count=player.defeated[quest.target]??0;const done=count>=quest.required;const claimed=player.claimedQuests.includes(quest.id);return <article className="quest-card" key={quest.id}><div><b>{quest.title}</b><p>{quest.description}</p><small>Tiến độ: {Math.min(count,quest.required)}/{quest.required} · Thưởng {quest.exp} EXP, {quest.gold} vàng</small></div><button disabled={!done||claimed} onClick={()=>claimQuest(quest.id)}>{claimed?"Đã nhận":done?"Nhận thưởng":"Chưa hoàn thành"}</button></article>;})}</div></div>}
      {tab==="shop" && <div><h3>Cửa hàng vật phẩm</h3><div className="item-grid">{ITEMS.map(item=><article className="item-card" key={item.id}><span className={`rarity ${item.rarity}`}>{item.rarity}</span><b>{item.name}</b><small>{item.description}</small><strong>✦ {item.price} vàng</strong><button disabled={player.inventory.includes(item.id)} onClick={()=>buy(item)}>{player.inventory.includes(item.id)?"Đã sở hữu":"Mua vật phẩm"}</button></article>)}</div></div>}
    </div><div className="world-notice" role="status">{notice}<button onClick={reset}>Đặt lại tiến trình</button></div>
  </section>;
}