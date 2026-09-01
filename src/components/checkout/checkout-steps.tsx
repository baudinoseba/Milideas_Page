"use client";

import { cn } from "@/lib/utils/cn";

interface CheckoutStepsProps {
  currentStep: 1 | 2 | 3 | 4;
}

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  const steps = [
    { number: 1, label: "CARRITO" },
    { number: 2, label: "TUS DATOS" },
    { number: 3, label: "ENVÍO" },
    { number: 4, label: "CONFIRMÁ Y PAGÁ" },
  ];

  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full py-4 select-none">
      <div className="relative max-w-2xl mx-auto">
        {/* Connecting progress line - centered on 36px circles (18px) */}
        <div className="absolute left-[12.5%] right-[12.5%] top-[18px] -translate-y-1/2 h-[2px] bg-border z-0">
          <div
            className="h-full bg-primary transition-all duration-500"
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
                      "border-2 border-primary bg-surface text-primary font-bold",
                    isActive &&
                      "border-2 border-primary bg-primary text-primary-foreground scale-110 ring-4 ring-primary/20 font-bold shadow-md",
                    !isActive &&
                      !isCompleted &&
                      "border-2 border-border bg-surface text-muted-foreground"
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
                      ? "text-primary border-b-2 border-primary pb-0.5 px-1 font-bold"
                      : isCompleted
                      ? "text-foreground/90 font-medium"
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
