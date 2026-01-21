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

  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSport(e.target.value);
    setMatch("");
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
            className="h-12 flex-1 rounded-lg border border-zinc-300 bg-white px-4 text-zinc-900"
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
            placeholder={sport ? placeholdersBySport[sport] : "Select a sport first"}
            disabled={!sport}
            className="h-12 flex-1 rounded-lg border border-zinc-300 bg-white px-4 text-zinc-900 placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <button className="h-12 w-full rounded-lg bg-black px-8 font-medium text-white transition-colors hover:bg-zinc-800 sm:w-auto">
          Find Best Odds
        </button>
      </main>
    </div>
  );
}
