import Phaser from "phaser";
import { ELEMENT_BY_ID, type ElementId } from "./elements";
import { BOARD_SIZE, createBoard, swapAndResolve, type Board } from "./match3";

export interface TurnPayload {
  counts: Record<ElementId, number>;
  cascades: number;
  totalMatched: number;
}

export class BoardScene extends Phaser.Scene {
  private board: Board = [];
  private selected: { r: number; c: number } | null = null;
  private cell = 54;
  private pad = 12;
  private inputLocked = false;
  private onTurn: (result: TurnPayload) => void;

  constructor(onTurn: (result: TurnPayload) => void) {
    super({ key: "BoardScene" });
    this.onTurn = onTurn;
  }

  create(): void {
    this.board = createBoard();
    this.drawBoard();
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.inputLocked) return;
      const col = Math.floor((pointer.x - this.pad) / this.cell);
      const row = Math.floor((pointer.y - this.pad) / this.cell);
      if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
      if (!this.selected) {
        this.selected = { r: row, c: col };
        this.drawBoard();
        return;
      }
      const first = this.selected;
      this.selected = null;
      if (first.r === row && first.c === col) {
        this.drawBoard();
        return;
      }
      const result = swapAndResolve(this.board, first.r, first.c, row, col);
      if (!result) {
        this.drawBoard();
        this.flashInvalid(row, col);
        return;
      }
      this.board = result.board;
      this.drawBoard();
      this.inputLocked = true;
      this.onTurn({ counts: result.counts, cascades: result.cascades, totalMatched: result.totalMatched });
    });
    this.game.events.on("turn-finished", () => { this.inputLocked = false; this.selected = null; });
    this.game.events.on("new-board", () => { this.board = createBoard(); this.drawBoard(); this.inputLocked = false; });
  }

  private drawBoard(): void {
    this.children.removeAll();
    const bg = this.add.graphics();
    bg.fillStyle(0x0b1223, 0.95);
    bg.fillRoundedRect(0, 0, this.pad * 2 + this.cell * BOARD_SIZE, this.pad * 2 + this.cell * BOARD_SIZE, 18);
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const x = this.pad + c * this.cell + this.cell / 2;
        const y = this.pad + r * this.cell + this.cell / 2;
        const selected = this.selected?.r === r && this.selected?.c === c;
        const info = ELEMENT_BY_ID[this.board[r][c] as ElementId];
        const tile = this.add.graphics();
        tile.fillStyle(selected ? 0x52658c : 0x1b2943, 1);
        tile.fillRoundedRect(x - 24, y - 24, 48, 48, 11);
        tile.lineStyle(selected ? 3 : 1, selected ? 0xffffff : 0x334764, 0.9);
        tile.strokeRoundedRect(x - 24, y - 24, 48, 48, 11);
        const gem = this.add.graphics();
        gem.fillStyle(info.color, 1);
        gem.fillCircle(x, y, 15);
        gem.lineStyle(2, 0xffffff, 0.55);
        gem.strokeCircle(x - 3, y - 4, 8);
        const symbol = this.add.text(x, y + 1, info.symbol, {
          fontFamily: "Arial", fontSize: "17px", color: "#172033", fontStyle: "bold"
        }).setOrigin(0.5);
        symbol.setAlpha(0.9);
      }
    }
  }

  private flashInvalid(row: number, col: number): void {
    const x = this.pad + col * this.cell + this.cell / 2;
    const y = this.pad + row * this.cell + this.cell / 2;
    const ring = this.add.circle(x, y, 25, 0xff5d67, 0.25);
    this.tweens.add({ targets: ring, alpha: 0, scale: 1.35, duration: 260, onComplete: () => ring.destroy() });
  }
}