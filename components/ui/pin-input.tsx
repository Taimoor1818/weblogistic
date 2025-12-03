"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
    length?: number;
    onComplete: (pin: string) => void;
    autoFocus?: boolean;
    disabled?: boolean;
    error?: boolean;
}

export function PinInput({
    length = 4,
    onComplete,
    autoFocus = true,
    disabled = false,
    error = false,
}: PinInputProps) {
    const [values, setValues] = React.useState<string[]>(Array(length).fill(""));
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        if (disabled) return;

        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newValues = [...values];
        newValues[index] = value;
        setValues(newValues);

        // Auto-focus next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check if all inputs are filled
        if (newValues.every((v) => v !== "")) {
            onComplete(newValues.join(""));
        }
    };

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === "Backspace" && !values[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, length);

        if (!/^\d+$/.test(pastedData)) return;

        const newValues = pastedData.split("").concat(Array(length).fill("")).slice(0, length);
        setValues(newValues);

        if (newValues.every((v) => v !== "")) {
            onComplete(newValues.join(""));
        }
    };

    React.useEffect(() => {
        if (autoFocus) {
            inputRefs.current[0]?.focus();
        }
    }, [autoFocus]);

    return (
        <div className="flex gap-2 justify-center">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={values[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={cn(
                        "w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                        error
                            ? "border-red-500 bg-red-50 dark:bg-red-950"
                            : "border-border bg-background",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                />
            ))}
        </div>
    );
}
