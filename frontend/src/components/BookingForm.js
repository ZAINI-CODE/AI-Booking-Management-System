import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Save, Trash2, FileText } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useBookings } from "@/context/BookingContext";
import { SLOT_PRESETS, slotTimingFor } from "@/utils/slotEngine";
import { toNumber } from "@/utils/currency";
import { todayISO } from "@/utils/dateHelpers";

const EVENT_TYPES = ["Birthday", "Wedding", "Corporate", "Family Gathering", "Anniversary", "Other"];

function initFromDraft(draft) {
  return {
    bookingId: draft?.bookingId || "",
    customerName: draft?.customerName || "",
    phone: draft?.phone || "",
    farmName: draft?.farmName || "",
    bookingDate: draft?.bookingDate || todayISO(),
    timeSlot: draft?.timeSlot || "Morning",
    slotTiming: draft?.slotTiming || "",
    isDoubleSlot: !!draft?.isDoubleSlot,
    customStartTime: draft?.customStartTime || "",
    customEndTime: draft?.customEndTime || "",
    guests: draft?.guests || "",
    eventType: draft?.eventType || "Birthday",
    totalAmount: draft?.totalAmount || "",
    advancePaid: draft?.advancePaid || "",
    remainingPayment: draft?.remainingPayment || "",
    notes: draft?.notes || "",
  };
}

export default function BookingForm({ existing, initialDraft, onSaved }) {
  const navigate = useNavigate();
  const { settings, addFarm } = useSettings();
  const { createBooking, updateBooking, deleteBooking } = useBookings();

  const [form, setForm] = useState(() => initFromDraft(existing || initialDraft));
  const [saving, setSaving] = useState(false);

  // Sync slot timing when slot changes
  useEffect(() => {
    if (form.timeSlot !== "Custom") {
      const timing = slotTimingFor(form.timeSlot);
      setForm((f) => ({ ...f, slotTiming: timing, isDoubleSlot: false, customStartTime: "", customEndTime: "" }));
    } else {
      const timing = slotTimingFor("Custom", form.customStartTime, form.customEndTime);
      setForm((f) => ({ ...f, slotTiming: timing, isDoubleSlot: true }));
    }
  }, [form.timeSlot]);

  useEffect(() => {
    if (form.timeSlot === "Custom") {
      const timing = slotTimingFor("Custom", form.customStartTime, form.customEndTime);
      setForm((f) => ({ ...f, slotTiming: timing }));
    }
  }, [form.customStartTime, form.customEndTime]);

  const remaining = useMemo(() => {
    const t = toNumber(form.totalAmount);
    const a = toNumber(form.advancePaid);
    return Math.max(t - a, 0);
  }, [form.totalAmount, form.advancePaid]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.customerName.trim()) return "Customer name is required";
    if (!form.phone.trim()) return "Phone number is required";
    if (!form.farmName.trim()) return "Farmhouse is required";
    if (!form.bookingDate) return "Booking date is required";
    if (form.timeSlot === "Custom" && (!form.customStartTime || !form.customEndTime))
      return "Custom start & end time are required";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      remainingPayment: String(remaining),
    };
    // Ensure the farm is tracked
    addFarm(form.farmName.trim());

    let result;
    if (existing?.bookingId) {
      result = updateBooking(existing.bookingId, payload);
    } else {
      result = createBooking(payload);
    }
    setSaving(false);

    if (!result.ok) {
      const c = result.conflict;
      toast.error(`Slot conflict: ${c.farmName} is already booked ${c.slotTiming || c.timeSlot} on ${c.bookingDate}`);
      return;
    }
    toast.success(existing ? "Booking updated" : "Booking created");
    if (onSaved) onSaved(result.booking);
    else navigate(`/receipt/${result.booking.bookingId}`);
  };

  const handleDelete = () => {
    if (!existing?.bookingId) return;
    if (!window.confirm("Delete this booking? This cannot be undone.")) return;
    deleteBooking(existing.bookingId);
    toast.success("Booking deleted");
    navigate("/bookings");
  };

  const inputCls =
    "w-full bg-[#111827] border border-[#374151] rounded-md px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors";
  const labelCls = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Customer Name</label>
          <input
            className={inputCls}
            value={form.customerName}
            onChange={(e) => set("customerName", e.target.value)}
            data-testid="input-customer-name"
            placeholder="e.g. Ali Raza"
          />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input
            className={inputCls}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            data-testid="input-phone"
            placeholder="03001234567"
          />
        </div>

        <div>
          <label className={labelCls}>Farmhouse</label>
          <input
            list="farms-list"
            className={inputCls}
            value={form.farmName}
            onChange={(e) => set("farmName", e.target.value)}
            data-testid="input-farm-name"
            placeholder="Al Hadi Farm"
          />
          <datalist id="farms-list">
            {settings.farms.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelCls}>Booking Date</label>
          <input
            type="date"
            className={inputCls}
            value={form.bookingDate}
            onChange={(e) => set("bookingDate", e.target.value)}
            data-testid="input-booking-date"
          />
        </div>

        <div>
          <label className={labelCls}>Time Slot</label>
          <select
            className={inputCls}
            value={form.timeSlot}
            onChange={(e) => set("timeSlot", e.target.value)}
            data-testid="select-time-slot"
          >
            {Object.entries(SLOT_PRESETS).map(([k, v]) => (
              <option key={k} value={k}>
                {k} ({v.label})
              </option>
            ))}
            <option value="Custom">Custom / Double Slot</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Slot Timing</label>
          <input className={`${inputCls} opacity-70 cursor-not-allowed`} value={form.slotTiming} readOnly data-testid="input-slot-timing" />
        </div>

        {form.timeSlot === "Custom" && (
          <>
            <div>
              <label className={labelCls}>Custom Start (e.g. 10:00 AM)</label>
              <input
                className={inputCls}
                value={form.customStartTime}
                onChange={(e) => set("customStartTime", e.target.value)}
                placeholder="10:00 AM"
                data-testid="input-custom-start"
              />
            </div>
            <div>
              <label className={labelCls}>Custom End (e.g. 12:00 PM)</label>
              <input
                className={inputCls}
                value={form.customEndTime}
                onChange={(e) => set("customEndTime", e.target.value)}
                placeholder="12:00 PM"
                data-testid="input-custom-end"
              />
            </div>
          </>
        )}

        <div>
          <label className={labelCls}>Guests</label>
          <input
            type="number"
            className={inputCls}
            value={form.guests}
            onChange={(e) => set("guests", e.target.value)}
            data-testid="input-guests"
            placeholder="12"
          />
        </div>
        <div>
          <label className={labelCls}>Event Type</label>
          <select
            className={inputCls}
            value={form.eventType}
            onChange={(e) => set("eventType", e.target.value)}
            data-testid="select-event-type"
          >
            {EVENT_TYPES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Total Amount (Rs.)</label>
          <input
            type="number"
            className={inputCls}
            value={form.totalAmount}
            onChange={(e) => set("totalAmount", e.target.value)}
            data-testid="input-total-amount"
            placeholder="18000"
          />
        </div>
        <div>
          <label className={labelCls}>Advance Paid (Rs.)</label>
          <input
            type="number"
            className={inputCls}
            value={form.advancePaid}
            onChange={(e) => set("advancePaid", e.target.value)}
            data-testid="input-advance-paid"
            placeholder="5000"
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Remaining Balance (auto)</label>
          <input className={`${inputCls} opacity-70 cursor-not-allowed`} value={`Rs. ${remaining}`} readOnly data-testid="input-remaining" />
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Notes</label>
          <textarea
            className={`${inputCls} min-h-[90px]`}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            data-testid="input-notes"
            placeholder="Cake at 8pm; extra parking required..."
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            data-testid="save-booking-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-medium text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            {existing ? "Update Booking" : "Save Booking"}
          </button>
          {existing?.bookingId && (
            <button
              onClick={() => navigate(`/receipt/${existing.bookingId}`)}
              data-testid="view-receipt-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#1F2937] hover:bg-[#374151] text-white font-medium text-sm border border-[#374151] transition-colors"
            >
              <FileText className="w-4 h-4" />
              View Receipt
            </button>
          )}
        </div>
        {existing?.bookingId && (
          <button
            onClick={handleDelete}
            data-testid="delete-booking-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-transparent hover:bg-rose-500/10 text-rose-400 font-medium text-sm border border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
