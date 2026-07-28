import { useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Printer, Download, Share2, ChevronLeft, MessageCircle, Phone } from "lucide-react";
import { useBookings } from "@/context/BookingContext";
import { useSettings } from "@/context/SettingsContext";
import { formatPKR, toNumber } from "@/utils/currency";
import { formatPrettyDate } from "@/utils/dateHelpers";
import { exportElementToPDF } from "@/utils/pdfExport";
import { buildBookingWhatsAppUrl } from "@/utils/whatsapp";

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
    const shareText = `${booking.farmName} Booking\n${booking.customerName} · ${formatPrettyDate(booking.bookingDate)} · ${booking.slotTiming || booking.timeSlot}\nTotal: ${formatPKR(totals.total)} · Advance: ${formatPKR(totals.advance)} · Remaining: ${formatPKR(totals.remaining)}\nRef: ${booking.bookingId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${booking.farmName} Booking`, text: shareText });
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

  const handleWhatsApp = () => {
    const url = buildBookingWhatsAppUrl(booking, settings);
    window.open(url, "_blank", "noopener,noreferrer");
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
              onClick={handleWhatsApp}
              data-testid="receipt-whatsapp-btn"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
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
            {/* Header — Logo (or FUN FARMHOUSE placeholder) + Ref/Issued */}
            <div className="flex items-start justify-between gap-6 pb-5 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-4 min-w-0">
                {settings.logoDataUrl ? (
                  <img
                    src={settings.logoDataUrl}
                    alt="FUN FARMHOUSE"
                    className="h-16 md:h-20 w-auto max-w-[220px] object-contain"
                    data-testid="receipt-logo"
                  />
                ) : (
                  <div className="flex items-center gap-3" data-testid="receipt-brand-fallback">
                    <div className="w-14 h-14 rounded-full bg-[#064E3B] text-white flex items-center justify-center font-heading font-bold text-lg">
                      FF
                    </div>
                    <div>
                      <p className="font-heading font-extrabold text-xl md:text-2xl text-[#064E3B] tracking-tight leading-none">
                        FUN FARMHOUSE
                      </p>
                      {settings.tagline && (
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mt-1">
                          {settings.tagline}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-mono text-gray-500">
                  Ref: <span className="text-[#064E3B] font-semibold">{booking.bookingId}</span>
                </p>
                <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                  Issued: {new Date().toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>

            {/* Title */}
            <div className="mt-8 text-center">
              <h1
                className="font-heading text-2xl md:text-3xl font-bold text-[#064E3B] tracking-tight uppercase"
                data-testid="receipt-title"
              >
                Booking Confirmation
              </h1>
              <p className="mt-3 text-sm md:text-base text-gray-600">
                Farmhouse:{" "}
                <span
                  className="font-heading font-extrabold uppercase text-[#064E3B] tracking-tight"
                  data-testid="receipt-farm-name"
                >
                  {booking.farmName || "—"}
                </span>
              </p>
              {booking.eventType && (
                <p className="mt-2 text-[11px] uppercase tracking-widest text-gray-500 font-medium">
                  {booking.eventType}
                </p>
              )}
            </div>
            <div className="mt-6 border-b border-[#E5E7EB]" />

            {/* CUSTOMER DETAILS */}
            <div className="mt-7">
              <p className="font-heading text-sm md:text-base font-bold uppercase tracking-widest text-[#064E3B]">
                Customer Details
              </p>
              <div className="mt-1 border-b border-[#E5E7EB]" />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <RowKV label="Customer Name" value={booking.customerName} />
                <RowKV label="Phone Number" value={booking.phone} />
                <RowKV label="Guests" value={booking.guests || "—"} />
                <RowKV label="Event Type" value={booking.eventType || "—"} />
              </div>
            </div>

            {/* BOOKING DETAILS */}
            <div className="mt-7">
              <p className="font-heading text-sm md:text-base font-bold uppercase tracking-widest text-[#064E3B]">
                Booking Details
              </p>
              <div className="mt-1 border-b border-[#E5E7EB]" />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <RowKV label="Farmhouse Name" value={booking.farmName} />
                <RowKV label="Booking Date" value={formatPrettyDate(booking.bookingDate)} />
                <RowKV label="Time Slot" value={booking.timeSlot || "—"} />
                <RowKV label="Slot Timing" value={booking.slotTiming || "—"} />
              </div>
            </div>

            {/* PAYMENT SUMMARY */}
            <div className="mt-7">
              <p className="font-heading text-sm md:text-base font-bold uppercase tracking-widest text-[#064E3B]">
                Payment Summary
              </p>
              <div className="mt-1 border-b border-[#E5E7EB]" />
              <table className="mt-4 w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#064E3B] text-white">
                    <th className="py-2.5 px-4 text-left font-heading font-bold tracking-wider uppercase text-xs">
                      Description
                    </th>
                    <th className="py-2.5 px-4 text-right font-heading font-bold tracking-wider uppercase text-xs">
                      Amount (PKR)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#E5E7EB]">
                    <td className="py-3 px-4 text-gray-700">Total Booking Amount</td>
                    <td className="py-3 px-4 text-right font-semibold text-[#111827]">
                      {totals.total.toLocaleString("en-PK")}
                    </td>
                  </tr>
                  <tr className="border-b border-[#E5E7EB]">
                    <td className="py-3 px-4 text-gray-700">Advance Payment Received</td>
                    <td className="py-3 px-4 text-right font-semibold text-[#111827]">
                      {totals.advance.toLocaleString("en-PK")}
                    </td>
                  </tr>
                  <tr className="bg-[#FEF2F2]">
                    <td className="py-3 px-4 font-heading font-bold uppercase text-[#B91C1C] text-sm">
                      Remaining Balance Payable (At Check-in)
                    </td>
                    <td
                      className="py-3 px-4 text-right font-heading font-extrabold text-lg text-[#B91C1C]"
                      data-testid="receipt-remaining"
                    >
                      {totals.remaining.toLocaleString("en-PK")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Note */}
            {(booking.notes || settings.defaultNote) && (
              <div className="mt-7 rounded-md bg-[#FEF9C3] border border-[#FDE68A] px-4 py-3 text-sm text-[#713F12]">
                <span className="font-heading font-bold">Note: </span>
                <span className="whitespace-pre-wrap">{booking.notes || settings.defaultNote}</span>
              </div>
            )}

            {/* Footer contact strip — phone & WhatsApp only (no address) */}
            {(settings.phone || settings.whatsapp) && (
              <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-center gap-x-6 gap-y-2 text-xs text-gray-600">
                {settings.phone && (
                  <span className="inline-flex items-center gap-1.5" data-testid="receipt-footer-phone">
                    <Phone className="w-3.5 h-3.5 text-[#064E3B]" />
                    {settings.phone}
                  </span>
                )}
                {settings.whatsapp && (
                  <span className="inline-flex items-center gap-1.5" data-testid="receipt-footer-whatsapp">
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    WhatsApp:{" "}
                    <span className="font-semibold text-[#064E3B]">{settings.whatsapp}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RowKV({ label, value, mono = false }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[13px] font-heading font-bold text-[#111827] shrink-0 min-w-[110px]">
        {label}:
      </span>
      <span className={`text-[13px] text-gray-700 break-words ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}
