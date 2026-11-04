import { useCallback, useEffect, useState } from "react";

type Player = { userId: string; username: string; classId: string; hp: number; maxHp: number; mp: number; guard: number; rating: number };
type Match = { id: string; status: string; turnUserId: string; you: Player; opponent: Player; log: string[]; winnerId: string | null };
type User = { id: string; username: string; classId: string; rating: number; wins: number; losses: number };
type Leader = { rank: number; username: string; rating: number; wins: number; losses: number };
type History = { id: string; completedAt: string; opponent: string; result: "win" | "loss" };
const TOKEN_KEY = "candy-game-phase3-token";
const api = async (path: string, token?: string, options: RequestInit = {}) => {
  const response = await fetch(path, { ...options, headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Yêu cầu thất bại.");
  return data;
};
const classNames: Record<string, string> = { fireblade: "Kiếm Sĩ Hỏa", frostmage: "Pháp Sư Băng", stormshadow: "Ảnh Lôi", stoneguard: "Hộ Vệ Thạch" };

export default function PhaseThreeHub() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [queueState, setQueueState] = useState<"idle" | "waiting" | "matched">("idle");
  const [match, setMatch] = useState<Match | null>(null);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const refreshPanels = useCallback(async (auth: string) => {
    const [l, h, me] = await Promise.all([api("/api/leaderboard", auth), api("/api/matches/history", auth), api("/api/me", auth)]);
    setLeaders(l.leaderboard); setHistory(h.history); setUser(me.user);
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY); setToken(""); setUser(null); setMatch(null); setQueueState("idle"); setHistory([]);
  }, []);
  useEffect(() => {
    if (!token) return;
    let alive = true;
    api("/api/me", token).then(({ user: current }) => { if (alive) { setUser(current); refreshPanels(token).catch(() => undefined); } }).catch(() => { if (alive) logout(); });
    return () => { alive = false; };
  }, [token, refreshPanels, logout]);
  useEffect(() => {
    if (!token || queueState !== "waiting") return;
    const timer = window.setInterval(() => {
      api("/api/queue", token).then(data => {
        if (data.state === "matched") { setMatch(data.match); setQueueState("matched"); setNotice("Đã tìm thấy đối thủ!"); }
        else setQueueState(data.state);
      }).catch(e => setError(e.message));
    }, 1800);
    return () => window.clearInterval(timer);
  }, [token, queueState]);
  useEffect(() => {
    if (!token || !match || match.status !== "active") return;
    const timer = window.setInterval(() => {
      api("/api/matches/" + match.id, token).then(data => setMatch(data.match)).catch(() => undefined);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [token, match?.id, match?.status]);
  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const data = await api("/api/auth/" + mode, undefined, { method: "POST", body: JSON.stringify({ username, password }) });
      localStorage.setItem(TOKEN_KEY, data.token); setToken(data.token); setUser(data.user); setPassword("");
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể đăng nhập."); }
    finally { setLoading(false); }
  };
  const findMatch = async () => {
    if (!token) return;
    setError(""); setNotice("Đang tìm đối thủ...");
    try {
      const data = await api("/api/queue", token, { method: "POST", body: "{}" });
      if (data.state === "matched") { setMatch(data.match); setQueueState("matched"); setNotice("Đã tìm thấy đối thủ!"); }
      else setQueueState("waiting");
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể ghép trận."); }
  };
  const cancelQueue = async () => {
    if (!token) return;
    await api("/api/queue", token, { method: "DELETE" });
    setQueueState("idle"); setNotice("Đã hủy tìm trận.");
  };
  const takeAction = async (action: "attack" | "guard" | "skill") => {
    if (!token || !match) return;
    setLoading(true); setError("");
    try {
      const data = await api("/api/matches/" + match.id + "/action", token, { method: "POST", body: JSON.stringify({ action }) });
      setMatch(data.match); await refreshPanels(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể thực hiện lượt."); }
    finally { setLoading(false); }
  };
  const leaveMatch = () => { setMatch(null); setQueueState("idle"); if (token) refreshPanels(token).catch(() => undefined); };
  return <section className="phase-three">
    <div className="phase-three-heading"><div><span className="eyebrow">GIAI ĐOẠN 3 · ONLINE ARENA</span><h2>Đấu Trường Kẹo Thần</h2><p>Tạo tài khoản, tìm đối thủ và tranh hạng PvP 1 đấu 1.</p></div><span className="online-label">● SERVER MODE</span></div>
    {error && <div className="p3-alert error">{error}</div>}{notice && <div className="p3-alert">{notice}</div>}
    {!user ? <form className="p3-auth" onSubmit={submitAuth}>
      <div className="p3-auth-tabs"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>ĐĂNG NHẬP</button><button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>TẠO TÀI KHOẢN</button></div>
      <label>Tên tài khoản<input value={username} onChange={e => setUsername(e.target.value)} minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" required placeholder="vd: CandyHero" autoComplete="username" /></label>
      <label>Mật khẩu<input value={password} onChange={e => setPassword(e.target.value)} type="password" minLength={8} maxLength={128} required placeholder="Ít nhất 8 ký tự" autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
      <button className="p3-primary" disabled={loading}>{loading ? "ĐANG XỬ LÝ..." : mode === "login" ? "VÀO ĐẤU TRƯỜNG" : "ĐĂNG KÝ"}</button>
      <small>Giai đoạn thử nghiệm: tài khoản được lưu trên máy chủ chạy game, không dùng chung mật khẩu với dịch vụ khác.</small>
    </form> : <>
      <div className="p3-profile"><div><small>CHIẾN BINH ONLINE</small><h3>{user.username}</h3><span>{classNames[user.classId] || user.classId}</span></div><div className="p3-rating"><b>{user.rating}</b><small>ĐIỂM ELO</small></div><div><b>{user.wins}</b><small>THẮNG</small></div><div><b>{user.losses}</b><small>THUA</small></div><button onClick={logout}>ĐĂNG XUẤT</button></div>
      {!match ? <div className="p3-queue"><div><h3>Đấu xếp hạng 1v1</h3><p>Ghép tự động với người chơi đang chờ. Thắng +25 điểm, thua -15 điểm.</p></div>{queueState === "waiting" ? <button className="p3-secondary" onClick={cancelQueue}>HỦY TÌM TRẬN</button> : <button className="p3-primary" onClick={findMatch}>⚔ TÌM ĐỐI THỦ</button>}</div> : <div className="p3-match">
        <div className="p3-match-title"><div><span className="eyebrow">TRẬN ĐẤU {match.status === "active" ? "ĐANG DIỄN RA" : "ĐÃ KẾT THÚC"}</span><h3>{match.you.username} <i>VS</i> {match.opponent.username}</h3></div><span className="p3-round">1V1 · TURN BASED</span></div>
        <div className="p3-duel"><div className="p3-fighter"><small>BẠN · {classNames[match.you.classId] || match.you.classId}</small><b>{match.you.username}</b><div className="p3-hp"><i style={{ width: (match.you.hp / match.you.maxHp * 100) + "%" }} /></div><span>HP {match.you.hp}/{match.you.maxHp} · MP {match.you.mp} · Khiên {match.you.guard}</span></div><div className="p3-vs">VS</div><div className="p3-fighter opponent"><small>ĐỐI THỦ · {classNames[match.opponent.classId] || match.opponent.classId}</small><b>{match.opponent.username}</b><div className="p3-hp"><i style={{ width: (match.opponent.hp / match.opponent.maxHp * 100) + "%" }} /></div><span>HP {match.opponent.hp}/{match.opponent.maxHp} · MP {match.opponent.mp} · Khiên {match.opponent.guard}</span></div></div>
        <div className="p3-battle-log">{match.log.map((line, i) => <p key={i}>{line}</p>)}</div>
        {match.status === "active" ? <div className="p3-actions"><b>{match.turnUserId === user.id ? "LƯỢT CỦA BẠN" : "ĐANG CHỜ ĐỐI THỦ..."}</b><button disabled={loading || match.turnUserId !== user.id} onClick={() => takeAction("attack")}>⚔ TẤN CÔNG</button><button disabled={loading || match.turnUserId !== user.id} onClick={() => takeAction("guard")}>🛡 PHÒNG THỦ</button><button disabled={loading || match.turnUserId !== user.id || match.you.mp < 20} onClick={() => takeAction("skill")}>✨ TUYỆT KỸ · 20 MP</button></div> : <div className="p3-result"><b>{match.winnerId === user.id ? "CHIẾN THẮNG!" : "BẠN ĐÃ THUA"}</b><span>{match.winnerId === user.id ? "+25" : "-15"} điểm xếp hạng</span><button onClick={leaveMatch}>TRỞ VỀ ĐẤU TRƯỜNG</button></div>}
      </div>}
      <div className="p3-lower"><section className="p3-panel"><h3>🏆 BẢNG XẾP HẠNG</h3>{leaders.length ? leaders.map(item => <div className="p3-row" key={item.rank}><b>#{item.rank} {item.username}</b><span>{item.rating} ELO · {item.wins}W/{item.losses}L</span></div>) : <p>Chưa có người chơi.</p>}</section><section className="p3-panel"><h3>📜 LỊCH SỬ ĐẤU</h3>{history.length ? history.map(item => <div className="p3-row" key={item.id}><b>{item.result === "win" ? "THẮNG" : "THUA"} · {item.opponent}</b><span>{new Date(item.completedAt).toLocaleString("vi-VN")}</span></div>) : <p>Bạn chưa có trận đấu hoàn thành.</p>}</section></div>
    </>}
    <p className="p3-footnote">PvP alpha dùng máy chủ kiểm tra lượt và sát thương. Hệ thống ghép trận hiện chạy trong một tiến trình máy chủ; cần hạ tầng nhiều máy chủ và cơ sở dữ liệu chuyên dụng trước khi mở công khai.</p>
  </section>;
}
