import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export async function extractBooking(text) {
  const { data } = await axios.post(
    `${API}/extract-booking`,
    { text },
    { headers: { "Content-Type": "application/json" }, timeout: 60000 },
  );
  return data; // { booking: {...} | null, raw: string }
}
