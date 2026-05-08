import Link from "next/link";
import { getOrderConfirmation } from "@/checkout/actions";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

function labelPaymentStatus(s: string): string {
  const key = s as keyof typeof en.paymentStatus;
  return en.paymentStatus[key] ?? s;
}

function labelOrderStatus(s: string): string {
  const key = s as keyof typeof en.orderStatus;
  return en.orderStatus[key] ?? s;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string; t?: string };
}) {
  const snap = await getOrderConfirmation(
    searchParams.orderId,
    searchParams.t,
  );

  if (!snap) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">{en.checkoutSuccess.thanks}</h1>
        <p className="mt-3 text-sm text-black/65 dark:text-white/65">
          {en.checkoutSuccess.generic}
        </p>
        <Link className="mt-8 inline-block underline" href="/products">
          {en.checkoutSuccess.continue}
        </Link>
      </main>
    );
  }

  const itemLabel =
    snap.itemCount === 1 ? en.order.piece : en.order.pieces;

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold">{en.checkoutSuccess.confirmedTitle}</h1>
      <p className="mt-2 text-sm text-black/60 dark:text-white/60">
        {en.checkoutSuccess.orderRef} #{snap.id.slice(-8)} · {snap.itemCount}{" "}
        {itemLabel}
      </p>
      <dl className="mt-8 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-black/60 dark:text-white/60">{en.checkoutSuccess.total}</dt>
          <dd className="font-semibold tabular-nums">${snap.total.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-black/60 dark:text-white/60">
            {en.checkoutSuccess.paymentMethod}
          </dt>
          <dd>
            {snap.paymentMethod === "stripe"
              ? en.checkoutSuccess.paymentCard
              : en.checkoutSuccess.paymentCod}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-black/60 dark:text-white/60">
            {en.checkoutSuccess.paymentStatus}
          </dt>
          <dd>{labelPaymentStatus(snap.paymentStatus)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-black/60 dark:text-white/60">
            {en.checkoutSuccess.orderStatus}
          </dt>
          <dd>{labelOrderStatus(snap.status)}</dd>
        </div>
      </dl>
      <p className="mt-8 text-xs text-black/50 dark:text-white/50">
        {en.checkoutSuccess.receiptNote}
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link className="underline" href="/products">
          {en.checkoutSuccess.continue}
        </Link>
        <Link className="underline" href="/cart">
          {en.checkoutSuccess.cart}
        </Link>
      </div>
    </main>
  );
}
