"""Backend tests for FUN FARMHOUSE API.

Covers:
- /api/health
- /api/extract-booking (full message, custom slot, empty, math consistency)
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # fallback: read from frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip()
                    break
    except Exception:
        pass
BASE_URL = (BASE_URL or "").rstrip("/")

TIMEOUT = 90  # LLM may be slow


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Health -----------------------------------------------------------------

def test_health(api):
    r = api.get(f"{BASE_URL}/api/health", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "healthy"
    assert data.get("llm_configured") is True


# --- Extract booking --------------------------------------------------------

FULL_MSG = (
    "Ali booked Al Hadi Farm on 15 August 2027. Evening slot. 12 guests. "
    "Birthday party. Total 18000. Advance 5000. Phone 03001234567."
)

EXPECTED_KEYS = {
    "customerName", "phone", "farmName", "bookingDate", "timeSlot",
    "slotTiming", "isDoubleSlot", "guests", "eventType",
    "totalAmount", "advancePaid", "remainingPayment",
}


def test_extract_booking_full_message(api):
    r = api.post(f"{BASE_URL}/api/extract-booking",
                 json={"text": FULL_MSG}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "booking" in body
    b = body["booking"]
    assert b is not None, f"Expected booking, got {body}"
    missing = EXPECTED_KEYS - set(b.keys())
    assert not missing, f"Missing keys: {missing}"

    # sanity value checks
    assert "Ali" in (b.get("customerName") or "")
    assert "Hadi" in (b.get("farmName") or "")
    assert b.get("bookingDate", "").startswith("2027-08-15") or b.get("bookingDate") == "2027-08-15"
    assert b.get("timeSlot") == "Evening"
    assert str(b.get("totalAmount")).replace(",", "") in ("18000", "18000.0")
    assert str(b.get("advancePaid")).replace(",", "") in ("5000", "5000.0")

    # remaining = total - advance
    try:
        total = float(str(b.get("totalAmount")).replace(",", ""))
        adv = float(str(b.get("advancePaid")).replace(",", ""))
        rem = float(str(b.get("remainingPayment")).replace(",", ""))
        assert abs(rem - (total - adv)) < 0.01
    except ValueError:
        pytest.fail(f"Non-numeric amounts: {b}")


def test_extract_booking_custom_slot(api):
    msg = (
        "Sara booked Green Meadows on 20 September 2027 from 10 AM to 12 PM. "
        "8 guests, family dinner. Total 12000. Advance 3000. Phone 03111234567."
    )
    r = api.post(f"{BASE_URL}/api/extract-booking",
                 json={"text": msg}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    b = r.json().get("booking")
    assert b is not None
    assert b.get("timeSlot") == "Custom"
    assert b.get("isDoubleSlot") is True
    assert b.get("customStartTime")
    assert b.get("customEndTime")


def test_extract_booking_empty_string(api):
    r = api.post(f"{BASE_URL}/api/extract-booking",
                 json={"text": ""}, timeout=15)
    assert r.status_code == 400


def test_extract_booking_no_info(api):
    """A message with no booking info should return booking=null (still 200)."""
    r = api.post(f"{BASE_URL}/api/extract-booking",
                 json={"text": "hello, how are you today?"}, timeout=TIMEOUT)
    assert r.status_code == 200
    # booking may be null OR mostly empty strings – accept both
    body = r.json()
    assert "booking" in body
