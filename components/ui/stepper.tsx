"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <nav className={cn("flex items-center", className)} aria-label="Progress">
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index < currentStep && onStepClick;

          return (
            <li
              key={step.label}
              className={cn(
                "flex items-center",
                index < steps.length - 1 && "flex-1"
              )}
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-3 group",
                  isClickable && "cursor-pointer",
                  !isClickable && !isCurrent && "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-300",
                    isCompleted &&
                      "bg-[var(--color-deep)] border-[var(--color-deep)] text-white",
                    isCurrent &&
                      "border-[var(--color-deep)] bg-white text-[var(--color-deep)] ring-4 ring-[var(--color-deep)]/10",
                    !isCompleted &&
                      !isCurrent &&
                      "border-[var(--color-line)] bg-white text-[var(--color-slate-light)]"
                  )}
                >
                  {isCompleted ? (
                    <Check size={18} strokeWidth={3} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </span>
                <div className="hidden sm:block">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isCurrent
                        ? "text-[var(--color-deep)]"
                        : isCompleted
                          ? "text-[var(--color-ink)]"
                          : "text-[var(--color-slate-light)]"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-[var(--color-slate-light)]">
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "hidden sm:block flex-1 mx-4 h-0.5 transition-colors duration-500",
                    isCompleted ? "bg-[var(--color-deep)]" : "bg-[var(--color-line)]"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface StepContentProps {
  step: number;
  currentStep: number;
  children: React.ReactNode;
}

export function StepContent({ step, currentStep, children }: StepContentProps) {
  if (step !== currentStep) return null;
  return <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">{children}</div>;
}
