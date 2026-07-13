import { notifyConsultingBookingPaid } from "@/app/actions/consulting";
import { getAdminConsultingSettings, markConsultingBookingPaid } from "@/lib/d1";
import { getStripeClient } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const consulting = await getAdminConsultingSettings();
  if (!consulting.stripeSecretKey || !consulting.stripeWebhookSecret) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripeClient(consulting.stripeSecretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, consulting.stripeWebhookSecret);
  } catch (error) {
    console.warn(
      "Stripe webhook signature verification failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid" && session.id) {
      const booking = await markConsultingBookingPaid(session.id);
      if (booking) {
        await notifyConsultingBookingPaid(booking);
      }
    }
  }

  return NextResponse.json({ received: true });
}
