function normalizePK(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("92")) return d;
  if (d.startsWith("0")) return "92" + d.slice(1);
  // Bare 10-digit local (e.g. 3001234567) → prepend PK country code
  if (d.length === 10) return "92" + d;
  return d;
}

function formatPKR(n) {
  return `Rs. ${Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export function buildBookingWhatsAppMessage(booking, settings) {
  const remaining = Math.max(
    Number(booking.totalAmount || 0) - Number(booking.advancePaid || 0),
    0,
  );
  const businessName = settings?.businessName || "FUN FARMHOUSE";
  const prettyDate = booking.bookingDate
    ? new Date(booking.bookingDate + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";
  const lines = [
    `Assalam-o-Alaikum ${booking.customerName || "Sir/Madam"},`,
    "",
    `Your booking at *${booking.farmName || ""}* is confirmed.`,
    "",
    `📅 Date: ${prettyDate}`,
    `⏰ Slot: ${booking.slotTiming || booking.timeSlot || "—"}`,
    `👥 Guests: ${booking.guests || "—"}`,
    `🎉 Event: ${booking.eventType || "—"}`,
    "",
    `💰 Total: ${formatPKR(booking.totalAmount)}`,
    `✅ Advance Received: ${formatPKR(booking.advancePaid)}`,
    `💵 Remaining (at check-in): ${formatPKR(remaining)}`,
    "",
    `Reference: ${booking.bookingId}`,
    `— ${businessName}`,
  ];
  return lines.join("\n");
}

export function buildBookingWhatsAppUrl(booking, settings) {
  const phone = normalizePK(booking.phone);
  const text = encodeURIComponent(buildBookingWhatsAppMessage(booking, settings));
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}
