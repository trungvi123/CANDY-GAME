import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { BoardScene, type TurnPayload } from "../game/BoardScene";

interface Props {
  onTurn: (result: TurnPayload) => void;
  resetKey: number;
  turnSignal: number;
}

export default function GameBoard({ onTurn, resetKey, turnSignal }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const callbackRef = useRef(onTurn);
  callbackRef.current = onTurn;

  useEffect(() => {
    if (!host.current) return;
    const scene = new BoardScene(result => callbackRef.current(result));
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 456,
      height: 456,
      parent: host.current,
      transparent: true,
      scene,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true }
    });
    gameRef.current = game;
    return () => { game.destroy(true); gameRef.current = null; };
  }, []);

  useEffect(() => {
    gameRef.current?.events.emit("new-board");
  }, [resetKey]);

  useEffect(() => {
    gameRef.current?.events.emit("turn-finished");
  }, [turnSignal]);

  return <div className="board-host" ref={host} aria-label="Bàn cờ ghép ngọc 8 nhân 8" />;
}