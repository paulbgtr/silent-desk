import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FocusTimerProps {
  startTime: Date | null;
  className?: string;
}

export function FocusTimer({ startTime, className }: FocusTimerProps) {
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    // Reset timer when startTime changes
    if (!startTime) {
      setElapsedTime(0);
      return;
    }

    // Calculate initial elapsed time
    const initialElapsed = Math.floor(
      (Date.now() - startTime.getTime()) / 1000
    );
    setElapsedTime(initialElapsed);

    // Update timer every second
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

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
    <div className={cn("font-mono text-2xl", className)}>
      {formatTime(elapsedTime)}
    </div>
  );
}
