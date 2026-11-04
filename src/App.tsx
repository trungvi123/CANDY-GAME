import { useCallback, useMemo, useState } from "react";
import GameBoard from "./components/GameBoard";
import { ELEMENTS, type ElementId } from "./game/elements";
import type { TurnPayload } from "./game/BoardScene";
import { HERO_CLASSES, type ClassId } from "./data/classes";
import WorldHub from "./components/WorldHub";

type LogEntry = { id: number; text: string; tone?: string };

const INITIAL_ENEMY_HP = 260;

export default function App() {
  const [classId, setClassId] = useState<ClassId>("fireblade");
  const hero = useMemo(() => HERO_CLASSES.find(c => c.id === classId)!, [classId]);
  const [heroHp, setHeroHp] = useState(hero.hp);
  const [enemyHp, setEnemyHp] = useState(INITIAL_ENEMY_HP);
  const [heroMp, setHeroMp] = useState(40);
  const [shield, setShield] = useState(0);
  const [turn, setTurn] = useState(1);
  const [busy, setBusy] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [turnSignal, setTurnSignal] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([{ id: 1, text: "Trận chiến bắt đầu! Hãy ghép ngọc để tấn công.", tone: "gold" }]);
  const [nextId, setNextId] = useState(2);
  const [weakened, setWeakened] = useState(false);

  const addLog = useCallback((text: string, tone?: string) => {
    setLog(prev => [{ id: nextId, text, tone }, ...prev].slice(0, 7));
    setNextId(v => v + 1);
  }, [nextId]);

  const endPlayerAction = useCallback((damage: number, message: string) => {
    setEnemyHp(hp => Math.max(0, hp - damage));
    addLog(message, "good");
    setBusy(true);
    window.setTimeout(() => {
      setEnemyHp(currentEnemy => {
        if (currentEnemy > 0) {
          setHeroHp(currentHp => {
            const rawBase = Math.max(4, 15 - hero.defense);
            const raw = weakened ? Math.ceil(rawBase / 2) : rawBase;
            const absorbed = Math.min(shield, raw);
            setShield(s => Math.max(0, s - absorbed));
            const hit = Math.max(0, raw - absorbed);
            addLog(`Quái vật phản công, gây ${hit} sát thương${absorbed ? ` (khiên chặn ${absorbed})` : ""}.`, "bad");
            return Math.max(0, currentHp - hit);
          });
        }
        setWeakened(false);
        setTurn(t => t + 1);
        setBusy(false);
        setTurnSignal(v => v + 1);
        return currentEnemy;
      });
    }, 650);
  }, [addLog, hero.defense, shield, weakened]);

  const handleTurn = useCallback((result: TurnPayload) => {
    if (busy) return;
    const c = result.counts;
    const fireDamage = c.fire * (hero.attack + 2);
    const darkDamage = c.dark * Math.round(hero.attack * 0.65);
    const lightningBonus = c.lightning * 3;
    const waterHeal = c.water * 4;
    const woodMp = c.wood * 5;
    const lightShield = c.light * 4;
    const comboBonus = Math.max(0, result.cascades - 1) * 8;
    const damage = fireDamage + darkDamage + lightningBonus + comboBonus;
    setHeroHp(hp => Math.min(hero.hp, hp + waterHeal));
    setHeroMp(mp => Math.min(100, mp + woodMp));
    setShield(s => Math.min(40, s + lightShield));
    const parts = [
      damage ? `gây ${damage} sát thương` : "không gây sát thương trực tiếp",
      waterHeal ? `hồi ${waterHeal} HP` : "",
      woodMp ? `hồi ${woodMp} MP` : "",
      lightShield ? `nhận ${lightShield} khiên` : "",
      c.lightning ? `Lôi +${lightningBonus} sát thương` : "",
      result.cascades > 1 ? `combo ${result.cascades} tầng (+${comboBonus})` : ""
    ].filter(Boolean).join(", ");
    endPlayerAction(damage, `Ghép ${result.totalMatched} ngọc: ${parts}.`);
  }, [busy, endPlayerAction, hero.attack, hero.hp]);

  const useSkill = () => {
    if (busy || heroHp <= 0 || enemyHp <= 0 || heroMp < 30) return;
    setHeroMp(mp => mp - 30);
    if (classId === "stoneguard") {
      setShield(s => Math.min(50, s + 18));
      setHeroHp(hp => Math.min(hero.hp, hp + 12));
      endPlayerAction(12, `${hero.skillName}: gây 12 sát thương, hồi 12 HP và tạo 18 khiên.`);
    } else if (classId === "frostmage") {
      setWeakened(true);
      endPlayerAction(30, `${hero.skillName}: gây 30 sát thương, làm suy yếu đòn phản công kế tiếp.`);
    } else if (classId === "stormshadow") {
      endPlayerAction(48, `${hero.skillName}: tung đòn Lôi Quang gây 48 sát thương.`);
    } else {
      endPlayerAction(44, `${hero.skillName}: gây 44 sát thương.`);
    }
  };

  const reset = () => {
    setHeroHp(hero.hp); setEnemyHp(INITIAL_ENEMY_HP); setHeroMp(40); setShield(0);
    setTurn(1); setBusy(false); setWeakened(false); setLog([{ id: 1, text: "Trận chiến mới bắt đầu!", tone: "gold" }]);
    setNextId(2); setResetKey(k => k + 1);
  };

  const changeClass = (id: ClassId) => {
    setClassId(id);
    const selected = HERO_CLASSES.find(c => c.id === id)!;
    setHeroHp(selected.hp); setEnemyHp(INITIAL_ENEMY_HP); setHeroMp(40); setShield(0);
    setTurn(1); setBusy(false); setWeakened(false); setLog([{ id: Date.now(), text: `Bạn đã chọn ${selected.name}. Trận chiến bắt đầu!`, tone: "gold" }]);
    setResetKey(k => k + 1);
  };

  const gameOver = heroHp <= 0 || enemyHp <= 0;
  const handleSkillSafe = () => {
    if (weakened) setWeakened(false);
    useSkill();
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">✦</div>
        <div><div className="eyebrow">THẾ GIỚI HUYỀN ẢO</div><h1>KẸO THẦN CHIẾN KÝ</h1></div>
        <div className="top-right"><span className="online-dot" /> BẢN THỬ NGHIỆM <span className="version">ALPHA 0.1</span></div>
      </header>

      <section className="intro-row">
        <div><div className="eyebrow">ẢI ĐẦU TIÊN · TÂN THỦ THÔN</div><h2>Hang Động U Minh</h2><p>Một yêu thú canh giữ lối vào vùng đất cổ xưa. Hãy vận dụng sức mạnh của sáu nguyên tố!</p></div>
        <div className="turn-pill"><span>LƯỢT</span><strong>{turn}</strong></div>
      </section>

      <section className="class-picker">
        <span className="picker-label">CHỌN MÔN PHÁI</span>
        {HERO_CLASSES.map(item => <button key={item.id} className={`class-chip ${classId === item.id ? "active" : ""}`} style={{ "--class-color": item.color } as React.CSSProperties} onClick={() => changeClass(item.id)} disabled={busy}>
          <span>{item.icon}</span><b>{item.name}</b><small>{item.role}</small>
        </button>)}
      </section>

      <section className="battle-layout">
        <aside className="combatant hero-card">
          <div className="portrait hero-portrait" style={{ "--portrait-color": hero.color } as React.CSSProperties}><span>{hero.icon}</span><i>NHÂN VẬT</i></div>
          <div className="combatant-title"><div><small>CHIẾN BINH</small><h3>{hero.name}</h3></div><span className="level">CẤP 01</span></div>
          <div className="stat-line"><span>HP</span><b>{heroHp}/{hero.hp}</b></div><div className="bar"><i className="hp-fill" style={{ width: `${Math.max(0, heroHp / hero.hp * 100)}%` }} /></div>
          <div className="stat-line"><span>MP</span><b>{heroMp}/100</b></div><div className="bar"><i className="mp-fill" style={{ width: `${heroMp}%` }} /></div>
          <div className="mini-stats"><span>ATK <b>{hero.attack}</b></span><span>DEF <b>{hero.defense}</b></span><span>KHIÊN <b>{shield}</b></span></div>
          <button className="skill-button" onClick={handleSkillSafe} disabled={busy || gameOver || heroMp < 30}>
            <span className="skill-icon">✧</span><span><b>{hero.skillName}</b><small>Tiêu hao 30 MP · Dùng thay lượt ghép ngọc</small></span><kbd>30 MP</kbd>
          </button>
        </aside>

        <section className="board-panel">
          <div className="board-heading"><div><span className="eyebrow">TRẬN ĐẤU MATCH-3</span><h3>Chọn 2 viên ngọc liền kề</h3></div><span className="board-size">8 × 8</span></div>
          <div className="board-frame"><GameBoard onTurn={handleTurn} resetKey={resetKey} turnSignal={turnSignal} />{(busy || gameOver) && <div className="board-overlay">{gameOver ? <><strong>{enemyHp <= 0 ? "CHIẾN THẮNG!" : "THẤT BẠI"}</strong><span>{enemyHp <= 0 ? "Yêu thú đã bị đánh bại." : "Bạn đã gục ngã."}</span><button onClick={reset}>ĐÁNH LẠI</button></> : <><strong>ĐANG XỬ LÝ LƯỢT...</strong><span>Quái vật chuẩn bị phản công</span></>}</div>}</div>
          <div className="element-legend">{ELEMENTS.map(e => <div key={e.id}><i style={{ background: e.css }} /> <b>{e.name}</b><small>{e.description}</small></div>)}</div>
          <div className="board-hint">Mẹo: Ghép càng nhiều tầng liên tiếp, sát thương cộng thêm càng lớn. Nước đi không tạo bộ 3 sẽ bị từ chối.</div>
        </section>

        <aside className="combatant enemy-card">
          <div className="portrait enemy-portrait"><span>🐉</span><i>YÊU THÚ</i></div>
          <div className="combatant-title"><div><small>QUÁI VẬT · HANG ĐỘNG</small><h3>Xà Yêu U Minh</h3></div><span className="level enemy-level">BOSS</span></div>
          <div className="stat-line"><span>HP</span><b>{enemyHp}/{INITIAL_ENEMY_HP}</b></div><div className="bar"><i className="enemy-fill" style={{ width: `${Math.max(0, enemyHp / INITIAL_ENEMY_HP * 100)}%` }} /></div>
          <div className="enemy-lore">Sinh vật cổ đại hấp thụ linh khí bóng tối. Nó không dễ dàng để kẻ lạ vượt qua.</div>
          <div className="enemy-stats"><span>ĐỘ KHÓ <b>★ ★ ☆</b></span><span>PHẦN THƯỞNG <b>120 EXP</b></span><span>VÀNG <b>50</b></span></div>
        </aside>
      </section>

      <WorldHub />

      <section className="bottom-grid">
        <div className="panel log-panel"><div className="panel-title"><h3>NHẬT KÝ CHIẾN ĐẤU</h3><span>LIVE</span></div><div className="log-list">{log.map(entry => <p key={entry.id} className={entry.tone}>{entry.text}</p>)}</div></div>
        <div className="panel rules-panel"><div className="panel-title"><h3>LUẬT NGUYÊN TỐ</h3><span>HƯỚNG DẪN</span></div><div className="rules-grid"><span>🔥 Hỏa <b>Sát thương</b></span><span>💧 Thủy <b>Hồi HP</b></span><span>⚡ Lôi <b>+3 sát thương/viên</b></span><span>🌿 Mộc <b>+5 MP/viên</b></span><span>🌑 Ám <b>Xuyên giáp</b></span><span>✨ Quang <b>+4 khiên/viên</b></span></div></div>
      </section>
      <footer>© 2026 KẸO THẦN CHIẾN KÝ <span>·</span> GIAI ĐOẠN 2 · MMORPG OFFLINE <span>·</span> DỮ LIỆU TRẬN ĐẤU CHƯA LƯU MÁY CHỦ</footer>
    </main>
  );
}