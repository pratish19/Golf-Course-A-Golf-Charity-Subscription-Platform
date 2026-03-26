"use client";

import { useState } from "react";

export default function PricingCards() {
  const [loading, setLoading] = useState<string | null>(null);
  
  // Track which plan is currently highlighted. Default to 'yearly'.
  const [hoveredPlan, setHoveredPlan] = useState<"monthly" | "yearly">("yearly");

  const handleCheckout = async (priceId: string, planName: string) => {
    setLoading(planName);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url; 
      } else {
        alert("Failed to start checkout. Check console.");
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(null);
  };

  // If the mouse leaves the whole container, default the highlight back to Yearly
  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-3xl mx-auto"
      onMouseLeave={() => setHoveredPlan("yearly")}
    >
      
      {/* Monthly Plan */}
      <div 
        onMouseEnter={() => setHoveredPlan("monthly")}
        className={`transition-all duration-300 rounded-2xl p-8 flex flex-col text-center relative overflow-hidden bg-zinc-900 border ${
          hoveredPlan === "monthly" ? "border-emerald-500/50 scale-[1.02]" : "border-zinc-800 scale-100"
        }`}
      >
        {/* Animated Top Gradient */}
        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 transition-opacity duration-300 ${
          hoveredPlan === "monthly" ? "opacity-100" : "opacity-0"
        }`}></div>

        <h3 className="text-2xl font-bold text-white mb-2">Monthly</h3>
        <p className="text-zinc-400 text-sm mb-6">Play, track, and support charities every month.</p>
        <div className="text-4xl font-extrabold text-emerald-400 mb-8">₹500<span className="text-lg text-zinc-500 font-normal">/mo</span></div>
        
        {/* Animated Button */}
        <button
          onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || "", "monthly")}
          disabled={loading !== null}
          className={`mt-auto w-full font-bold rounded-xl px-4 py-3 transition-colors duration-300 disabled:opacity-50 ${
            hoveredPlan === "monthly" ? "bg-emerald-500 hover:bg-emerald-600 text-zinc-950" : "bg-zinc-100 hover:bg-white text-zinc-950"
          }`}
        >
          {loading === "monthly" ? "Loading..." : "Subscribe Monthly"}
        </button>
      </div>

      {/* Yearly Plan */}
      <div 
        onMouseEnter={() => setHoveredPlan("yearly")}
        className={`transition-all duration-300 rounded-2xl p-8 flex flex-col text-center relative overflow-hidden bg-zinc-900 border ${
          hoveredPlan === "yearly" ? "border-emerald-500/50 scale-[1.02]" : "border-zinc-800 scale-100"
        }`}
      >
        {/* Animated Top Gradient */}
        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 transition-opacity duration-300 ${
          hoveredPlan === "yearly" ? "opacity-100" : "opacity-0"
        }`}></div>
        
        <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-1 rounded-md">SAVE 8%</div>
        
        <h3 className="text-2xl font-bold text-white mb-2">Yearly</h3>
        <p className="text-zinc-400 text-sm mb-6">Commit for the year and maximize your impact.</p>
        <div className="text-4xl font-extrabold text-emerald-400 mb-8">₹5499<span className="text-lg text-zinc-500 font-normal">/yr</span></div>
        
        {/* Animated Button */}
        <button
          onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || "", "yearly")}
          disabled={loading !== null}
          className={`mt-auto w-full font-bold rounded-xl px-4 py-3 transition-colors duration-300 disabled:opacity-50 ${
            hoveredPlan === "yearly" ? "bg-emerald-500 hover:bg-emerald-600 text-zinc-950" : "bg-zinc-100 hover:bg-white text-zinc-950"
          }`}
        >
          {loading === "yearly" ? "Loading..." : "Subscribe Yearly"}
        </button>
      </div>

    </div>
  );
}