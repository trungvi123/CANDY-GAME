import { createServer } from "node:http";
import { randomUUID, randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scrypt = promisify(scryptCallback);
const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = process.env.CANDY_DATA_FILE || join(ROOT, "data", "db.json");
const PORT = Number(process.env.API_PORT || 8787);
const SECRET = process.env.CANDY_SESSION_SECRET || "development-only-change-this-secret-before-deploying";
const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;
const MAX_BODY = 16_384;
const queue = [];
const sessions = new Map();
let db = { users: [], matches: [] };
let writeChain = Promise.resolve();

const json = (res, status, payload) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(payload));
};
const publicUser = u => ({ id: u.id, username: u.username, classId: u.classId, rating: u.rating, wins: u.wins, losses: u.losses, createdAt: u.createdAt });
const persist = () => {
  writeChain = writeChain.then(async () => {
    await mkdir(dirname(DATA_FILE), { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
  });
  return writeChain;
};
const readBody = req => new Promise((resolve, reject) => {
  let raw = "";
  req.on("data", chunk => { raw += chunk; if (raw.length > MAX_BODY) reject(new Error("Dữ liệu gửi lên quá lớn.")); });
  req.on("end", () => {
    try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("JSON không hợp lệ.")); }
  });
  req.on("error", reject);
});
const sign = value => createHmac("sha256", SECRET).update(value).digest("base64url");
const issueToken = user => {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, exp: Date.now() + TOKEN_TTL })).toString("base64url");
  return payload + "." + sign(payload);
};
const getUser = req => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.exp < Date.now()) return null;
    return db.users.find(u => u.id === data.sub) || null;
  } catch { return null; }
};
const requireUser = (req, res) => {
  const user = getUser(req);
  if (!user) json(res, 401, { error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
  return user;
};
const passwordHash = async password => {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return { salt, hash: Buffer.from(hash).toString("hex") };
};
const verifyPassword = async (password, user) => {
  const actual = Buffer.from(await scrypt(password, user.salt, 64));
  const expected = Buffer.from(user.passwordHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
const validClass = id => ["fireblade", "frostmage", "stormshadow", "stoneguard"].includes(id);
const ratingOf = id => db.users.find(u => u.id === id)?.rating ?? 1000;
const matchView = (match, userId) => ({
  id: match.id, status: match.status, turnUserId: match.turnUserId,
  you: match.players.find(p => p.userId === userId),
  opponent: match.players.find(p => p.userId !== userId),
  log: match.log.slice(-12), winnerId: match.winnerId || null
});
const finishMatch = async (match, winnerId) => {
  match.status = "completed";
  match.winnerId = winnerId;
  match.completedAt = new Date().toISOString();
  for (const p of match.players) {
    const user = db.users.find(u => u.id === p.userId);
    if (!user) continue;
    if (p.userId === winnerId) { user.wins += 1; user.rating += 25; }
    else { user.losses += 1; user.rating = Math.max(0, user.rating - 15); }
  }
  await persist();
};
const createMatch = async (a, b) => {
  const match = {
    id: randomUUID(), status: "active", createdAt: new Date().toISOString(),
    players: [a, b].map((u, i) => ({ userId: u.id, username: u.username, classId: u.classId, hp: 100, maxHp: 100, mp: 50, guard: 0, wins: u.wins, rating: u.rating })),
    turnUserId: a.id, round: 1, log: ["Trận PvP bắt đầu! " + a.username + " đi trước."], actions: []
  };
  db.matches.push(match);
  await persist();
  return match;
};
const sendMatch = (res, match, userId) => json(res, 200, { match: matchView(match, userId) });

async function route(req, res) {
  const url = new URL(req.url || "/", "http://localhost");
  const path = url.pathname;
  if (req.method === "GET" && path === "/api/health") return json(res, 200, { ok: true, service: "candy-game-api" });

  if (req.method === "POST" && (path === "/api/auth/register" || path === "/api/auth/login")) {
    const body = await readBody(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return json(res, 400, { error: "Tên tài khoản phải dài 3–20 ký tự, chỉ gồm chữ, số và dấu gạch dưới." });
    if (password.length < 8 || password.length > 128) return json(res, 400, { error: "Mật khẩu phải có ít nhất 8 ký tự." });
    if (path.endsWith("register")) {
      if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) return json(res, 409, { error: "Tên tài khoản đã tồn tại." });
      const credentials = await passwordHash(password);
      const user = { id: randomUUID(), username, ...credentials, classId: validClass(body.classId) ? body.classId : "fireblade", rating: 1000, wins: 0, losses: 0, createdAt: new Date().toISOString() };
      db.users.push(user); await persist();
      return json(res, 201, { token: issueToken(user), user: publicUser(user) });
    }
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user || !(await verifyPassword(password, user))) return json(res, 401, { error: "Tên tài khoản hoặc mật khẩu không đúng." });
    return json(res, 200, { token: issueToken(user), user: publicUser(user) });
  }

  if (req.method === "GET" && path === "/api/leaderboard") {
    const users = [...db.users].sort((a, b) => b.rating - a.rating || b.wins - a.wins).slice(0, 20).map((u, i) => ({ rank: i + 1, ...publicUser(u) }));
    return json(res, 200, { leaderboard: users });
  }

  const user = requireUser(req, res);
  if (!user) return;
  if (req.method === "GET" && path === "/api/me") return json(res, 200, { user: publicUser(user) });
  if (req.method === "GET" && path === "/api/matches/history") {
    const matches = db.matches.filter(m => m.status === "completed" && m.players.some(p => p.userId === user.id)).slice(-30).reverse().map(m => ({
      id: m.id, completedAt: m.completedAt, winnerId: m.winnerId,
      opponent: m.players.find(p => p.userId !== user.id)?.username || "Người chơi",
      result: m.winnerId === user.id ? "win" : "loss"
    }));
    return json(res, 200, { history: matches });
  }
  if (req.method === "POST" && path === "/api/queue") {
    const active = db.matches.find(m => m.status === "active" && m.players.some(p => p.userId === user.id));
    if (active) return json(res, 200, { state: "matched", match: matchView(active, user.id) });
    const existing = queue.find(x => x.userId === user.id);
    if (existing) return json(res, 200, { state: "waiting" });
    const opponentIndex = queue.findIndex(x => x.userId !== user.id);
    if (opponentIndex >= 0) {
      const opponent = db.users.find(u => u.id === queue[opponentIndex].userId);
      queue.splice(opponentIndex, 1);
      if (opponent) {
        const match = await createMatch(opponent, user);
        return json(res, 200, { state: "matched", match: matchView(match, user.id) });
      }
    }
    queue.push({ userId: user.id, joinedAt: Date.now() });
    return json(res, 200, { state: "waiting" });
  }
  if (req.method === "GET" && path === "/api/queue") {
    const active = db.matches.find(m => m.status === "active" && m.players.some(p => p.userId === user.id));
    if (active) return json(res, 200, { state: "matched", match: matchView(active, user.id) });
    return json(res, 200, { state: queue.some(x => x.userId === user.id) ? "waiting" : "idle" });
  }
  if (req.method === "DELETE" && path === "/api/queue") {
    const i = queue.findIndex(x => x.userId === user.id);
    if (i >= 0) queue.splice(i, 1);
    return json(res, 200, { state: "idle" });
  }
  const matchRoute = path.match(/^\/api\/matches\/([\w-]+)(?:\/(action))?$/);
  if (matchRoute) {
    const match = db.matches.find(m => m.id === matchRoute[1] && m.players.some(p => p.userId === user.id));
    if (!match) return json(res, 404, { error: "Không tìm thấy trận đấu." });
    if (req.method === "GET" && !matchRoute[2]) return sendMatch(res, match, user.id);
    if (req.method === "POST" && matchRoute[2] === "action") {
      if (match.status !== "active") return json(res, 409, { error: "Trận đấu đã kết thúc." });
      if (match.turnUserId !== user.id) return json(res, 409, { error: "Chưa đến lượt của bạn." });
      const body = await readBody(req);
      const action = body.action;
      if (!["attack", "guard", "skill"].includes(action)) return json(res, 400, { error: "Hành động không hợp lệ." });
      const me = match.players.find(p => p.userId === user.id);
      const foe = match.players.find(p => p.userId !== user.id);
      if (action === "skill" && me.mp < 20) return json(res, 400, { error: "Không đủ MP." });
      let message = "";
      if (action === "attack") {
        const damage = 12 + Math.floor(Math.random() * 9);
        const blocked = Math.min(foe.guard, damage);
        foe.guard -= blocked; foe.hp = Math.max(0, foe.hp - (damage - blocked));
        message = me.username + " tấn công gây " + (damage - blocked) + " sát thương.";
      } else if (action === "guard") {
        me.guard = Math.min(24, me.guard + 12);
        me.mp = Math.min(100, me.mp + 8);
        message = me.username + " phòng thủ, tạo 12 khiên và hồi 8 MP.";
      } else {
        me.mp -= 20;
        const damage = 28 + Math.floor(Math.random() * 8);
        const blocked = Math.min(foe.guard, damage);
        foe.guard -= blocked; foe.hp = Math.max(0, foe.hp - (damage - blocked));
        message = me.username + " tung tuyệt kỹ gây " + (damage - blocked) + " sát thương.";
      }
      match.actions.push({ userId: user.id, action, at: new Date().toISOString() });
      match.log.push(message);
      if (foe.hp <= 0) {
        await finishMatch(match, user.id);
      } else {
        match.turnUserId = foe.userId;
        match.round += 1;
        match.log.push("Đến lượt " + foe.username + ".");
        await persist();
      }
      return sendMatch(res, match, user.id);
    }
  }
  return json(res, 404, { error: "Không tìm thấy API." });
}

async function main() {
  try { db = JSON.parse(await readFile(DATA_FILE, "utf8")); }
  catch { db = { users: [], matches: [] }; }
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.matches)) db.matches = [];
  createServer(async (req, res) => {
    try { await route(req, res); }
    catch (error) { console.error(error); if (!res.headersSent) json(res, 500, { error: "Máy chủ gặp lỗi. Vui lòng thử lại." }); }
  }).listen(PORT, () => console.log("Candy Game API listening on http://localhost:" + PORT));
}
main();
