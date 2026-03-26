import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>; 
}) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  // Server Action: Secure Password Update
  const updatePassword = async (formData: FormData) => {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentPassword = formData.get("current_password") as string;
    const newPassword = formData.get("new_password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    // 1. Check if new passwords match
    if (newPassword !== confirmPassword) {
      return redirect("/settings?error=New passwords do not match.");
    }

    // 2. Verify current password by attempting a background login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return redirect("/settings?error=Incorrect current password.");
    }

    // 3. Update to the new password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      return redirect(`/settings?error=${encodeURIComponent(updateError.message)}`);
    }

    return redirect("/settings?message=Password successfully updated!");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* NEW: Back Button */}
        <div className="pt-4">
          <Link href="/dashboard" className="text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-2 w-fit font-medium">
            <span>&larr;</span> Back to Dashboard
          </Link>
        </div>

        <header className="border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-zinc-400 mt-1">Manage your profile, security, and subscription.</p>
        </header>

        {/* Display Status Messages */}
        {resolvedParams?.message && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 rounded-xl font-medium">
            ✅ {resolvedParams.message}
          </div>
        )}
        {resolvedParams?.error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl font-medium">
            ❌ {resolvedParams.error}
          </div>
        )}

        {/* Locked Profile Information */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Email (Uneditable)</label>
              <input disabled value={user.email} className="w-full rounded-md px-4 py-3 bg-zinc-950/80 border border-zinc-800 text-zinc-500 cursor-not-allowed font-medium" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Display Name (Uneditable)</label>
              <input disabled value={profile?.display_name || "Not provided during signup"} className="w-full rounded-md px-4 py-3 bg-zinc-950/80 border border-zinc-800 text-zinc-500 cursor-not-allowed font-medium" />
            </div>
          </div>
        </div>

        {/* Secure Password Update Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Security</h2>
          <form action={updatePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Current Password</label>
              <input type="password" name="current_password" required placeholder="Verify your identity" className="w-full rounded-md px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 outline-none transition-all" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">New Password</label>
                <input type="password" name="new_password" minLength={6} required placeholder="At least 6 characters" className="w-full rounded-md px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Confirm New Password</label>
                <input type="password" name="confirm_password" minLength={6} required placeholder="Retype new password" className="w-full rounded-md px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 outline-none transition-all" />
              </div>
            </div>
            <button type="submit" className="bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-md px-6 py-3 transition-colors mt-2">
              Update Password
            </button>
          </form>
        </div>

        {/* Manage Billing Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h2 className="text-xl font-semibold mb-2 text-white relative z-10">Billing & Subscription</h2>
          <p className="text-zinc-400 mb-6 text-sm relative z-10 max-w-lg">
            Update your payment method, download invoices, switch plans, or cancel your subscription securely via the Stripe Customer Portal.
          </p>
          <form action="/api/billing" method="POST" className="relative z-10">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 py-3 transition-colors flex items-center gap-2">
              Manage Billing in Stripe ↗
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}