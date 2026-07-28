import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Sparkles, Wand2, Loader2, ArrowRight, ClipboardPaste } from "lucide-react";
import { extractBooking } from "@/services/aiService";
import { slotTimingFor } from "@/utils/slotEngine";
import { useBookings } from "@/context/BookingContext";

const EXAMPLE = `Ali booked Al Hadi Farm on 15 August. Evening slot. 12 guests. Birthday party. Total 18000. Advance 5000. Phone 03001234567.`;

export default function AIBooking() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const { createBooking } = useBookings();

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Please paste the customer message");
      return;
    }
    setLoading(true);
    setPreview(null);
    try {
      const { booking } = await extractBooking(text);
      if (!booking) {
        toast.error("Could not extract a booking from this message");
        setLoading(false);
        return;
      }
      // Enrich slot timing if missing
      const draft = {
        ...booking,
        slotTiming:
          booking.slotTiming ||
          slotTimingFor(booking.timeSlot, booking.customStartTime, booking.customEndTime),
      };
      setPreview(draft);
      toast.success("Booking extracted — please review");
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.detail || "AI extraction failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setText(t);
    } catch {
      toast.error("Clipboard access denied");
    }
  };

  const handleReview = () => {
    // Navigate to the edit form pre-filled
    navigate("/bookings/new", { state: { draft: preview } });
  };

  const handleQuickConfirm = () => {
    if (!preview) return;
    const result = createBooking(preview);
    if (!result.ok) {
      toast.error(`Slot conflict: ${result.conflict.farmName} already booked on ${result.conflict.bookingDate}`);
      return;
    }
    toast.success("Booking saved");
    navigate(`/receipt/${result.booking.bookingId}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="ai-booking-page">
      <div>
        <p className="text-sm text-emerald-400 font-medium tracking-wider uppercase flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Assistant
        </p>
        <h1 className="mt-1 font-heading text-3xl md:text-4xl font-semibold tracking-tight text-white">
          Paste customer booking details
        </h1>
        <p className="mt-2 text-gray-400 text-sm max-w-2xl">
          Paste the WhatsApp / SMS text from your customer. Our GPT-5.2 assistant will extract the booking automatically — you&apos;ll review before saving.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl bg-[#1F2937] border border-[#374151] p-4 md:p-6 ai-ring transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Customer message</label>
          <button
            type="button"
            onClick={handlePaste}
            data-testid="paste-btn"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-400 transition-colors"
          >
            <ClipboardPaste className="w-3.5 h-3.5" /> Paste from clipboard
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          data-testid="ai-textarea"
          className="w-full min-h-[280px] md:min-h-[340px] bg-[#111827] border border-[#374151] rounded-lg p-4 text-sm md:text-base leading-relaxed text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors resize-y"
        />

        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Tip: include name, farm, date, slot, guests, total, advance & phone.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            data-testid="generate-booking-btn"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium text-sm transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extracting…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Booking
              </>
            )}
          </button>
        </div>
      </motion.div>

      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-[#1F2937] border border-emerald-500/30 p-5 md:p-6"
          data-testid="ai-preview"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg text-white">Extracted booking preview</h2>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              REVIEW REQUIRED
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="Customer" value={preview.customerName} />
            <Field label="Phone" value={preview.phone} />
            <Field label="Farmhouse" value={preview.farmName} />
            <Field label="Date" value={preview.bookingDate} />
            <Field label="Slot" value={`${preview.timeSlot}${preview.slotTiming ? ` · ${preview.slotTiming}` : ""}`} />
            <Field label="Guests" value={preview.guests} />
            <Field label="Event" value={preview.eventType} />
            <Field label="Total" value={preview.totalAmount ? `Rs. ${preview.totalAmount}` : ""} />
            <Field label="Advance" value={preview.advancePaid ? `Rs. ${preview.advancePaid}` : ""} />
            <Field label="Remaining" value={preview.remainingPayment ? `Rs. ${preview.remainingPayment}` : ""} />
            {preview.notes && <Field label="Notes" value={preview.notes} full />}
          </div>
          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleReview}
              data-testid="review-edit-btn"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#111827] hover:bg-[#374151] text-white font-medium text-sm border border-[#374151] transition-colors"
            >
              Review & Edit
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleQuickConfirm}
              data-testid="confirm-save-btn"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors"
            >
              Confirm & Save
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Field({ label, value, full }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-[11px] uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-0.5 text-white break-words">{value || <span className="text-gray-500">—</span>}</p>
    </div>
  );
}
