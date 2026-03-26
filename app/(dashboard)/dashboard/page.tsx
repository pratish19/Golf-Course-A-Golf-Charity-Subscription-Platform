import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import CharitySlider from "./CharitySlider";
import PricingCards from "./PricingCards";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // --- 1. DATA FETCHING ---
  const [
    { data: scores },
    { data: profile },
    { data: charities },
    { data: subscription },
    { data: winnings },
    { data: latestDraw },
    { data: settings }
  ] = await Promise.all([
    supabase.from("scores").select("*").eq("user_id", user.id).order("date_entered", { ascending: false }),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("charities").select("*"),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).eq("status", "active").single(),
    supabase.from("winnings").select("*").eq("user_id", user.id).order("draw_date", { ascending: false }),
    supabase.from("draw_history").select("*").order("draw_date", { ascending: false }).limit(1).single(),
    supabase.from("platform_settings").select("rollover_amount").eq("id", 1).single()
  ]);

  const isSubscribed = !!subscription;
  const activeWins = winnings?.filter(w => w.status !== 'paid') || [];
  const pastWins = winnings?.filter(w => w.status === 'paid') || [];

  // --- 2. SERVER ACTIONS ---
  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  };

  const submitScore = async (formData: FormData) => {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const scoreValue = parseInt(formData.get("score") as string);
    if (isNaN(scoreValue) || scoreValue < 1 || scoreValue > 45) return; 

    const { data: currentScores } = await supabase.from("scores").select("id").eq("user_id", user.id).order("date_entered", { ascending: true });
    if (currentScores && currentScores.length >= 5) {
      const idsToDelete = currentScores.slice(0, currentScores.length - 4).map(s => s.id);
      await supabase.from("scores").delete().in("id", idsToDelete);
    }
    await supabase.from("scores").insert({ user_id: user.id, score: scoreValue });
    revalidatePath("/dashboard");
  };

  const updateCharity = async (formData: FormData) => {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const charityId = formData.get("charity_id") as string;
    const percentage = parseInt(formData.get("percentage") as string);
    await supabase.from("profiles").update({ selected_charity_id: charityId, charity_percentage: percentage }).eq("id", user.id);
    revalidatePath("/dashboard");
  };

  const uploadProof = async (formData: FormData) => {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const file = formData.get("proof_file") as File;
    const winningId = formData.get("winning_id") as string;
    if (!file || file.size === 0) return;

    const fileName = `${user.id}_${Date.now()}.${file.name.split('.').pop()}`;
    const { data: uploadData } = await supabase.storage.from("winner_proofs").upload(fileName, file);
    if (uploadData) {
      await supabase.from("winnings").update({ proof_url: uploadData.path, status: "verifying" }).eq("id", winningId);
      revalidatePath("/dashboard");
    }
  };

  // --- 3. UI RENDER ---
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER & SUBSCRIPTION STATUS */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-start border-b border-zinc-800 pb-6 gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Player Dashboard</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${isSubscribed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {isSubscribed && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                {isSubscribed ? 'Active Subscription' : 'Inactive'}
              </div>
              {subscription?.current_period_end && (
                <p className="text-zinc-500 text-xs font-medium">
                  Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3 md:gap-4 items-center">
            <a href="/settings" className="text-sm px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors">⚙️ Manage Profile</a>
            <div className="text-sm px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hidden md:block">{profile?.display_name || user.email}</div>
            
            {/* LOG OUT BUTTON */}
            <form action={signOut}>
              <button type="submit" className="text-sm px-4 py-2 bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 rounded-xl transition-all">
                Log Out
              </button>
            </form>
          </div>
        </header>

        {/* LATEST GLOBAL DRAW RESULTS & PARTICIPATION STATS */}
        {latestDraw && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left">
                <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Latest Official Draw</h2>
                <p className="text-white text-sm font-bold">{new Date(latestDraw.draw_date).toLocaleDateString()}</p>
              </div>
              
              <div className="flex gap-3">
                {latestDraw.winning_numbers.map((num: number, i: number) => (
                  <div key={i} className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    {num}
                  </div>
                ))}
              </div>

              <div className="bg-zinc-950 px-8 py-4 rounded-2xl border border-zinc-800 text-center min-w-[200px]">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Participation</p>
                <p className="text-white font-bold text-sm">
                  {isSubscribed ? "Entered in Next Draw" : "Subscription Required"}
                </p>
                {isSubscribed && (settings?.rollover_amount || 0) > 0 && (
  <p className="text-[10px] text-amber-400 font-bold mt-1 animate-pulse tracking-tight">
    + ₹{Number(settings?.rollover_amount || 0).toLocaleString()} Jackpot Rollover
  </p>
)}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE WINNINGS BANNER */}
        {activeWins.length > 0 && (
          <div className="bg-emerald-950/30 border border-emerald-500/50 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-700">
             <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">🏆 Prize Center: Action Required</h2>
             <div className="space-y-4">
               {activeWins.map((win) => (
                 <div key={win.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                   <div>
                     <p className="text-lg font-bold">Matched {win.match_count} Numbers!</p>
                     <p className="text-zinc-400 text-sm">Prize Amount: ₹{Number(win.prize_amount).toLocaleString()}</p>
                   </div>
                   {win.status === 'pending_proof' && (
                     <form action={uploadProof} className="flex gap-2 w-full md:w-auto">
                       <input type="hidden" name="winning_id" value={win.id} />
                       <input type="file" name="proof_file" accept="image/*,.pdf" required className="text-xs bg-zinc-900 border border-zinc-800 rounded-md p-2 w-full file:bg-zinc-800 file:text-white file:border-0" />
                       <button type="submit" className="bg-emerald-500 text-zinc-950 font-bold px-4 py-2 rounded-md hover:bg-emerald-400 transition-colors">Upload</button>
                     </form>
                   )}
                   {win.status === 'verifying' && <span className="text-amber-400 font-bold text-sm bg-amber-400/10 px-4 py-2 rounded-md">⏳ Verifying Proof...</span>}
                 </div>
               ))}
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: CHARITY & SCORES */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <h2 className="text-xl font-bold mb-6">Selected Charity</h2>
              <form action={updateCharity} className="space-y-6">
                <select name="charity_id" defaultValue={profile?.selected_charity_id || ""} required className="w-full rounded-xl px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 outline-none transition-all">
                  <option value="" disabled>Choose a charity...</option>
                  {charities?.map(charity => <option key={charity.id} value={charity.id}>{charity.name}</option>)}
                </select>
                <CharitySlider initialPercentage={profile?.charity_percentage || 10} />
                <button type="submit" className="w-full bg-white text-zinc-950 font-bold rounded-xl px-4 py-3 hover:bg-zinc-200 transition-colors">Save Impact Settings</button>
              </form>
            </div>

            {isSubscribed ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <h2 className="text-lg font-bold mb-4 text-zinc-400">Log New Score</h2>
                <form action={submitScore} className="flex gap-4">
                  <input type="number" name="score" min="1" max="45" required className="flex-1 rounded-xl px-4 py-4 bg-zinc-950 border border-zinc-800 focus:border-emerald-500" placeholder="Points (1-45)" />
                  <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black rounded-xl px-8 transition-all">Submit Score</button>
                </form>
              </div>
            ) : (
              <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl p-10 text-center">
                <h2 className="text-2xl font-bold text-white mb-6">Subscribe to Participate</h2>
                <PricingCards />
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: RECENT HISTORY */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Recent Scores</h2>
                <span className="text-xs font-bold text-zinc-500 bg-zinc-800 px-2 py-1 rounded">{scores?.length || 0} / 5 Logged</span>
              </div>
              {scores && scores.length > 0 ? (
                <ul className="space-y-3">
                  {scores.map((score) => (
                    <li key={score.id} className="flex justify-between items-center p-4 rounded-2xl border border-zinc-800 bg-zinc-950/50">
                      <span className="text-zinc-500 text-sm font-medium">{new Date(score.date_entered).toLocaleDateString()}</span>
                      <span className="font-black text-lg">{score.score} pts</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-10 text-center text-zinc-600 italic">No scores logged yet.</div>
              )}
            </div>

            {pastWins.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                <h2 className="text-xl font-bold mb-6">Payout History</h2>
                <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {pastWins.map((win) => (
                    <li key={win.id} className="flex justify-between items-center p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                      <div>
                        <span className="block font-bold text-sm">Matched {win.match_count}</span>
                        <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">{new Date(win.draw_date).toLocaleDateString()}</span>
                      </div>
                      <span className="font-black text-emerald-400">₹{Number(win.prize_amount).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}