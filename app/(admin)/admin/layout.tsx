import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // THE BOUNCER: If you aren't logged in, or your email IS NOT admin@golf.com...
  // You get kicked back to the regular player dashboard!
  if (!user || user.email !== "admin@golf.com") {
    redirect("/dashboard");
  }

  // If you ARE the admin, you are allowed to see the page.
  return <div className="min-h-screen bg-zinc-950 text-white">{children}</div>;
}