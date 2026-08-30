"""INT25 — GET /api/notifications with a login token."""
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
status, body = request("/api/notifications", token=token)
print(status)
print(body)
