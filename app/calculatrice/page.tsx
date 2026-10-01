"use client";

import { useCallback, useEffect, useState } from "react";

type Operation = "+" | "-" | "×" | "÷";

function formatNumber(value: number): string {
  if (!isFinite(value)) return "Erreur";
  const rounded = parseFloat(value.toPrecision(12));
  return rounded.toLocaleString("fr-FR", { maximumFractionDigits: 10 });
}

function parseDisplay(value: string): number {
  const normalized = value.replace(/[\s\u202f\u00a0]/g, "").replace(",", ".");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

function compute(a: number, b: number, op: Operation): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
}

export default function CalculatorPage() {
  const [display, setDisplay] = useState("0");
  const [previous, setPrevious] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [lastExpression, setLastExpression] = useState("");

  const inputDigit = useCallback(
    (digit: string) => {
      setDisplay((prev) => {
        if (waitingForOperand) return digit === "," ? "0," : digit;
        if (digit === ",") {
          return prev.includes(",") ? prev : prev + ",";
        }
        const next = prev === "0" ? digit : prev + digit;
        return next.replace(/,/g, ".").length > 14 ? prev : next;
      });
      setWaitingForOperand(false);
    },
    [waitingForOperand],
  );

  const chooseOperation = useCallback(
    (op: Operation) => {
      const current = parseDisplay(display);
      if (previous !== null && operation && !waitingForOperand) {
        const result = compute(previous, current, operation);
        setPrevious(result);
        setDisplay(formatNumber(result).replace(/\u202f/g, " ").replace(/\./g, ","));
      } else {
        setPrevious(current);
      }
      setOperation(op);
      setWaitingForOperand(true);
    },
    [display, previous, operation, waitingForOperand],
  );

  const equals = useCallback(() => {
    if (previous === null || !operation) return;
    const current = parseDisplay(display);
    const result = compute(previous, current, operation);
    setLastExpression(`${formatNumber(previous)} ${operation} ${formatNumber(current)} =`);
    setDisplay(formatNumber(result).replace(/\u202f/g, " ").replace(/\./g, ","));
    setPrevious(null);
    setOperation(null);
    setWaitingForOperand(true);
  }, [display, previous, operation]);

  const clearAll = useCallback(() => {
    setDisplay("0");
    setPrevious(null);
    setOperation(null);
    setWaitingForOperand(false);
    setLastExpression("");
  }, []);

  const toggleSign = useCallback(() => {
    setDisplay((prev) => {
      if (prev === "0") return prev;
      return prev.startsWith("-") ? prev.slice(1) : "-" + prev;
    });
  }, []);

  const percent = useCallback(() => {
    setDisplay((prev) => {
      const value = parseDisplay(prev);
      return formatNumber(value / 100).replace(/\u202f/g, " ").replace(/\./g, ",");
    });
  }, []);

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        inputDigit(key);
      } else if (key === "," || key === ".") {
        inputDigit(",");
      } else if (key === "+") {
        chooseOperation("+");
      } else if (key === "-") {
        chooseOperation("-");
      } else if (key === "*") {
        chooseOperation("×");
      } else if (key === "/") {
        e.preventDefault();
        chooseOperation("÷");
      } else if (key === "Enter" || key === "=") {
        e.preventDefault();
        equals();
      } else if (key === "Escape") {
        clearAll();
      } else if (key === "Backspace") {
        setDisplay((prev) => (prev.length <= 1 || (prev.length === 2 && prev.startsWith("-")) ? "0" : prev.slice(0, -1)));
      } else if (key === "%") {
        percent();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inputDigit, chooseOperation, equals, clearAll, percent]);

  const operatorSymbol = operation ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="calc-shadow rounded-4xl border border-border bg-card p-5">
          {/* Display */}
          <div className="flex min-h-32 flex-col items-end justify-end rounded-2xl bg-display px-5 py-4">
            <span className="text-sm text-display-dim tabular-nums" data-testid="history">
              {lastExpression || (previous !== null ? `${formatNumber(previous)} ${operatorSymbol}` : "")}
            </span>
            <span className="mt-1 truncate text-4xl font-semibold tracking-tight text-display-foreground tabular-nums" data-testid="display">
              {display}
            </span>
          </div>

          {/* Keypad */}
          <div className="mt-5 grid grid-cols-4 gap-3">
            <Key label="C" onPress={clearAll} variant="muted" testId="clear" />
            <Key label="±" onPress={toggleSign} variant="muted" testId="sign" />
            <Key label="%" onPress={percent} variant="muted" testId="percent" />
            <Key label="÷" onPress={() => chooseOperation("÷")} variant="accent" active={operation === "÷" && waitingForOperand} testId="divide" />

            <Key label="7" onPress={() => inputDigit("7")} testId="7" />
            <Key label="8" onPress={() => inputDigit("8")} testId="8" />
            <Key label="9" onPress={() => inputDigit("9")} testId="9" />
            <Key label="×" onPress={() => chooseOperation("×")} variant="accent" active={operation === "×" && waitingForOperand} testId="multiply" />

            <Key label="4" onPress={() => inputDigit("4")} testId="4" />
            <Key label="5" onPress={() => inputDigit("5")} testId="5" />
            <Key label="6" onPress={() => inputDigit("6")} testId="6" />
            <Key label="−" onPress={() => chooseOperation("-")} variant="accent" active={operation === "-"} testId="subtract" />

            <Key label="1" onPress={() => inputDigit("1")} testId="1" />
            <Key label="2" onPress={() => inputDigit("2")} testId="2" />
            <Key label="3" onPress={() => inputDigit("3")} testId="3" />
            <Key label="+" onPress={() => chooseOperation("+")} variant="accent" active={operation === "+"} testId="add" />

            <Key
              label="⌫"
              onPress={() => {
                setDisplay((prev) => (prev.length <= 1 || (prev.length === 2 && prev.startsWith("-")) ? "0" : prev.slice(0, -1)));
              }}
              variant="muted"
              testId="backspace"
            />
            <Key label="0" onPress={() => inputDigit("0")} testId="0" />
            <Key label="," onPress={() => inputDigit(",")} testId="decimal" />
            <Key label="=" onPress={equals} variant="solid" testId="equals" />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">Vous pouvez aussi utiliser votre clavier</p>
      </div>
    </div>
  );
}

function Key({
  label,
  onPress,
  variant = "default",
  active = false,
  testId,
}: {
  label: string;
  onPress: () => void;
  variant?: "default" | "muted" | "accent" | "solid";
  active?: boolean;
  testId: string;
}) {
  const base =
    "key-shadow flex h-16 items-center justify-center rounded-2xl text-xl font-medium select-none transition-all duration-75 active:key-pressed focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const styles =
    variant === "accent"
      ? active
        ? "bg-primary text-primary-foreground key-shadow-accent"
        : "bg-key text-primary hover:bg-key-hover"
      : variant === "solid"
        ? "bg-primary text-primary-foreground key-shadow-accent hover:bg-primary/90"
        : variant === "muted"
          ? "bg-secondary text-muted-foreground hover:bg-key-hover"
          : "bg-key text-key-fg hover:bg-key-hover";

  return (
    <button type="button" aria-label={label} data-testid={testId} onClick={onPress} className={`${base} ${styles}`}>
      {label}
    </button>
  );
}
