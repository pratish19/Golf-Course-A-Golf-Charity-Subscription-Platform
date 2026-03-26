"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DrawResults = {
  winningNumbers: number[];
  jackpot: number;
  stats: { match5: number; match4: number; match3: number; totalEvaluated: number };
};

export default function DrawClient({ 
  runDrawAlgorithm, 
  prizePool 
}: { 
  runDrawAlgorithm: (payload?: { isSimulation: boolean; forcedNumbers?: number[] }) => Promise<DrawResults>;
  prizePool: number;
}) {
  const router = useRouter();
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [results, setResults] = useState<DrawResults | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const [slotNumbers, setSlotNumbers] = useState<number[]>([0, 0, 0, 0, 0]);
  const [lockedIndices, setLockedIndices] = useState<boolean[]>([false, false, false, false, false]);

  const handleSimulateDraw = async () => {
    // 1. Instantly lock the button so it can't be double-clicked!
    if (isDrawing) return; 
    setIsDrawing(true);
    setHasStarted(true);
    setShowStats(false);
    setResults(null);
    setLockedIndices([false, false, false, false, false]);
    setSlotNumbers([0, 0, 0, 0, 0]);

    // Request a simulation from the server (does NOT touch the database)
    const dataPromise = runDrawAlgorithm({ isSimulation: true });

    let currentLock = 0;
    const rollInterval = setInterval(() => {
      setSlotNumbers((prev) =>
        prev.map((num, i) => (i >= currentLock ? Math.floor(Math.random() * 45) + 1 : num))
      );
    }, 50); 

    const drawData = await dataPromise;

    const lockedState = [false, false, false, false, false];

    const lockInterval = setInterval(() => {
      lockedState[currentLock] = true;
      setLockedIndices([...lockedState]);

      setSlotNumbers((prev) => {
        const next = [...prev];
        next[currentLock] = drawData.winningNumbers[currentLock];
        return next;
      });

      currentLock++;

      if (currentLock >= 5) {
        clearInterval(rollInterval);
        clearInterval(lockInterval);
        setResults(drawData);
        setIsDrawing(false);
        
        setTimeout(() => setShowStats(true), 500); 
      }
    }, 800); 
  };

  const handlePublish = async () => {
    if (!results) return;
    if (!confirm("Are you sure you want to officially publish these results? This will update the database and notify winners.")) return;
    
    setIsPublishing(true);
    // Pass the exact simulated numbers back to the server to make them official
    await runDrawAlgorithm({ isSimulation: false, forcedNumbers: results.winningNumbers });
    setIsPublishing(false);
    
    alert("Draw officially published! Database updated.");
    router.refresh(); // Refreshes the Verification Queue on the Admin Page
    resetDraw();
  };

  const resetDraw = () => {
    setHasStarted(false);
    setShowStats(false);
    setResults(null);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mt-8">
      
      {!hasStarted ? (
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="text-xs bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 font-bold uppercase">
              Monthly Cadence
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">Monthly Draw Engine</h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
            Algorithm ready to execute in <b>Simulation Mode</b>. This will generate 5 secure random numbers and evaluate active subscribers without altering the database.
          </p>
          <button 
            onClick={handleSimulateDraw}
            disabled={isDrawing} 
            className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl px-8 py-4 transition-all disabled:opacity-50 disabled:pointer-events-none hover:scale-105 active:scale-95"
          >
            {isDrawing ? "Calculating Physics..." : "Run Pre-Draw Simulation"}
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-zinc-400 mb-6">
              {isDrawing ? "DRAWING NUMBERS..." : "SIMULATED WINNING NUMBERS"}
            </h2>
            
            <div className="flex justify-center gap-2 md:gap-4">
              {slotNumbers.slice(0, 5).map((num, i) => (
                <div 
                  key={i} 
                  className={`w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    lockedIndices[i] 
                      ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-110" 
                      : "bg-zinc-800 border-2 border-zinc-700 opacity-80"
                  }`}
                >
                  <span className={`text-xl md:text-3xl font-black ${lockedIndices[i] ? "text-zinc-950" : "text-zinc-500"}`}>
                    {num || "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {showStats && results && (
            <div className="animate-in slide-in-from-top-4 fade-in duration-500">
              <hr className="border-zinc-800 mb-8" />
              <h3 className="text-lg font-bold text-white mb-2">Simulation Payout Distribution</h3>
              <p className="text-sm text-zinc-400 mb-6">Evaluated {results.stats.totalEvaluated} active tickets.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`border rounded-xl p-6 relative overflow-hidden transition-all duration-700 ${results.stats.match5 > 0 ? "bg-emerald-950/40 border-emerald-500" : "bg-zinc-950 border-zinc-800"}`}>
                  {results.stats.match5 > 0 && <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500 animate-pulse"></div>}
                  <h4 className={`${results.stats.match5 > 0 ? "text-emerald-400" : "text-zinc-500"} font-bold mb-1`}>JACKPOT (Match 5)</h4>
                  <p className="text-3xl font-black text-white">{results.stats.match5} <span className="text-sm font-normal text-zinc-500">Winners</span></p>
                  {/* Uses the actual jackpot from the server (which includes previous rollovers!) */}
                  <p className="text-sm text-zinc-400 mt-2">Payout: ₹{results.jackpot.toFixed(2)}</p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                  <h4 className="text-zinc-300 font-bold mb-1">Match 4</h4>
                  <p className="text-3xl font-black text-white">{results.stats.match4} <span className="text-sm font-normal text-zinc-500">Winners</span></p>
                  <p className="text-sm text-zinc-400 mt-2">Payout: ₹{(prizePool * 0.25).toFixed(2)}</p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                  <h4 className="text-zinc-300 font-bold mb-1">Match 3</h4>
                  <p className="text-3xl font-black text-white">{results.stats.match3} <span className="text-sm font-normal text-zinc-500">Winners</span></p>
                  <p className="text-sm text-zinc-400 mt-2">Payout: ₹{(prizePool * 0.15).toFixed(2)}</p>
                </div>
              </div>

              {/* ROLLOVER WARNING */}
              <div className="mt-6 text-center">
                 <p className={`text-sm font-medium py-2 px-4 rounded-lg inline-block ${results.stats.match5 === 0 ? "text-amber-400 bg-amber-400/10" : "text-emerald-400 bg-emerald-400/10"}`}>
                  {results.stats.match5 === 0 
                    ? `⚠️ No Match 5 Winners. The ₹${results.jackpot.toFixed(2)} Jackpot will roll over to next month if published.` 
                    : `🎉 Match 5 Winner found! Jackpot will be awarded and reset.`}
                </p>
              </div>

              {/* 2-STEP PUBLISH CONTROLS */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
                <button onClick={resetDraw} className="px-6 py-3 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 transition-colors text-white">
                  Discard & Re-run Simulation
                </button>
                <button 
                  onClick={handlePublish} 
                  disabled={isPublishing} 
                  className="px-6 py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-zinc-950 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPublishing ? "Publishing to Database..." : "Publish Official Draw"}
                </button>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}