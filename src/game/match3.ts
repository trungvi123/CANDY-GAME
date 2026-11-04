import { randomElement, type ElementId } from "./elements";

export const BOARD_SIZE = 8;
export type Board = ElementId[][];

export interface MatchResult {
  board: Board;
  counts: Record<ElementId, number>;
  cascades: number;
  totalMatched: number;
}

export function createBoard(): Board {
  const board: Board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      let gem = randomElement();
      let guard = 0;
      while (guard++ < 20 &&
        ((col >= 2 && board[row][col - 1] === gem && board[row][col - 2] === gem) ||
         (row >= 2 && board[row - 1][col] === gem && board[row - 2][col] === gem))) {
        gem = randomElement();
      }
      board[row][col] = gem;
    }
  }
  return board;
}

export function findMatches(board: Board): Set<string> {
  const found = new Set<string>();
  for (let r = 0; r < BOARD_SIZE; r++) {
    let start = 0;
    while (start < BOARD_SIZE) {
      let end = start + 1;
      while (end < BOARD_SIZE && board[r][end] === board[r][start]) end++;
      if (board[r][start] && end - start >= 3) {
        for (let c = start; c < end; c++) found.add(`${r},${c}`);
      }
      start = end;
    }
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    let start = 0;
    while (start < BOARD_SIZE) {
      let end = start + 1;
      while (end < BOARD_SIZE && board[end][c] === board[start][c]) end++;
      if (board[start][c] && end - start >= 3) {
        for (let r = start; r < end; r++) found.add(`${r},${c}`);
      }
      start = end;
    }
  }
  return found;
}

export function hasPossibleMove(board: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= BOARD_SIZE || nc >= BOARD_SIZE) continue;
        const copy = board.map(row => [...row]);
        [copy[r][c], copy[nr][nc]] = [copy[nr][nc], copy[r][c]];
        if (findMatches(copy).size > 0) return true;
      }
    }
  }
  return false;
}

export function resolveMatches(input: Board): MatchResult {
  const board = input.map(row => [...row]);
  const counts: Record<ElementId, number> = {
    fire: 0, water: 0, lightning: 0, wood: 0, dark: 0, light: 0
  };
  let cascades = 0;
  let totalMatched = 0;
  while (cascades < 20) {
    const matches = findMatches(board);
    if (matches.size === 0) break;
    cascades++;
    totalMatched += matches.size;
    for (const key of matches) {
      const [r, c] = key.split(",").map(Number);
      counts[board[r][c]]++;
      board[r][c] = "" as ElementId;
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
      const remaining: ElementId[] = [];
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (board[r][c]) remaining.push(board[r][c]);
      }
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        board[r][c] = remaining[BOARD_SIZE - 1 - r] ?? randomElement();
      }
    }
  }
  return { board, counts, cascades, totalMatched };
}

export function swapAndResolve(board: Board, r1: number, c1: number, r2: number, c2: number): MatchResult | null {
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return null;
  const copy = board.map(row => [...row]);
  [copy[r1][c1], copy[r2][c2]] = [copy[r2][c2], copy[r1][c1]];
  if (findMatches(copy).size === 0) return null;
  return resolveMatches(copy);
}