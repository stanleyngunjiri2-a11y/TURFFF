"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PaymentForm({
  bookingId,
}: {
  bookingId: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!reference.trim()) {
      setError("Enter your M-Pesa transaction reference.");
      return;
    }

    setLoading(true);

    const { error: rpcError } = await supabase.rpc(
      "submit_booking_payment",
      {
        p_booking_id: bookingId,
        p_payment_reference: reference.trim().toUpperCase(),
        p_payment_note: note.trim(),
      }
    );

    if (rpcError) {
      setError(rpcError.message || "Could not submit payment reference.");
      setLoading(false);
      return;
    }

    router.refresh();
    setReference("");
    setNote("");
    setLoading(false);
  }

  return (
    <form onSubmit={submitPayment} className="mt-4 space-y-3">
      <label className="block text-sm font-semibold text-gray-800">
        M-Pesa transaction reference
        <input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="e.g. QGH123ABC"
          maxLength={30}
          required
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
        />
      </label>

      <label className="block text-sm font-semibold text-gray-800">
        Payment note (optional)
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Any additional payment details"
          maxLength={300}
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit payment reference"}
      </button>
    </form>
  );
}
