import { useCallback, useEffect, useMemo, useState } from "react";
import { MONSTERS, NPCS, WALLS, type Point, type ZoneId } from "../data/world";
interface Props { zoneId: ZoneId; initialPosition: Point; onPositionChange: (point: Point) => void; onMonster: (id: string) => void; onNpc: (id: string) => void; }
const COLS=18, ROWS=12;
const keyOf=(p:Point)=>p.y*COLS+p.x;
const fromKey=(k:number):Point=>({x:k%COLS,y:Math.floor(k/COLS)});
const directions=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
function findPath(start:Point,end:Point,blocked:Set<number>):Point[]{
 const queue=[keyOf(start)], previous=new Map<number,number>(), seen=new Set(queue);
 while(queue.length){const current=queue.shift()!;if(current===keyOf(end))break;const p=fromKey(current);
  for(const d of directions){const n={x:p.x+d.x,y:p.y+d.y},k=keyOf(n);if(n.x<0||n.x>=COLS||n.y<0||n.y>=ROWS||blocked.has(k)||seen.has(k))continue;seen.add(k);previous.set(k,current);queue.push(k);}
 }
 const target=keyOf(end);if(!seen.has(target))return[];const path:Point[]=[];let cursor=target;
 while(cursor!==keyOf(start)){path.unshift(fromKey(cursor));cursor=previous.get(cursor)!;}return path;
}
export default function WorldMap({zoneId,initialPosition,onPositionChange,onMonster,onNpc}:Props){
 const [position,setPosition]=useState(initialPosition),[path,setPath]=useState<Point[]>([]),[notice,setNotice]=useState("WASD / phím mũi tên để di chuyển · Click bản đồ để đi đến vị trí");
 const walls=WALLS[zoneId],npcs=NPCS[zoneId],monsters=MONSTERS[zoneId];
 const blocked=useMemo(()=>new Set([...walls.map(keyOf),...npcs.map(keyOf),...monsters.map(keyOf)]),[walls,npcs,monsters]);
 useEffect(()=>{setPosition(initialPosition);setPath([]);},[zoneId,initialPosition.x,initialPosition.y]);
 useEffect(()=>{if(!path.length)return;const timer=window.setTimeout(()=>{const [next,...rest]=path;setPosition(next);onPositionChange(next);setPath(rest);},110);return()=>window.clearTimeout(timer);},[path,onPositionChange]);
 const moveTo=useCallback((target:Point)=>{if(target.x<0||target.x>=COLS||target.y<0||target.y>=ROWS)return;setPath(findPath(position,target,blocked));},[position,blocked]);
 const step=useCallback((dx:number,dy:number)=>{const next={x:position.x+dx,y:position.y+dy};if(next.x<0||next.x>=COLS||next.y<0||next.y>=ROWS)return;if(walls.some(p=>p.x===next.x&&p.y===next.y))return;
  const npc=npcs.find(p=>p.x===next.x&&p.y===next.y),monster=monsters.find(p=>p.x===next.x&&p.y===next.y);
  if(npc){onNpc(npc.id);setNotice(npc.dialogue);return;}if(monster){onMonster(monster.id);setNotice("Đối đầu "+monster.name+"!");return;}
  setPath([]);setPosition(next);onPositionChange(next);
 },[position,walls,npcs,monsters,onNpc,onMonster,onPositionChange]);
 useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(["INPUT","TEXTAREA","SELECT"].includes((event.target as HTMLElement)?.tagName))return;const keys:Record<string,[number,number]>={w:[0,-1],ArrowUp:[0,-1],s:[0,1],ArrowDown:[0,1],a:[-1,0],ArrowLeft:[-1,0],d:[1,0],ArrowRight:[1,0]};const dir=keys[event.key];if(!dir)return;event.preventDefault();setPath([]);step(dir[0],dir[1]);};window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler);},[step]);
 const cells=Array.from({length:COLS*ROWS},(_,i)=>fromKey(i));
 return <div className={"world-map world-"+zoneId}>
  <div className="world-map-top"><span>🧭 Tọa độ {position.x+1}, {position.y+1}</span><span>{path.length?"ĐANG DI CHUYỂN…":"ĐANG KHÁM PHÁ"}</span></div>
  <div className="world-grid" style={{gridTemplateColumns:"repeat("+COLS+",minmax(0,1fr))"}}>
   {cells.map(p=>{const wall=walls.some(v=>v.x===p.x&&v.y===p.y),npc=npcs.find(v=>v.x===p.x&&v.y===p.y),monster=monsters.find(v=>v.x===p.x&&v.y===p.y),player=position.x===p.x&&position.y===p.y;
    return <button key={keyOf(p)} className={"world-tile "+(wall?"wall ":"")+(player?"player-tile ":"")+(path.some(v=>v.x===p.x&&v.y===p.y)?"path-tile":"")} onClick={()=>npc?onNpc(npc.id):monster?onMonster(monster.id):moveTo(p)} title={npc?.name||monster?.name||("Đi đến "+(p.x+1)+", "+(p.y+1))}>{wall?"🌳":npc?npc.icon:monster?monster.icon:player?"🧙":""}</button>;
   })}
  </div>
  <div className="world-map-bottom"><span>🧙 Nhân vật</span><span>🧑 NPC</span><span>👾 Quái vật</span><span>🌳 Chướng ngại</span></div>
  <p className="world-notice">{notice}</p>
  <div className="mobile-pad"><button onClick={()=>step(0,-1)}>▲</button><div><button onClick={()=>step(-1,0)}>◀</button><button onClick={()=>step(0,1)}>▼</button><button onClick={()=>step(1,0)}>▶</button></div></div>
 </div>;
}
