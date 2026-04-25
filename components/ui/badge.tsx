import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "green" | "yellow" | "red" | "blue" | "cyan" | "gray";
  className?: string;
  dot?: boolean;
}

const variantStyles = {
  default: "bg-surface2 text-text2",
  green: "bg-green/10 text-green border border-green/20",
  yellow: "bg-yellow/10 text-yellow border border-yellow/20",
  red: "bg-red/10 text-[#ef4444] border border-red/20",
  blue: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  cyan: "bg-cyan/10 text-cyan border border-cyan/20",
  gray: "bg-surface3 text-text3 border border-border",
};

const dotColors = {
  default: "#94a3b8",
  green: "#10b981",
  yellow: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  gray: "#475569",
};

export function Badge({ children, variant = "default", className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColors[variant] }}
        />
      )}
      {children}
    </span>
  );
}
