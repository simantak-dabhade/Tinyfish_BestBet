"use client";

import { useState } from "react";

const placeholdersBySport: Record<string, string> = {
  football: "Patriots vs. Chiefs",
  soccer: "Man United vs. Chelsea",
  basketball: "Golden State vs. Grizzlies",
};

export default function Home() {
  const [sport, setSport] = useState<string>("");
  const [match, setMatch] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSport(e.target.value);
    setMatch("");
  };

  const handleFindOdds = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("https://mino.ai/v1/automation/run-sse", {
        method: "POST",
        headers: {
          "X-API-Key": process.env.NEXT_PUBLIC_MINO_API_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: "https://agentql.com",
          goal: "Find all AgentQL subscription plans and their prices. Return result in json format",
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.log(decoder.decode(value));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center font-sans"
      style={{ backgroundColor: "rgb(253, 253, 248)" }}
    >
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 px-6 pt-16">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-5xl font-bold tracking-tight text-black">
            BestBet
          </h1>
          <p className="text-zinc-600">
            helping you find the best odds for any match online
          </p>
        </div>

        <div className="flex w-full flex-col gap-4 sm:flex-row sm:gap-6">
          <select
            value={sport}
            onChange={handleSportChange}
            disabled={isLoading}
            className="h-12 flex-1 rounded-lg border border-zinc-300 bg-white px-4 text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              Select Sport
            </option>
            <option value="football">Football</option>
            <option value="soccer">Soccer</option>
            <option value="basketball">Basketball</option>
          </select>

          <input
            type="text"
            value={match}
            onChange={(e) => setMatch(e.target.value)}
            placeholder={sport !== "" ? placeholdersBySport[sport] : "Select a sport first"}
            disabled={sport === "" || isLoading}
            className="h-12 flex-1 rounded-lg border border-zinc-300 bg-white px-4 text-zinc-900 placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <button
          onClick={handleFindOdds}
          disabled={isLoading}
          className="relative h-10 rounded border-2 border-zinc-900 bg-zinc-800 px-6 text-sm font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_#18181b] transition-all duration-75 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#18181b] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Searching..." : "Find Best Odds"}
        </button>
      </main>
    </div>
  );
}
