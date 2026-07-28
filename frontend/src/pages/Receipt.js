import { useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Printer, Download, Share2, ChevronLeft } from "lucide-react";
import { useBookings } from "@/context/BookingContext";
import { useSettings } from "@/context/SettingsContext";
import { formatPKR, toNumber } from "@/utils/currency";
import { formatPrettyDate } from "@/utils/dateHelpers";
import { exportElementToPDF } from "@/utils/pdfExport";

export default function Receipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById } = useBookings();
  const { settings } = useSettings();
  const sheetRef = useRef(null);

  const booking = getById(id);

  const totals = useMemo(() => {
    if (!booking) return { total: 0, advance: 0, remaining: 0 };
    const total = toNumber(booking.totalAmount);
    const advance = toNumber(booking.advancePaid);
    return { total, advance, remaining: Math.max(total - advance, 0) };
  }, [booking]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-300">Booking not found.</p>
          <button
            onClick={() => navigate("/bookings")}
            className="mt-4 px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-sm"
            data-testid="receipt-not-found-back"
          >
            Back to bookings
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => window.print();

  const handlePDF = async () => {
    try {
      await exportElementToPDF(sheetRef.current, `FUN-FARMHOUSE-${booking.bookingId}.pdf`);
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error("PDF export failed");
      console.error(e);
    }
  };

  const handleShare = async () => {
    const shareText = `FUN FARMHOUSE Booking\n${booking.customerName} · ${booking.farmName}\n${formatPrettyDate(booking.bookingDate)} · ${booking.slotTiming || booking.timeSlot}\nTotal: ${formatPKR(totals.total)} · Advance: ${formatPKR(totals.advance)} · Remaining: ${formatPKR(totals.remaining)}\nRef: ${booking.bookingId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "FUN FARMHOUSE Booking", text: shareText });
      } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("Booking details copied to clipboard");
      } catch {
        toast.error("Share not supported");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] print-container">
      {/* Toolbar (hidden on print) */}
      <div className="no-print sticky top-0 z-30 bg-[#111827]/95 backdrop-blur border-b border-[#374151]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            data-testid="receipt-back-btn"
            className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              data-testid="receipt-print-btn"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#1F2937] hover:bg-[#374151] text-white text-sm border border-[#374151] transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={handlePDF}
              data-testid="receipt-pdf-btn"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-sm transition-colors"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button
              onClick={handleShare}
              data-testid="receipt-share-btn"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#1F2937] hover:bg-[#374151] text-white text-sm border border-[#374151] transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      </div>

      {/* Receipt sheet (WHITE - premium hotel style) */}
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div
          ref={sheetRef}
          className="receipt-sheet rounded-xl shadow-2xl print:shadow-none border border-[#E5E7EB] print:border-0"
          data-testid="receipt-sheet"
        >
          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="flex items-start justify-between gap-6 pb-6 border-b-2 border-[#064E3B]">
              <div className="flex items-center gap-4">
                {settings.logoDataUrl ? (
                  <img src={settings.logoDataUrl} alt="FUN FARMHOUSE" className="h-14 w-auto max-w-[200px] object-contain" data-testid="receipt-logo" />
                ) : (
                  <div>
                    <p className="font-heading font-extrabold text-3xl tracking-tight text-[#064E3B]" data-testid="receipt-brand-fallback">
                      FUN FARMHOUSE
                    </p>
                    <p className="text-[11px] uppercase tracking-widest text-[#059669] mt-0.5">Premium Farmhouse Stays</p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="font-heading text-xl md:text-2xl font-semibold text-[#064E3B]">Booking Confirmation</p>
                <p className="text-[11px] text-gray-500 mt-1 font-mono">Ref: {booking.bookingId}</p>
                <p className="text-[11px] text-gray-500">Issued: {new Date().toLocaleDateString("en-GB")}</p>
              </div>
            </div>

            {/* Farm name banner */}
            <div className="mt-6 flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-widest text-[#059669] font-medium">Reserved Farmhouse</p>
              <p className="text-xs text-gray-500">{booking.eventType || "Event"}</p>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#064E3B] mt-1 uppercase tracking-tight">
              {booking.farmName || "—"}
            </h2>

            {/* Sections */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="Guest Details">
                <Row label="Name" value={booking.customerName} />
                <Row label="Phone" value={booking.phone} />
                <Row label="Guests" value={booking.guests || "—"} />
                <Row label="Event" value={booking.eventType || "—"} />
              </Section>

              <Section title="Reservation">
                <Row label="Date" value={formatPrettyDate(booking.bookingDate)} />
                <Row label="Slot" value={booking.timeSlot || "—"} />
                <Row label="Timing" value={booking.slotTiming || "—"} />
                <Row label="Type" value={booking.isDoubleSlot ? "Custom / Double slot" : "Standard slot"} />
              </Section>
            </div>

            {/* Payment table */}
            <div className="mt-8">
              <p className="text-xs uppercase tracking-widest text-[#059669] font-medium">Payment Summary</p>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  <tr className="border-b border-[#E5E7EB]">
                    <td className="py-3 text-gray-700">Total Booking Amount</td>
                    <td className="py-3 text-right font-medium text-[#111827]">{formatPKR(totals.total)}</td>
                  </tr>
                  <tr className="border-b border-[#E5E7EB]">
                    <td className="py-3 text-gray-700">Advance Payment Received</td>
                    <td className="py-3 text-right font-medium text-[#111827]">{formatPKR(totals.advance)}</td>
                  </tr>
                  <tr className="bg-[#ECFDF5]">
                    <td className="py-3 px-3 text-[#064E3B] font-semibold rounded-l-md">Remaining Balance Payable</td>
                    <td className="py-3 px-3 text-right font-heading text-lg font-bold text-[#064E3B] rounded-r-md" data-testid="receipt-remaining">
                      {formatPKR(totals.remaining)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notes */}
            {(booking.notes || settings.defaultNote) && (
              <div className="mt-8">
                <p className="text-xs uppercase tracking-widest text-[#059669] font-medium">Notes</p>
                <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {booking.notes || settings.defaultNote}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-10 pt-5 border-t border-[#E5E7EB] flex flex-col md:flex-row md:items-end md:justify-between gap-3 text-xs text-gray-500">
              <div>
                {settings.address && <p>{settings.address}</p>}
                <p className="mt-1">
                  {settings.phone && <span>Phone: {settings.phone}</span>}
                  {settings.phone && settings.whatsapp && <span> · </span>}
                  {settings.whatsapp && <span>WhatsApp: {settings.whatsapp}</span>}
                </p>
              </div>
              <p className="font-heading text-[#064E3B] font-semibold">Thank you — see you soon at FUN FARMHOUSE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-[#059669] font-medium">{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-[#111827] font-medium text-right break-words">{value || "—"}</span>
    </div>
  );
}
