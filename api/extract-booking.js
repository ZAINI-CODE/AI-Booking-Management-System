// Vercel Serverless Function: /api/extract-booking
// This runs on Vercel (Node.js runtime). It calls OpenAI directly and returns extracted JSON.
// The frontend in this repo uses the FastAPI backend for the preview environment,
// but this file lets you deploy the SAME app to Vercel and get the same feature.

const SYSTEM_PROMPT = `You are a booking extraction assistant for FUN FARMHOUSE.

Extract booking details from the customer's message.
Return ONLY valid JSON. Never return markdown. Never explain. No code fences.

Return an object with EXACTLY these keys:
{
  "customerName": "",
  "phone": "",
  "farmName": "",
  "bookingDate": "",
  "timeSlot": "",
  "slotTiming": "",
  "isDoubleSlot": false,
  "customStartTime": "",
  "customEndTime": "",
  "guests": "",
  "eventType": "",
  "totalAmount": "",
  "advancePaid": "",
  "remainingPayment": "",
  "notes": ""
}

Rules:
- Convert dates into YYYY-MM-DD format. If a year is not provided, assume the current or next upcoming year based on today's date.
- Allowed timeSlot values: "Morning", "Evening", "Night", "Custom".
    - Morning => slotTiming "10:00 AM - 4:00 PM"
    - Evening => slotTiming "5:00 PM - 11:00 PM"
    - Night   => slotTiming "1:00 AM - 6:00 AM"
- If the customer requested a custom time window, set timeSlot="Custom", isDoubleSlot=true, fill customStartTime and customEndTime in "HH:MM AM/PM" format, and put "customStartTime - customEndTime" in slotTiming.
- Otherwise isDoubleSlot=false and leave customStartTime, customEndTime blank.
- Calculate remainingPayment = totalAmount - advancePaid (numeric strings, no currency symbol).
- If any field cannot be determined confidently, leave it as an empty string. Never guess names, phones, farms or numbers.
- If the ENTIRE message contains no booking info at all, return null (the literal JSON null).
- Return ONLY the JSON object (or null). No other text.`;

function stripToJson(raw) {
  let s = String(raw || "").trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return s.trim();
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY not configured" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const text = String(body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "text field is required" });

  const today = new Date().toISOString().slice(0, 10);
  const systemMessage = SYSTEM_PROMPT + `\n\nToday's date is ${today}.`;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ error: "OpenAI error", detail: err });
    }
    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content || "";
    const cleaned = stripToJson(raw);
    if (cleaned.toLowerCase() === "null") return res.json({ booking: null, raw });
    try {
      const parsed = JSON.parse(cleaned);
      return res.json({ booking: parsed, raw });
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return res.json({ booking: JSON.parse(match[0]), raw });
        } catch {
          /* fallthrough */
        }
      }
      return res.json({ booking: null, raw, error: "Invalid JSON from LLM" });
    }
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
