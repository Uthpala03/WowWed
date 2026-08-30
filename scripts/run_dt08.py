"""DT08 — create a Kandyan Reach booking for dt.couple@wowwed.test."""
import json
import urllib.error
import urllib.request

EMAIL = "dt.couple@wowwed.test"
PASSWORD = "Test1234"
BASE = "http://localhost:5002"
BOOKING = {
    "vendorListingId": "vw-01",
    "vendorName": "Kandyan Reach Hotel",
    "category": "Venue & Res. Halls",
    "coupleName": "DT Couple",
    "coupleEmail": EMAIL,
    "date": "2026-12-18",
    "amount": 735000,
    "message": "DT08 Kandyan Reach booking.",
}


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
    except urllib.error.URLError as err:
        return 0, str(err)


login_status, login_body = request(
    "/api/auth/login",
    method="POST",
    body={"email": EMAIL, "password": PASSWORD},
)
print("login", login_status)
if login_status != 200:
    print(login_body)
    raise SystemExit("Login failed. Recreate the DT01 couple first.")

token = json.loads(login_body)["token"]
status, body = request("/api/bookings", method="POST", body=BOOKING, token=token)
print(status)
print(body)
