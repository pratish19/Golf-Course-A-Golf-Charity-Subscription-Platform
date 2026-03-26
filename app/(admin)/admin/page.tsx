import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import DrawClient from "./DrawClient";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // Security Check (Checks for 'admin' role OR the master email)
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && user.email !== "admin@golf.com") {
    return redirect("/dashboard");
  }

  // --- ADMIN DATA FETCHING ---
  
  // 1. Analytics & Stats
  const { count: activeSubscribers } = await supabase.from("subscriptions").select("*", { count: 'exact', head: true }).eq("status", "active");
  const totalRevenue = (activeSubscribers || 0) * 500;
  const currentPrizePool = totalRevenue * 0.5;

 
 // 2. User Management (Bulletproof separate fetches)
  const { data: allUsers } = await supabase.from("profiles").select("*");
  const { data: allSubscriptions } = await supabase.from("subscriptions").select("*");
  // 3. Charity Management
  const { data: charities } = await supabase.from("charities").select("*");

  // 4. Winner Verification Queue & Full History
  const { data: pendingWins, error: winError } = await supabase
    .from("winnings")
    .select("*, profiles(*)") 
    .eq("status", "verifying");

  const { data: allWinnings } = await supabase
    .from("winnings")
    .select("*, profiles(*)")
    .order("draw_date", { ascending: false });
// Filter out the Admin from all visual lists
  const normalUsers = allUsers?.filter(u => u.email !== "admin@golf.com" && u.role !== "admin") || [];
  const normalPendingWins = pendingWins?.filter(win => win.profiles?.email !== "admin@golf.com") || [];
  const normalWinnings = allWinnings?.filter(win => win.profiles?.email !== "admin@golf.com") || [];
  if (winError) {
    console.error("🚨 DATABASE ERROR IN VERIFICATION QUEUE:", winError);
  }

  // --- ADMIN SERVER ACTIONS ---

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  };

  const addCharity = async (formData: FormData) => {
    "use server";
    const supabase = await createClient();
    const name = formData.get("name") as string;
    const desc = formData.get("desc") as string;
    await supabase.from("charities").insert({ name, description: desc });
    revalidatePath("/admin");
  };

  const deleteCharity = async (formData: FormData) => {
    "use server";
    const supabase = await createClient();
    const id = formData.get("id") as string;
    await supabase.from("charities").delete().eq("id", id);
    revalidatePath("/admin");
  };

  const approvePayout = async (formData: FormData) => {
    "use server";
    const supabase = await createClient();
    const winId = formData.get("win_id") as string;
    await supabase.from("winnings").update({ status: "paid" }).eq("id", winId);
    revalidatePath("/admin");
  };

  const runDrawAlgorithm = async (payload?: { isSimulation: boolean; forcedNumbers?: number[] }) => {
    "use server";
    const db = await createClient();
    const isSim = payload?.isSimulation ?? true;

    // 1. Get numbers 
    let winningNumbers = payload?.forcedNumbers || [];
    if (winningNumbers.length === 0) {
      const drawnNumbers = new Set<number>();
      while (drawnNumbers.size < 5) { drawnNumbers.add(Math.floor(Math.random() * 45) + 1); }
      winningNumbers = Array.from(drawnNumbers).sort((a, b) => a - b);
    }

    // 2. Fetch Active Subs and the Rollover Amount
    const { data: subs } = await db.from("subscriptions").select("user_id").eq("status", "active");
    const { data: settings } = await db.from("platform_settings").select("rollover_amount").eq("id", 1).single();
    
    // Calculate the total jackpot
    const activeSubscribersCount = subs?.length || 0;
    const currentMonthRevenue = activeSubscribersCount * 500;
    const currentPrizePoolCalc = currentMonthRevenue * 0.5;
    const totalJackpotAvailable = (currentPrizePoolCalc * 0.6) + (settings?.rollover_amount || 0);

    let match5 = 0, match4 = 0, match3 = 0;
    const winnersToInsert: any[] = [];

    if (subs) {
      for (const sub of subs) {
        const { data: scores } = await db.from("scores").select("score").eq("user_id", sub.user_id).order("date_entered", { ascending: false }).limit(5);
        const playerScores = (scores || []).map(s => s.score);
        const matchCount = playerScores.filter(score => winningNumbers.includes(score)).length;
        
        if (matchCount === 5) match5++;
        if (matchCount === 4) match4++;
        if (matchCount === 3) match3++;

        if (matchCount >= 3) {
            winnersToInsert.push({ 
                user_id: sub.user_id, 
                match_count: matchCount, 
                draw_date: new Date().toISOString(),
                prize_amount: matchCount === 5 ? totalJackpotAvailable : (matchCount === 4 ? 1000 : 500),
                status: 'pending_proof'
            });
        }
      }
    }

    // 3. IF PUBLISHING: Save to Database and Handle Rollover
    if (!isSim) {
      if (winnersToInsert.length > 0) {
        await db.from("winnings").insert(winnersToInsert);
      }

      await db.from("draw_history").insert({
        winning_numbers: winningNumbers,
        match5_count: match5,
        match4_count: match4,
        match3_count: match3,
        jackpot_amount: totalJackpotAvailable,
        rolled_over: match5 === 0
      });

      const newRollover = match5 === 0 ? totalJackpotAvailable : 0;
      await db.from("platform_settings").update({ rollover_amount: newRollover }).eq("id", 1);
    }

    return { 
      winningNumbers, 
      stats: { match5, match4, match3, totalEvaluated: activeSubscribersCount },
      jackpot: totalJackpotAvailable,
      isSimulation: isSim
    };
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 space-y-12">
      
      {/* ADMIN HEADER & LOG OUT */}
      <header className="max-w-6xl mx-auto border-b border-zinc-800 pb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-emerald-400 uppercase">Admin Golf Course</h1>
          <p className="text-zinc-500 font-medium">Platform control, analytics, and verification.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live System
          </div>
          <form action={signOut}>
            <button type="submit" className="text-sm px-4 py-1.5 bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 rounded-xl transition-all font-bold">
              Log Out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-10">
        
        {/* SECTION 1: REPORTS & ANALYTICS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <p className="text-zinc-500 text-sm font-bold uppercase">Active Subscribers</p>
            <p className="text-4xl font-black mt-2">{activeSubscribers || 0}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <p className="text-zinc-500 text-sm font-bold uppercase">Estimated Revenue</p>
            <p className="text-4xl font-black mt-2 text-white">₹{totalRevenue}</p>
          </div>
          <div className="bg-emerald-500 border border-emerald-400 p-6 rounded-2xl text-zinc-950 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <p className="text-emerald-900 text-sm font-bold uppercase">Current Prize Pool</p>
            <p className="text-4xl font-black mt-2">₹{currentPrizePool}</p>
          </div>
        </section>

        {/* SECTION 2: VERIFY WINNERS & PAYOUTS */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 bg-zinc-800/30 flex justify-between items-center">
            <h2 className="text-xl font-bold">Verification Queue</h2>
            <span className="bg-amber-500 text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">{pendingWins?.length || 0} Pending</span>
          </div>
          <div className="p-6">
            {pendingWins && pendingWins.length > 0 ? (
              <div className="space-y-4">
                {normalPendingWins.map((win) => (
                  <div key={win.id} className="flex flex-col md:flex-row justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800 gap-4">
                    <div>
                      <p className="font-bold text-lg">{win.profiles?.display_name || win.profiles?.full_name || "Platform User"}</p>
                      <p className="text-zinc-500 text-xs">{win.profiles?.email || "Email hidden"}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-zinc-500 uppercase font-bold">Prize</p>
                        <p className="text-emerald-400 font-black">₹{win.prize_amount}</p>
                    </div>
                    <div className="flex gap-3">
                      <a 
                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/winner_proofs/${win.proof_url}`} 
                        target="_blank" 
                        className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-lg font-bold transition-colors"
                      >
                        View Proof ↗
                      </a>
                      <form action={approvePayout}>
                        <input type="hidden" name="win_id" value={win.id} />
                        <button className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm px-4 py-2 rounded-lg font-bold transition-colors">
                            Approve & Pay
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-zinc-600 py-10 font-medium italic">No winners awaiting verification.</p>
            )}
          </div>
        </section>

        {/* SECTION 3: CONFIGURE & RUN DRAWS */}
        <DrawClient runDrawAlgorithm={runDrawAlgorithm} prizePool={currentPrizePool} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SECTION 4: MANAGE CHARITY LISTINGS */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                <h2 className="text-xl font-bold mb-6">Manage Charities</h2>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {charities?.map(c => (
                        <div key={c.id} className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                            <div>
                              <span className="font-bold block text-sm">{c.name}</span>
                              <span className="text-xs text-zinc-500 truncate max-w-[200px] block">{c.description}</span>
                            </div>
                            {/* DELETE CHARITY BUTTON */}
                            <form action={deleteCharity}>
                              <input type="hidden" name="id" value={c.id} />
                              <button type="submit" className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors text-xs font-bold uppercase">Delete</button>
                            </form>
                        </div>
                    ))}
                </div>
                <form action={addCharity} className="mt-6 space-y-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Add New Charity</p>
                    <input name="name" placeholder="Charity Name" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 outline-none focus:border-emerald-500" required />
                    <input name="desc" placeholder="Brief Description" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 outline-none focus:border-emerald-500" required />
                    <button className="w-full bg-white text-zinc-950 font-bold py-2 rounded-lg hover:bg-zinc-200 transition-all">Add to Directory</button>
                </form>
            </section>

            {/* SECTION 5: MANAGE USERS & SUBSCRIPTIONS */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                <h2 className="text-xl font-bold mb-6">User Directory</h2>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {normalUsers.map(u => {
                        // Find this user's subscription from the separate list
                        const userSub = allSubscriptions?.find(sub => sub.user_id === u.id);
                        const isActive = userSub?.status === 'active';
                        
                        return (
                            <div key={u.id} className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-sm">{u.display_name || "New User"}</p>
                                    <p className="text-[10px] text-zinc-500">{u.email}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                      {userSub?.status || 'NO SUBSCRIPTION'}
                                  </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>

        {/* SECTION 6: FULL WINNERS HISTORY */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-6">Full Winners History</h2>
          <div className="space-y-3">
            {allWinnings && allWinnings.length > 0 ? (
              normalWinnings.map(win => (
                <div key={win.id} className="flex flex-col md:flex-row justify-between items-center p-4 bg-zinc-950 border border-zinc-800 rounded-2xl gap-4">
                  <div>
                    <p className="font-bold text-white">{win.profiles?.display_name || win.profiles?.full_name || 'Unknown User'}</p>
                    <p className="text-zinc-500 text-xs">{new Date(win.draw_date).toLocaleDateString()} • Matched {win.match_count}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-400">₹{Number(win.prize_amount).toLocaleString()}</p>
                    <p className={`text-[10px] uppercase font-bold ${win.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{win.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-zinc-600 py-6 font-medium italic">No historical wins recorded yet.</p>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}