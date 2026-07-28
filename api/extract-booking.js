// Vercel Serverless Function: /api/extract-booking
// Auto-detects which LLM provider to use based on environment variables:
//   1. GEMINI_API_KEY  → Google Gemini 2.5 Flash (free tier, recommended)
//   2. OPENAI_API_KEY  → OpenAI GPT-5.2 (paid)
// You only need ONE of these set on Vercel.

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

async function callGemini(text, apiKey, systemMessage) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemMessage }] },
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    }),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Gemini ${r.status}: ${err}`);
  }
  const data = await r.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callOpenAI(text, apiKey, systemMessage) {
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
    throw new Error(`OpenAI ${r.status}: ${err}`);
  }
  const data = await r.json();
  return data?.choices?.[0]?.message?.content || "";
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!geminiKey && !openaiKey) {
    return res.status(500).json({
      error: "No LLM key configured",
      detail: "Set either GEMINI_API_KEY (free) or OPENAI_API_KEY on Vercel.",
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const text = String(body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "text field is required" });

  const today = new Date().toISOString().slice(0, 10);
  const systemMessage = SYSTEM_PROMPT + `\n\nToday's date is ${today}.`;

  let raw = "";
  let provider = "";
  try {
    if (geminiKey) {
      provider = "gemini";
      raw = await callGemini(text, geminiKey, systemMessage);
    } else {
      provider = "openai";
      raw = await callOpenAI(text, openaiKey, systemMessage);
    }
  } catch (e) {
    return res.status(502).json({ error: "LLM error", provider, detail: String(e) });
  }

  const cleaned = stripToJson(raw);
  if (cleaned.toLowerCase() === "null") return res.json({ booking: null, raw, provider });
  try {
    const parsed = JSON.parse(cleaned);
    return res.json({ booking: parsed, raw, provider });
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return res.json({ booking: JSON.parse(match[0]), raw, provider });
      } catch {
        /* fallthrough */
      }
    }
    return res.json({ booking: null, raw, provider, error: "Invalid JSON from LLM" });
  }
}
