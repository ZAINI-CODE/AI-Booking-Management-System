import axios from "axios";

// On Vercel the frontend and the /api/extract-booking serverless function share the same origin,
// so REACT_APP_BACKEND_URL is not set → fall back to a relative URL. On the Emergent preview
// REACT_APP_BACKEND_URL points to the FastAPI backend externally.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export async function extractBooking(text) {
  const { data } = await axios.post(
    `${API}/extract-booking`,
    { text },
    { headers: { "Content-Type": "application/json" }, timeout: 60000 },
  );
  return data; // { booking: {...} | null, raw: string }
}
