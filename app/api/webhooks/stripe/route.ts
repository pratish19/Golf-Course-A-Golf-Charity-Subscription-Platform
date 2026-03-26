import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-02-25.clover",
});

// We use the Service Role key to bypass Row Level Security for background updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (error: any) {
    // 👇 ADD THIS LINE TO CATCH THE EXACT ISSUE 👇
    console.error("🚨 STRIPE WEBHOOK ERROR:", error.message); 
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  // Handle successful checkout sessions
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const subscriptionId = session.subscription as string;

    if (userId && subscriptionId) {
      // 1. Fetch the actual subscription details from Stripe
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // 1. Get the timestamp safely (falling back to "now + 30 days" if Stripe is silent)
const timestamp = (subscription as any)?.current_period_end || (Math.floor(Date.now() / 1000) + 2592000);

// 2. Convert to ISO string safely
const periodEnd = new Date(timestamp * 1000).toISOString();

      const planType = session.amount_total === 5000 ? "monthly" : "yearly";

      await supabaseAdmin.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId,
        status: "active",
        plan_type: planType,
        current_period_end: periodEnd, // This is now the 100% accurate date from Stripe
      }, { onConflict: 'user_id' });
    }
  }

  return NextResponse.json({ received: true });
}