"use client";

import { useState } from "react";
import Image from "next/image";

const placeholdersBySport: Record<string, string> = {
  soccer: "Galatasaray vs Atletico Madrid",
};

const SPORTSBOOKS = [
  { name: "DraftKings", url: "https://www.draftkings.com/" },
  { name: "FanDuel", url: "https://www.fanduel.com/" },
  { name: "BetMGM", url: "https://www.nj.betmgm.com" },
  { name: "Caesars", url: "https://www.caesars.com/sportsbook-and-casino" },
  { name: "Bet365", url: "https://www.bet365.com/usa" },
  { name: "Polymarket", url: "https://polymarket.com/sports/live" },
];

type OddsResult = {
  url: string;
  game_date: string;
  game_time: string;
  home_team: string;
  away_team: string;
  betting_odds: {
    home_wins: string;
    draw: string;
    away_wins: string;
  };
};

type ErrorResult = {
  error: string;
  reason: string;
};

type SportsbookResult = {
  success: boolean;
  data: OddsResult | ErrorResult;
};

export default function Home() {
  const [sport, setSport] = useState<string>("");
  const [match, setMatch] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamUrls, setStreamUrls] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, SportsbookResult>>({});

  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSport(e.target.value);
    setMatch("");
  };

  const fetchSportsbook = async (sportsbook: { name: string; url: string }) => {
    try {
      const response = await fetch("https://mino.ai/v1/automation/run-sse", {
        method: "POST",
        headers: {
          "X-API-Key": process.env.NEXT_PUBLIC_MINO_API_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: sportsbook.url,
          goal: `You are extracting current betting market data from this sports betting webpage.

Match: ${match}

Focus only on "Pre-match" or "Upcoming" games. If live games are present, prioritize extracting data for games that have not yet started.

STEP 1 - GAME AND BET TYPE INPUT (if required):
If the page provides multiple sports to bet on followed by their subgenres, select Soccer followed by Champions League/UEFA Champions League. If page provides multiple betting types, select Moneyline. Click select/continue/expand/all games to proceed.

STEP 2 - FIND UPCOMING BETTING SLOTS
- Look at the date time provided for upcoming games
- Find the upcoming game for "${match}"
- Bet values should appear on buttons or links containing "+" or "-" symbols and values (e.g., +280, -105).

STEP 3 - RETURN RESULT
{
	"url": "url of the webpage",
	"game_date": "Today" or "MM/DD/YYYY",
	"game_time": "HH:MM AM/PM",
	"home_team": "Home Team Name",
	"away_team": "Away Team Name",
	"betting_odds": {
		"home_wins": "+XXX",
		"draw": "+XXX",
		"away_wins": "+XXX"
	}
}`,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        console.log(`[${sportsbook.name}]`, chunk);

        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "STREAMING_URL" && data.streamingUrl) {
                setStreamUrls((prev) => ({
                  ...prev,
                  [sportsbook.name]: data.streamingUrl,
                }));
              } else if (data.type === "COMPLETE") {
                // Remove stream URL
                setStreamUrls((prev) => {
                  const updated = { ...prev };
                  delete updated[sportsbook.name];
                  return updated;
                });

                // Store result
                const resultJson = data.resultJson;
                if (resultJson?.error) {
                  setResults((prev) => ({
                    ...prev,
                    [sportsbook.name]: {
                      success: false,
                      data: {
                        error: resultJson.error,
                        reason: resultJson.reason || "Unknown error",
                      },
                    },
                  }));
                } else if (resultJson?.betting_odds) {
                  setResults((prev) => ({
                    ...prev,
                    [sportsbook.name]: {
                      success: true,
                      data: resultJson as OddsResult,
                    },
                  }));
                }
              }
            } catch {
              // Not valid JSON, skip
            }
          }
        }
      }
    } catch (error) {
      console.error(`[${sportsbook.name}] Error:`, error);
      setResults((prev) => ({
        ...prev,
        [sportsbook.name]: {
          success: false,
          data: {
            error: "Network Error",
            reason: "Failed to connect to the API",
          },
        },
      }));
    }
  };

  const handleFindOdds = async () => {
    setIsLoading(true);
    setStreamUrls({});
    setResults({});

    try {
      await Promise.all(SPORTSBOOKS.map((sportsbook) => fetchSportsbook(sportsbook)));
    } finally {
      setIsLoading(false);
    }
  };

  const activeStreams = Object.entries(streamUrls);
  const completedResults = Object.entries(results);

  return (
    <div
      className="flex min-h-screen flex-col items-center font-sans"
      style={{ backgroundColor: "rgb(253, 253, 248)" }}
    >
      <main className="flex w-full max-w-6xl flex-col items-center gap-8 px-6 pt-16">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/bestBetLogoWithText.png"
            alt="BestBet"
            width={250}
            height={250}
            priority
          />
          <p className="text-zinc-600">
            helping you find the best odds for any match online
          </p>
        </div>

        <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:gap-6">
          <select
            value={sport}
            onChange={handleSportChange}
            disabled={isLoading}
            className="h-12 flex-1 rounded-lg border border-zinc-300 bg-white px-4 text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              Select Sport
            </option>
            <option value="soccer">Soccer</option>
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

        {(activeStreams.length > 0 || completedResults.length > 0) && (
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Active streams */}
            {activeStreams.map(([name, url]) => (
              <div key={name} className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-700">{name}</span>
                <div
                  className="relative w-full overflow-hidden rounded-lg border border-zinc-300"
                  style={{ paddingBottom: "56.25%" }}
                >
                  <iframe
                    src={url}
                    className="absolute inset-0 h-full w-full"
                    allow="autoplay"
                  />
                </div>
              </div>
            ))}

            {/* Completed results */}
            {completedResults.map(([name, result]) => (
              <div key={name} className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-700">{name}</span>
                <div className="rounded-lg border border-zinc-300 bg-white p-4">
                  {result.success ? (
                    <div className="flex flex-col gap-3">
                      <div className="text-xs text-zinc-500">
                        {(result.data as OddsResult).game_date} • {(result.data as OddsResult).game_time}
                      </div>
                      <div className="text-sm font-medium text-zinc-900">
                        {(result.data as OddsResult).home_team} vs {(result.data as OddsResult).away_team}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded bg-zinc-100 p-2">
                          <div className="text-xs text-zinc-500">Home</div>
                          <div className="font-bold text-zinc-900">
                            {(result.data as OddsResult).betting_odds.home_wins}
                          </div>
                        </div>
                        <div className="rounded bg-zinc-100 p-2">
                          <div className="text-xs text-zinc-500">Draw</div>
                          <div className="font-bold text-zinc-900">
                            {(result.data as OddsResult).betting_odds.draw}
                          </div>
                        </div>
                        <div className="rounded bg-zinc-100 p-2">
                          <div className="text-xs text-zinc-500">Away</div>
                          <div className="font-bold text-zinc-900">
                            {(result.data as OddsResult).betting_odds.away_wins}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="text-sm font-medium text-red-600">
                        {(result.data as ErrorResult).error}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {(result.data as ErrorResult).reason}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
