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

  return (
    <div className="w-full py-4 select-none">
      <div className="relative flex justify-between items-center max-w-2xl mx-auto">
        {/* Connecting progress line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border -translate-y-1/2 -z-10" />
        <div
          className="absolute left-0 top-1/2 h-0.5 bg-primary -translate-y-1/2 transition-all duration-500 -z-10"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <div
              key={step.number}
              className="flex flex-col items-center flex-1 text-center group"
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shadow-sm border",
                  isCompleted &&
                    "bg-secondary border-primary/20 text-primary font-bold",
                  isActive &&
                    "bg-primary border-primary text-primary-foreground scale-110 ring-4 ring-primary/10",
                  !isActive &&
                    !isCompleted &&
                    "bg-surface border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <span className="text-base">✓</span>
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2.5 text-[10px] sm:text-xs tracking-wider font-semibold transition-all duration-300",
                  isActive
                    ? "text-primary border-b-2 border-primary pb-0.5 px-1 font-bold"
                    : isCompleted
                    ? "text-foreground/80 font-medium"
                    : "text-muted"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
