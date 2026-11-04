import { useCallback, useEffect, useMemo, useState } from "react";
import WorldMap from "./WorldMap";
import { ITEMS, ITEM_BY_ID, STARTER_INVENTORY } from "../data/items";
import { MONSTERS, NPCS, ZONES, type Point, type ZoneId, type WorldMonster } from "../data/world";
import type { ClassId } from "../data/classes";

type Quest = { id:string; title:string; description:string; target:string; required:number; rewardExp:number; rewardGold:number; accepted:boolean; claimed:boolean; progress:number; };
type SaveData = { level:number; exp:number; gold:number; hp:number; mp:number; zone:ZoneId; position:Point; inventory:Record<string,number>; equipped:Record<string,string>; quests:Quest[]; };
const QUESTS:Quest[]=[
 {id:"village-slimes",title:"Dọn sạch cổng làng",description:"Đánh bại 3 Slime Kẹo để bảo vệ dân làng.",target:"jelly",required:3,rewardExp:90,rewardGold:55,accepted:false,claimed:false,progress:0},
 {id:"forest-crystals",title:"Thu thập tinh thể",description:"Đánh bại 2 Slime Pha Lê trong rừng.",target:"crystal-slime",required:2,rewardExp:160,rewardGold:95,accepted:false,claimed:false,progress:0},
 {id:"darkness",title:"Ánh sáng trong hang sâu",description:"Đánh bại Hắc Slime đang canh giữ tinh thể.",target:"dark-slime",required:1,rewardExp:220,rewardGold:140,accepted:false,claimed:false,progress:0}
];
const SAVE_KEY="candy-game-phase2-save-v1";
const freshSave=():SaveData=>({level:1,exp:0,gold:80,hp:120,mp:40,zone:"candy-village",position:{x:2,y:6},inventory:{...STARTER_INVENTORY},equipped:{},quests:QUESTS.map(q=>({...q}))});
function readSave():SaveData{try{const raw=localStorage.getItem(SAVE_KEY);if(raw){const parsed=JSON.parse(raw) as Partial<SaveData>;return {...freshSave(),...parsed,inventory:{...STARTER_INVENTORY,...parsed.inventory},equipped:parsed.equipped??{},quests:parsed.quests??QUESTS.map(q=>({...q}))};}}catch{/* corrupted local save: start a fresh profile */}return freshSave();}
interface Props { classId:ClassId; heroName:string; }
export default function PhaseTwoExperience({classId,heroName}:Props){
 const [save,setSave]=useState<SaveData>(()=>readSave());
 const [activeMonster,setActiveMonster]=useState<WorldMonster|null>(null);
 const [enemyHp,setEnemyHp]=useState(0),[battleMessage,setBattleMessage]=useState("");
 const [dialogue,setDialogue]=useState<{name:string;text:string}|null>(null);
 const [tab,setTab]=useState<"quest"|"bag"|"shop">("quest");
 const [toast,setToast]=useState("");
 const zone=ZONES.find(z=>z.id===save.zone)!;
 const xpNeed=save.level*100;
 const monsters=MONSTERS[save.zone],npcs=NPCS[save.zone];
 const equipped=save.equipped;
 const bonus=useMemo(()=>Object.values(equipped).reduce((total,id)=>{const item=ITEM_BY_ID[id];return {attack:total.attack+(item?.attack??0),defense:total.defense+(item?.defense??0)};},{attack:0,defense:0}),[equipped]);
 const playerAttack=12+(save.level-1)*3+bonus.attack+(classId==="fireblade"?4:classId==="stormshadow"?5:0);
 const playerDefense=5+(save.level-1)+bonus.defense+(classId==="stoneguard"?4:classId==="frostmage"?2:0);
 const handlePositionChange=useCallback((position:Point)=>setSave(prev=>({...prev,position})),[]);
 useEffect(()=>{localStorage.setItem(SAVE_KEY,JSON.stringify(save));},[save]);
 const update=(patch:Partial<SaveData>)=>setSave(prev=>({...prev,...patch}));
 const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(""),2400);};
 const gainExp=(amount:number)=>setSave(prev=>{let level=prev.level,exp=prev.exp+amount,hp=prev.hp,mp=prev.mp;while(exp>=level*100){exp-=level*100;level++;hp+=18;mp=Math.min(100,mp+10);}return {...prev,level,exp,hp,mp};});
 const beginBattle=useCallback((id:string)=>{const monster=monsters.find(m=>m.id===id);if(!monster)return;if(save.level<monster.level){notify("Cần đạt cấp "+monster.level+" để đối đầu quái vật này.");return;}setActiveMonster(monster);setEnemyHp(monster.hp);setBattleMessage("Một "+monster.name+" xuất hiện!");},[monsters,save.level]);
 const finishBattle=(monster:WorldMonster)=>{setActiveMonster(null);setBattleMessage("Chiến thắng! Nhận "+monster.exp+" EXP và "+monster.gold+" vàng.");gainExp(monster.exp);setSave(prev=>{const inventory={...prev.inventory,[monster.dropId]:(prev.inventory[monster.dropId]??0)+1};const quests=prev.quests.map(q=>q.accepted&&!q.claimed&&q.target===monster.id?{...q,progress:Math.min(q.required,q.progress+1)}:q);return {...prev,gold:prev.gold+monster.gold,inventory,quests,hp:Math.max(1,prev.hp)};});};
 const attackMonster=()=>{if(!activeMonster)return;const dealt=playerAttack+Math.floor(Math.random()*7);const left=Math.max(0,enemyHp-dealt);setEnemyHp(left);if(left===0){finishBattle(activeMonster);return;}const damage=Math.max(1,activeMonster.attack-playerDefense);setSave(prev=>({...prev,hp:Math.max(0,prev.hp-damage)}));setBattleMessage("Bạn gây "+dealt+" sát thương. "+activeMonster.name+" phản công "+damage+" sát thương.");};
 const useRpgSkill=()=>{if(!activeMonster||save.mp<20)return;const skillName=classId==="frostmage"?"Băng Tinh Thuật":classId==="stormshadow"?"Lôi Quang Kích":classId==="stoneguard"?"Thạch Giáp":"Liệt Diệm Trảm";const dealt=playerAttack*2+12;const left=Math.max(0,enemyHp-dealt);setEnemyHp(left);setSave(prev=>({...prev,mp:prev.mp-20,hp:classId==="stoneguard"?Math.min(hpMax,prev.hp+15):prev.hp}));if(left===0){finishBattle(activeMonster);return;}const damage=Math.max(1,activeMonster.attack-playerDefense-(classId==="frostmage"?5:0));setSave(prev=>({...prev,hp:Math.max(0,prev.hp-damage)}));setBattleMessage(skillName+" gây "+dealt+" sát thương. Quái vật phản công "+damage+" sát thương.");};
 const usePotion=(id:string)=>{const item=ITEM_BY_ID[id];if(!item||!save.inventory[id])return;if(id==="small-potion"){if(save.hp>=120+Math.max(0,save.level-1)*18)return notify("HP đã đầy.");update({hp:Math.min(120+Math.max(0,save.level-1)*18,save.hp+(item.value??0)),inventory:{...save.inventory,[id]:save.inventory[id]-1}});}else if(id==="mana-potion"){update({mp:Math.min(100,save.mp+(item.value??0)),inventory:{...save.inventory,[id]:save.inventory[id]-1}});}notify("Đã sử dụng "+item.name+".");};
 const acceptQuest=(id:string)=>{setSave(prev=>({...prev,quests:prev.quests.map(q=>q.id===id?{...q,accepted:true}:q)}));notify("Đã nhận nhiệm vụ.");};
 const claimQuest=(q:Quest)=>{if(q.progress<q.required||q.claimed)return;setSave(prev=>({...prev,gold:prev.gold+q.rewardGold,quests:prev.quests.map(item=>item.id===q.id?{...item,claimed:true}:item)}));gainExp(q.rewardExp);notify("Hoàn thành nhiệm vụ: +"+q.rewardExp+" EXP, +"+q.rewardGold+" vàng.");};
 const buyItem=(id:string)=>{const item=ITEM_BY_ID[id];if(!item||save.gold<item.price)return notify("Không đủ vàng.");setSave(prev=>({...prev,gold:prev.gold-item.price,inventory:{...prev.inventory,[id]:(prev.inventory[id]??0)+1}}));notify("Đã mua "+item.name+".");};
 const equipItem=(id:string)=>{const item=ITEM_BY_ID[id];if(!item||item.type==="consumable"||item.type==="material")return;const slot=item.type;setSave(prev=>({...prev,equipped:{...prev.equipped,[slot]:id}}));notify("Đã trang bị "+item.name+".");};
 const changeZone=(id:ZoneId)=>{const target=ZONES.find(z=>z.id===id)!;if(save.level<target.level)return notify("Cần cấp "+target.level+" để vào khu vực này.");update({zone:id,position:{x:2,y:6}});};
 const handleNpc=useCallback((id:string)=>{const npc=npcs.find(n=>n.id===id);if(!npc)return;setDialogue({name:npc.name,text:npc.dialogue});if(npc.role==="Cửa hàng")setTab("shop");if(npc.role==="Giao nhiệm vụ")setTab("quest");},[npcs]);
 const handleMonster=useCallback((id:string)=>beginBattle(id),[beginBattle]);
 const completedCount=save.quests.filter(q=>q.claimed).length;
 const inventoryItems=useMemo(()=>Object.entries(save.inventory).filter(([,count])=>count>0),[save.inventory]);
 const hpMax=120+Math.max(0,save.level-1)*18;
 return <section className="phase-two">
  <div className="phase-title"><div><span className="eyebrow">GIAI ĐOẠN 2 · THẾ GIỚI MỞ 2D</span><h2>Hành Trình Kẹo Thần</h2><p>Khám phá vùng đất, gặp NPC, nhận nhiệm vụ và săn quái vật.</p></div><div className="wallet"><span>🪙 {save.gold} vàng</span><span>⭐ Cấp {save.level}</span></div></div>
  <div className="rpg-status"><div className="rpg-avatar">{classId==="frostmage"?"❄️":classId==="stormshadow"?"⚡":classId==="stoneguard"?"🛡️":"⚔️"}</div><div className="rpg-identity"><b>{heroName}</b><small>{classId.toUpperCase()} · CẤP {save.level}</small><div className="xp-track"><i style={{width:(save.exp/xpNeed*100)+"%"}}/></div><small>{save.exp}/{xpNeed} EXP đến cấp tiếp theo</small></div><div className="rpg-vitals"><span>HP <b>{save.hp}/{hpMax}</b></span><span className="rpg-bar"><i style={{width:Math.min(100,save.hp/hpMax*100)+"%"}}/></span><span>MP <b>{save.mp}/100</b></span><span className="rpg-bar mana"><i style={{width:save.mp+"%"}}/></span></div><div className="rpg-stats"><span>ATK <b>{playerAttack}</b></span><span>DEF <b>{playerDefense}</b></span></div></div>
  <div className="zone-tabs">{ZONES.map(z=><button key={z.id} className={save.zone===z.id?"selected":""} disabled={save.level<z.level} onClick={()=>changeZone(z.id)}><span>{z.icon}</span><b>{z.name}</b><small>{z.subtitle}</small></button>)}</div>
  <div className="rpg-layout"><div className="world-column"><div className="world-heading"><div><span className="eyebrow">KHU VỰC HIỆN TẠI</span><h3>{zone.icon} {zone.name}</h3><p>{zone.description}</p></div><span className="zone-level">ĐỀ XUẤT CẤP {zone.level}+</span></div><WorldMap key={save.zone} zoneId={save.zone} initialPosition={save.position} onPositionChange={handlePositionChange} onMonster={handleMonster} onNpc={handleNpc}/><div className="world-hint">Điều khiển: WASD / phím mũi tên hoặc nhấp vào ô đất để tự tìm đường. Chạm NPC/quái vật để tương tác.</div></div>
   <aside className="rpg-sidebar"><div className="rpg-panel-tabs"><button className={tab==="quest"?"active":""} onClick={()=>setTab("quest")}>📜 Nhiệm vụ</button><button className={tab==="bag"?"active":""} onClick={()=>setTab("bag")}>🎒 Túi đồ</button><button className={tab==="shop"?"active":""} onClick={()=>setTab("shop")}>🛒 Cửa hàng</button></div>
    {tab==="quest"&&<div className="rpg-panel-content"><h4>NHIỆM VỤ VÙNG ĐẤT</h4>{save.quests.map(q=><article className="quest-card" key={q.id}><b>{q.title}</b><p>{q.description}</p><small>{q.claimed?"ĐÃ HOÀN THÀNH":q.accepted?"TIẾN ĐỘ: "+q.progress+"/"+q.required:"CHƯA NHẬN"}</small>{q.accepted&&!q.claimed&&<div className="quest-progress"><i style={{width:(q.progress/q.required*100)+"%"}}/> </div>}{!q.accepted&&<button onClick={()=>acceptQuest(q.id)}>NHẬN NHIỆM VỤ</button>}{q.accepted&&!q.claimed&&q.progress>=q.required&&<button onClick={()=>claimQuest(q)}>NHẬN THƯỞNG · {q.rewardGold} VÀNG</button>}</article>)}<p className="panel-foot">Đã hoàn thành {completedCount}/{save.quests.length} nhiệm vụ</p></div>}
    {tab==="bag"&&<div className="rpg-panel-content"><h4>TÚI ĐỒ · {inventoryItems.length} LOẠI VẬT PHẨM</h4><div className="item-list">{inventoryItems.map(([id,count])=>{const item=ITEM_BY_ID[id];if(!item)return null;return <article className="item-row" key={id}><span className="item-icon">{item.icon}</span><div><b>{item.name}</b><small>{item.description}</small></div><strong>×{count}</strong>{item.type==="consumable"?<button onClick={()=>usePotion(id)}>DÙNG</button>:item.type!=="material"?<button onClick={()=>equipItem(id)}>{equipped[item.type]===id?"ĐANG MẶC":"MẶC"}</button>:null}</article>;})}</div><p className="panel-foot">Trang bị đang dùng: {Object.values(equipped).map(id=>ITEM_BY_ID[id]?.name).filter(Boolean).join(", ")||"Chưa có"}</p></div>}
    {tab==="shop"&&<div className="rpg-panel-content"><h4>QUẦY HÀNG THƯƠNG NHÂN</h4><div className="item-list">{ITEMS.map(item=><article className="item-row" key={item.id}><span className="item-icon">{item.icon}</span><div><b>{item.name}</b><small>{item.description}</small></div><strong>{item.price}🪙</strong><button disabled={save.gold<item.price} onClick={()=>buyItem(item.id)}>MUA</button></article>)}</div></div>}
   </aside>
  </div>
  {dialogue&&<div className="rpg-dialogue"><b>{dialogue.name}</b><p>{dialogue.text}</p><button onClick={()=>setDialogue(null)}>ĐÓNG</button></div>}
  {activeMonster&&<div className="battle-modal"><div className="battle-modal-card"><span className="eyebrow">GẶP QUÁI VẬT · CẤP {activeMonster.level}</span><div className="monster-big">{activeMonster.icon}</div><h3>{activeMonster.name}</h3><p>HP quái vật: {enemyHp}/{activeMonster.hp}</p><div className="enemy-hp-track"><i style={{width:(enemyHp/activeMonster.hp*100)+"%"}}/></div><p className="battle-message">{battleMessage}</p>{save.hp<=0?<><b>Bạn đã kiệt sức!</b><button onClick={()=>{setActiveMonster(null);update({hp:Math.ceil(hpMax*.6),zone:"candy-village",position:{x:2,y:6}});}}>HỒI SINH TẠI LÀNG</button></>:<div className="battle-actions"><button onClick={attackMonster}>⚔️ TẤN CÔNG</button><button disabled={save.mp<20} onClick={useRpgSkill}>✨ KỸ NĂNG · 20 MP</button><button disabled={!save.inventory["small-potion"]} onClick={()=>usePotion("small-potion")}>🧪 DÙNG BÌNH MÁU ({save.inventory["small-potion"]??0})</button><button className="retreat" onClick={()=>setActiveMonster(null)}>RÚT LUI</button></div>}</div></div>}
  {toast&&<div className="rpg-toast">{toast}</div>}
 </section>;
}
