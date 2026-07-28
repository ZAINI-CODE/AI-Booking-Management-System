import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { LS_KEYS, loadLS, saveLS } from "@/utils/localStorage";
import { findConflict } from "@/utils/slotEngine";

const BookingContext = createContext(null);

function newId() {
  return "BK-" + Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString(36).slice(-3).toUpperCase();
}

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState(() => loadLS(LS_KEYS.bookings, []));

  useEffect(() => {
    saveLS(LS_KEYS.bookings, bookings);
  }, [bookings]);

  const createBooking = useCallback(
    (draft) => {
      const conflict = findConflict(draft, bookings);
      if (conflict) return { ok: false, conflict };
      const booking = {
        ...draft,
        bookingId: draft.bookingId || newId(),
        createdAt: new Date().toISOString(),
      };
      setBookings((prev) => [booking, ...prev]);
      return { ok: true, booking };
    },
    [bookings],
  );

  const updateBooking = useCallback(
    (id, patch) => {
      const candidate = { ...(bookings.find((b) => b.bookingId === id) || {}), ...patch, bookingId: id };
      const conflict = findConflict(candidate, bookings);
      if (conflict) return { ok: false, conflict };
      setBookings((prev) => prev.map((b) => (b.bookingId === id ? candidate : b)));
      return { ok: true, booking: candidate };
    },
    [bookings],
  );

  const deleteBooking = useCallback((id) => {
    setBookings((prev) => prev.filter((b) => b.bookingId !== id));
  }, []);

  const getById = useCallback((id) => bookings.find((b) => b.bookingId === id) || null, [bookings]);

  const clearAll = useCallback(() => setBookings([]), []);

  const restoreAll = useCallback((list) => {
    if (Array.isArray(list)) setBookings(list);
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    let total = 0, todays = 0, upcoming = 0, revenue = 0, pending = 0;
    for (const b of bookings) {
      total += 1;
      const amt = Number(b.totalAmount || 0);
      const adv = Number(b.advancePaid || 0);
      revenue += amt;
      pending += Math.max(amt - adv, 0);
      if (b.bookingDate === today) todays += 1;
      if (b.bookingDate && b.bookingDate >= today && b.bookingDate <= in7) upcoming += 1;
    }
    return { total, todays, upcoming, revenue, pending };
  }, [bookings]);

  const value = { bookings, stats, createBooking, updateBooking, deleteBooking, getById, clearAll, restoreAll };
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBookings must be used inside BookingProvider");
  return ctx;
}
