import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Save, Trash2, FileText } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useBookings } from "@/context/BookingContext";
import { SLOT_PRESETS, toAmPm, to24 } from "@/utils/slotEngine";
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
    customStartTime: to24(draft?.customStartTime || ""),
    customEndTime: to24(draft?.customEndTime || ""),
    guests: draft?.guests || "",
    eventType: draft?.eventType || "Pool Party",
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
  const seed = existing || initialDraft;
  const [adjustTime, setAdjustTime] = useState(
    !!(seed && seed.isDoubleSlot && seed.timeSlot && seed.timeSlot !== "Custom"),
  );

  // Recompute slotTiming + isDoubleSlot whenever inputs that drive them change
  useEffect(() => {
    setForm((prev) => {
      let timing = "";
      let isDouble = false;
      if (prev.timeSlot === "Custom") {
        timing =
          prev.customStartTime && prev.customEndTime
            ? `${toAmPm(prev.customStartTime)} - ${toAmPm(prev.customEndTime)}`
            : "";
        isDouble = true;
      } else if (adjustTime) {
        timing =
          prev.customStartTime && prev.customEndTime
            ? `${toAmPm(prev.customStartTime)} - ${toAmPm(prev.customEndTime)}`
            : "";
        isDouble = true;
      } else {
        timing = SLOT_PRESETS[prev.timeSlot]?.label || "";
        isDouble = false;
      }
      if (prev.slotTiming === timing && prev.isDoubleSlot === isDouble) return prev;
      return { ...prev, slotTiming: timing, isDoubleSlot: isDouble };
    });
  }, [form.timeSlot, form.customStartTime, form.customEndTime, adjustTime]);

  const handleToggleAdjust = (checked) => {
    setAdjustTime(checked);
    if (checked && form.timeSlot !== "Custom") {
      const p = SLOT_PRESETS[form.timeSlot];
      if (p) setForm((f) => ({ ...f, customStartTime: p.start, customEndTime: p.end }));
    } else if (!checked && form.timeSlot !== "Custom") {
      setForm((f) => ({ ...f, customStartTime: "", customEndTime: "" }));
    }
  };

  const handleSlotChange = (v) => {
    setForm((f) => {
      const next = { ...f, timeSlot: v };
      if (v === "Custom") return next;
      // Switching to a preset — if adjust is on, seed with preset defaults; else clear
      if (adjustTime) {
        const p = SLOT_PRESETS[v];
        if (p) return { ...next, customStartTime: p.start, customEndTime: p.end };
      } else {
        return { ...next, customStartTime: "", customEndTime: "" };
      }
      return next;
    });
  };

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
            onChange={(e) => handleSlotChange(e.target.value)}
            data-testid="select-time-slot"
          >
            {Object.entries(SLOT_PRESETS).map(([k, v]) => (
              <option key={k} value={k}>
                {`${k} (${v.label})`}
              </option>
            ))}
            <option value="Custom">Custom / Double Slot</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Slot Timing</label>
          <input className={`${inputCls} opacity-70 cursor-not-allowed`} value={form.slotTiming} readOnly data-testid="input-slot-timing" />
        </div>

        {form.timeSlot !== "Custom" && (
          <div className="md:col-span-2 flex items-center gap-3 px-4 py-3 rounded-md bg-[#111827] border border-[#374151]">
            <input
              type="checkbox"
              id="adjust-time-checkbox"
              checked={adjustTime}
              onChange={(e) => handleToggleAdjust(e.target.checked)}
              data-testid="adjust-time-checkbox"
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
            <label htmlFor="adjust-time-checkbox" className="text-sm text-gray-300 cursor-pointer flex-1">
              Adjust <span className="text-emerald-400 font-medium">{form.timeSlot}</span> slot time manually
              <span className="block text-xs text-gray-500 mt-0.5">
                Turn on if the customer wants a shorter or shifted window (e.g. only 4 hours instead of the full 6).
              </span>
            </label>
          </div>
        )}

        {(form.timeSlot === "Custom" || adjustTime) && (
          <>
            <div>
              <label className={labelCls}>Start Time</label>
              <input
                type="time"
                className={inputCls}
                value={form.customStartTime}
                onChange={(e) => set("customStartTime", e.target.value)}
                data-testid="input-custom-start"
              />
              {form.customStartTime && (
                <p className="mt-1 text-[11px] text-gray-500 font-mono">{toAmPm(form.customStartTime)}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>End Time</label>
              <input
                type="time"
                className={inputCls}
                value={form.customEndTime}
                onChange={(e) => set("customEndTime", e.target.value)}
                data-testid="input-custom-end"
              />
              {form.customEndTime && (
                <p className="mt-1 text-[11px] text-gray-500 font-mono">{toAmPm(form.customEndTime)}</p>
              )}
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
