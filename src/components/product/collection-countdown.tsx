"use client";

import { useEffect, useState } from "react";

interface CollectionCountdownProps {
  fechaLanzamiento: string;
  onFinish?: () => void;
}

export function CollectionCountdown({ fechaLanzamiento, onFinish }: CollectionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    dias: number;
    horas: number;
    minutos: number;
    segundos: number;
    isFinished: boolean;
  }>({ dias: 0, horas: 0, minutos: 0, segundos: 0, isFinished: false });

  useEffect(() => {
    const targetMs = new Date(fechaLanzamiento).getTime();

    const updateTimer = () => {
      const nowMs = Date.now();
      const diff = targetMs - nowMs;

      if (diff <= 0) {
        setTimeLeft({ dias: 0, horas: 0, minutos: 0, segundos: 0, isFinished: true });
        if (onFinish) onFinish();
        return;
      }

      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ dias, horas, minutos, segundos, isFinished: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [fechaLanzamiento, onFinish]);

  if (timeLeft.isFinished) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 border border-emerald-200">
        ✨ ¡Lanzamiento en vivo ya disponible!
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-terracota/20 bg-surface/90 p-4 text-center shadow-subtle backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-terracota">
        🚀 Próximo Lanzamiento Exclusivo en:
      </p>
      <div className="flex justify-center items-center gap-3 font-mono text-chocolate font-bold">
        <div className="flex flex-col items-center bg-crema-suave/50 rounded-lg px-3 py-1.5 border border-border/40">
          <span className="text-xl">{timeLeft.dias}</span>
          <span className="text-[10px] uppercase text-muted font-sans font-normal">Días</span>
        </div>
        <span className="text-xl text-terracota">:</span>
        <div className="flex flex-col items-center bg-crema-suave/50 rounded-lg px-3 py-1.5 border border-border/40">
          <span className="text-xl">{String(timeLeft.horas).padStart(2, "0")}</span>
          <span className="text-[10px] uppercase text-muted font-sans font-normal">Hs</span>
        </div>
        <span className="text-xl text-terracota">:</span>
        <div className="flex flex-col items-center bg-crema-suave/50 rounded-lg px-3 py-1.5 border border-border/40">
          <span className="text-xl">{String(timeLeft.minutos).padStart(2, "0")}</span>
          <span className="text-[10px] uppercase text-muted font-sans font-normal">Min</span>
        </div>
        <span className="text-xl text-terracota">:</span>
        <div className="flex flex-col items-center bg-crema-suave/50 rounded-lg px-3 py-1.5 border border-border/40">
          <span className="text-xl">{String(timeLeft.segundos).padStart(2, "0")}</span>
          <span className="text-[10px] uppercase text-muted font-sans font-normal">Seg</span>
        </div>
      </div>
    </div>
  );
}
