import { cn } from "@/lib/utils";

type Status = "WORKING" | "IDLE";

interface StatusIndicatorProps {
  status: Status;
  className?: string;
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "w-4 h-4 rounded-full",
          status === "WORKING" ? "bg-success" : "bg-muted"
        )}
        aria-hidden="true"
      />
      <span className="font-medium">
        {status === "WORKING" ? "WORKING" : "IDLE"}
      </span>
    </div>
  );
}
