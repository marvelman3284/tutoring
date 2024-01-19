import { NextResponse } from "next/server";
import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event | null = null;
  try {
    // TODO: FIX
    event = stripe.webhooks.constructEvent(payload, signature!, webhookSecret);
    const req = JSON.parse(payload)["data"]["object"];
    switch (event?.type) {
      case "checkout.session.completed":
        const description = req["metadata"]["description"];

        const tutor = req["metadata"]["tutor"];
        const date = req["metadata"]["date"];
        const time = req["metadata"]["time"];
        const subject = req["metadata"]["subject"];

        const email = req["receipt_email"];

        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("Access-Control-Request-Headers", "*");
        headers.append("api-key", process.env.MONGO_API_KEY || "");

        const body = {
          collection: process.env.MONGO_CLIENT_COLLECTION,
          database: process.env.MONGO_DATABASE,
          dataSource: process.env.MONGO_DATA_SOURCE,
          filter: {
            email: email,
          },
          update: {
            $push: {
              purchases: {
                $push: {
                  $each: [tutor, subject, date, time, description],
                },
                $position: 0,
              },
            },
          },
          upsert: true,
        };

        const res = await fetch(process.env.MONGO_URI + "/action/updateOne", {
          method: "POST",
          headers: headers,
          body: JSON.stringify(body),
        });

        const data = await res.json();

        const { searchParams } = new URL(req.url);
        searchParams.set("user", email);
        return NextResponse.json(data, { status: res.status });
      default:
        return NextResponse.json({}, { status: 200 });
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  }
  return NextResponse.json({ received: true });
}

export const runtime = "edge";
