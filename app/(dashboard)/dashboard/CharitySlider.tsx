"use client";

import { useState } from "react";

export default function CharitySlider({ initialPercentage }: { initialPercentage: number }) {
  // We use React state to track the slider's value in real-time
  const [percentage, setPercentage] = useState(initialPercentage);

  return (
    <div>
      <div className="flex justify-between items-end mb-3">
        <label className="block text-sm font-medium text-zinc-400">Contribution Percentage</label>
        {/* This span now automatically updates as the state changes */}
        <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded-md text-sm transition-all">
          {percentage}%
        </span>
      </div>
      
      <input
        type="range"
        name="percentage"
        min="10"
        max="100"
        value={percentage}
        onChange={(e) => setPercentage(Number(e.target.value))}
        className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
      />
      
      <div className="flex justify-between text-xs text-zinc-500 mt-2 font-medium">
        <span>10% (Min)</span>
        <span>100% (Max)</span>
      </div>
    </div>
  );
}