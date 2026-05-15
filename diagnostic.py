import requests
import json

URL = "http://localhost:8080/api/auth/login"
payload = {
    "email": "admin@delhi.gov.in",
    "password": "Password@123"
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(URL, data=json.dumps(payload), headers=headers)
    token = response.json().get('data', {}).get('accessToken')
    
    if token:
        print(f"Token: {token}")
        complaints_url = "http://localhost:8080/api/complaints?page=0&size=1000"
        headers['Authorization'] = f"Bearer {token}"
        res = requests.get(complaints_url, headers=headers)
        print(json.dumps(res.json(), indent=2))
    else:
        print(f"Login failed: {response.text}")
except Exception as e:
    print(f"Error: {e}")
