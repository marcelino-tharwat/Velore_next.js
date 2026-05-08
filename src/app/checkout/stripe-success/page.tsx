import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { StripePaymentPoll } from "@/components/stripe-payment-poll";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export default async function StripeSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sid = searchParams.session_id?.trim();
  if (!sid) {
    redirect("/checkout");
  }

  await connectDB();
  const order = await Order.findOne({ stripeCheckoutSessionId: sid })
    .select("_id confirmationToken")
    .lean();

  if (order) {
    redirect(
      `/checkout/success?orderId=${order._id.toString()}&t=${encodeURIComponent(order.confirmationToken ?? "")}`,
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {en.checkout.stripePaymentSuccessful}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {en.checkout.stripeProcessingBody}
      </p>
      <StripePaymentPoll sessionId={sid} />
      <Link
        href="/products"
        className="mt-10 inline-block text-sm font-medium text-foreground underline underline-offset-4"
      >
        {en.checkoutSuccess.continue}
      </Link>
    </main>
  );
}
