import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2026-02-25.clover" });

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find their Stripe Customer ID in our database
    const { data: sub } = await supabase.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).single();
    
    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: "No active Stripe billing found." }, { status: 400 });
    }

    // Generate the secure portal link
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings`,
    });

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}