import { NextResponse } from "next/server";
import { exec, ChildProcess } from "child_process";

let simulatorProcess: ChildProcess | null = null;

export async function GET() {
  return NextResponse.json({ running: simulatorProcess !== null });
}

export async function POST(request: Request) {
  const { action } = await request.json();

  if (action === "start") {
    if (!simulatorProcess) {
      simulatorProcess = exec("npx tsx simulator/fake-eld.ts", (err) => {
        if (err && !err.killed) {
          console.error("Simulator error:", err.message);
        }
        simulatorProcess = null;
      });
    }
    return NextResponse.json({ running: true });
  }

  if (action === "stop") {
    if (simulatorProcess) {
      simulatorProcess.kill();
      simulatorProcess = null;
    }
    return NextResponse.json({ running: false });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
