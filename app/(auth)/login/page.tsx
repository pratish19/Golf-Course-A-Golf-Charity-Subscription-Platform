import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. SMART ROUTING ON PAGE LOAD
  if (user) {
    if (user.email === "admin@golf.com") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  // --- SERVER ACTIONS FOR AUTH ---
  const signIn = async (formData: FormData) => {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return redirect("/login?message=Invalid login credentials");
    
    // 2. SMART ROUTING ON SIGN IN
    if (email === "admin@golf.com") {
      return redirect("/admin");
    }
    return redirect("/dashboard");
  };

 const signUp = async (formData: FormData) => {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    
    // Security Check: Block "Admin" impersonation
    if (name.trim().toLowerCase().includes("admin")) {
      return redirect("/login?message=The name 'Admin' is reserved. Please choose a different name.");
    }

    const supabase = await createClient();

    // 1. Create the Auth User (We added 'data' here to grab the user ID)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    
    if (error) return redirect("/login?message=Could not create account");
    
    // 2. EXPLICIT FIX: Force the name into the public profiles table!
    if (data.user) {
      await supabase.from("profiles").update({ display_name: name }).eq("id", data.user.id);
    }

    // 3. Smart Routing
    if (email === "admin@golf.com") {
      return redirect("/admin");
    }
    return redirect("/dashboard");
  };

  // --- UI RENDER ---
  // ... (keep the rest of your UI code exactly the same)

  // --- UI RENDER ---
  return (
    // The bg-zinc-950 here forces the dark background for the whole screen
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 selection:bg-emerald-500/30">
      <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 sm:p-10 rounded-3xl border border-zinc-800 shadow-2xl">
        
        <div className="text-center">
          <h2 className="text-3xl font-black text-white tracking-tight">Golf Course</h2>
          <p className="text-400 mt-2 text-amber-200 text-sm font-medium">
            A Golf Charity Subscription Platform
          </p>
          <p className="text-zinc-400 mt-2 text-sm font-medium">
            Sign in or create an account.
          </p>
        </div>

        {/* Display error messages if login fails */}
        {params?.message && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-bold">
            {params.message}
          </div>
        )}

        <form className="mt-8 space-y-6">
          <div className="space-y-5">
            {/* Full Name Field (Only used for Sign Up) */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
                Full Name <span className="text-zinc-600 lowercase tracking-normal font-normal">(For new accounts)</span>
              </label>
              <input 
                type="text" 
                name="name"
                placeholder="e.g. Tiger Woods"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
                Email Address
              </label>
              <input 
                type="email" 
                name="email"
                required
                placeholder="you@golf.com"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
                Password
              </label>
              <input 
                type="password" 
                name="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            {/* Sign In Button */}
            <button 
              formAction={signIn}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 rounded-xl transition-all active:scale-[0.98]"
            >
              Sign In
            </button>
            
            {/* Create Account Button */}
            <button 
              formAction={signUp}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition-all"
            >
              Create Account
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}