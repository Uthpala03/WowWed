"""INT26 — POST /api/reviews before the booking is paid."""
import json
import urllib.error
import urllib.request

EMAIL = "api.plan.couple@wowwed.test"
PASSWORD = "Test1234"
BASE = "http://localhost:5002"


def request(path, method="GET", body=None, token=None):
    headers = {}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode()
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        res = urllib.request.urlopen(req)
        return res.status, res.read().decode()
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode()


login_status, login_body = request(
    "/api/auth/login",
    method="POST",
    body={"email": EMAIL, "password": PASSWORD},
)
if login_status != 200:
    print(login_status)
    print(login_body)
    raise SystemExit("Login failed. Use the same email as INT06.")

token = json.loads(login_body)["token"]
list_status, list_body = request("/api/bookings", token=token)
if list_status != 200:
    print(list_status)
    print(list_body)
    raise SystemExit("Could not load bookings. Run INT23 first.")

payload = json.loads(list_body)
bookings = payload.get("bookings") or payload if isinstance(payload, list) else payload.get("bookings", [])
booking = next(
    (item for item in bookings if item.get("vendorName") == "Kandyan Reach Hotel" or item.get("vendorListingId") == "vw-01"),
    bookings[0] if bookings else None,
)
if not booking:
    raise SystemExit("No booking found. Run INT23 first.")

review = {
    "bookingId": booking.get("id") or booking.get("bookingId"),
    "rating": 5,
    "comment": "Great venue",
}
status, body = request("/api/reviews", method="POST", body=review, token=token)
print(status)
print(body)
