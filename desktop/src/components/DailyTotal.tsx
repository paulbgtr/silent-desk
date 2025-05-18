import { cn } from "@/lib/utils";

interface DailyTotalProps {
  totalSeconds: number;
  className?: string;
}

export function DailyTotal({ totalSeconds, className }: DailyTotalProps) {
  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-sm text-muted-foreground">Today's focus time</span>
      <span className="font-mono text-xl">{formatTime(totalSeconds)}</span>
    </div>
  );
}
