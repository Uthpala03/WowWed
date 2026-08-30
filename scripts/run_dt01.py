"""DT01 — create dt.couple@wowwed.test so phpMyAdmin can show the users row."""
import json
import urllib.error
import urllib.request

body = {
    "fullName": "DT Couple",
    "email": "dt.couple@wowwed.test",
    "phone": "+94 77 123 4567",
    "password": "Test1234",
    "role": "couple",
}
req = urllib.request.Request(
    "http://localhost:5002/api/auth/register",
    data=json.dumps(body).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)
try:
    res = urllib.request.urlopen(req)
    print(res.status)
    print(res.read().decode())
except urllib.error.HTTPError as err:
    print(err.code)
    print(err.read().decode())
except urllib.error.URLError as err:
    print("Backend is not running on port 5002.")
    print(err)
