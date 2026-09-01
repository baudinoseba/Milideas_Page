"use client";

import { cn } from "@/lib/utils/cn";

interface EncargosStepsProps {
  currentStep: 1 | 2 | 3 | 4;
}

export function EncargosSteps({ currentStep }: EncargosStepsProps) {
  const steps = [
    { number: 1, label: "REVISIÓN Y EDICIÓN" },
    { number: 2, label: "TUS DATOS" },
    { number: 3, label: "RESUMEN FINAL" },
    { number: 4, label: "SOLICITAR WHATSAPP" },
  ];

  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full py-4 select-none">
      <div className="relative max-w-2xl mx-auto">
        {/* Connecting progress line behind circles */}
        <div className="absolute left-[12.5%] right-[12.5%] top-[18px] -translate-y-1/2 h-[2px] bg-border z-0">
          <div
            className="h-full bg-terracota transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps Grid */}
        <div className="relative z-10 flex justify-between items-start">
          {steps.map((step) => {
            const isCompleted = step.number < currentStep;
            const isActive = step.number === currentStep;

            return (
              <div
                key={step.number}
                className="flex flex-col items-center flex-1 text-center group"
              >
                {/* Step Circle with 100% solid opaque background */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 relative z-10 shadow-xs",
                    isCompleted &&
                      "border-2 border-terracota bg-surface text-terracota font-bold",
                    isActive &&
                      "border-2 border-terracota bg-terracota text-white scale-110 shadow-md ring-4 ring-terracota/20 font-bold",
                    !isActive &&
                      !isCompleted &&
                      "border-2 border-border bg-surface text-muted"
                  )}
                >
                  {isCompleted ? (
                    <span className="text-sm font-bold">✓</span>
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={cn(
                    "mt-2 text-[10px] sm:text-xs tracking-wider transition-all duration-300 font-sans",
                    isActive
                      ? "text-terracota border-b-2 border-terracota pb-0.5 px-1 font-bold"
                      : isCompleted
                      ? "text-chocolate font-medium"
                      : "text-muted font-medium"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
