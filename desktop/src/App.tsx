import { useState, useEffect } from "react";
import "./index.css";

import { StatusIndicator } from "@/components/StatusIndicator";
import { FocusTimer } from "@/components/FocusTimer";
import { DailyTotal } from "@/components/DailyTotal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function App() {
  const [status, setStatus] = useState<"WORKING" | "IDLE">("IDLE");
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [dailyTotalSeconds, setDailyTotalSeconds] = useState<number>(0);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:9002");

    socket.onopen = () => {
      console.log("✅ WebSocket открыт");
    };

    socket.onmessage = (event) => {
      console.log("📥 Получено:", event.data);
      try {
        const data = JSON.parse(event.data);

        if (data.state === "working" && status !== "WORKING") {
          setStatus("WORKING");
          setSessionStartTime(new Date());
        }

        if (data.state === "idle" && status === "WORKING") {
          setStatus("IDLE");

          if (sessionStartTime) {
            const sessionDuration = Math.floor(
              (Date.now() - sessionStartTime.getTime()) / 1000
            );
            setDailyTotalSeconds((prev) => prev + sessionDuration);
            setSessionStartTime(null);
          }
        }
      } catch (e) {
        console.warn("Ошибка парсинга WebSocket-сообщения", e);
      }
    };

    return () => socket.close();
  }, [status, sessionStartTime]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-3xl font-bold text-center">Silent Desk</h1>

        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusIndicator status={status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
          </CardHeader>
          <CardContent>
            <FocusTimer startTime={sessionStartTime} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Total</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyTotal totalSeconds={dailyTotalSeconds} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
