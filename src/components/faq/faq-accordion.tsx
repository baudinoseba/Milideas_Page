"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface FaqItem {
  categoria: string;
  pregunta: string;
  respuesta: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  // Start with first item open by default
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const toggleItem = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const isOpen = openIndices.includes(idx);

        return (
          <div
            key={idx}
            className={cn(
              "rounded-2xl border transition-all duration-200 overflow-hidden",
              isOpen
                ? "border-terracota/40 bg-surface shadow-sm"
                : "border-border/60 bg-surface/70 hover:bg-surface hover:border-border"
            )}
          >
            <button
              type="button"
              onClick={() => toggleItem(idx)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-4 cursor-pointer"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-terracota uppercase tracking-wider block font-sans">
                  {item.categoria}
                </span>
                <h3 className="text-sm sm:text-base font-semibold text-chocolate font-serif">
                  {item.pregunta}
                </h3>
              </div>

              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-secondary/30 text-chocolate transition-transform duration-200 font-bold text-sm",
                  isOpen && "rotate-180 bg-terracota text-white border-terracota"
                )}
              >
                ↓
              </span>
            </button>

            {isOpen && (
              <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-barro font-sans leading-relaxed border-t border-border/40 pt-3 animate-in fade-in duration-150 whitespace-pre-line">
                {item.respuesta}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
