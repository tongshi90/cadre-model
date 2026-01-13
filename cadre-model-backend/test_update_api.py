import requests

url = "http://localhost:5000/api/cadres/dynamic-info/3"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiaXNfYWRtaW4iOjEsImV4cCI6MTc2ODAzNzc4MX0.BTQJrm0Byp4QDTWcahMrpAJU55kpyLZKMj_MLps_ASo"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}

data = {
    "info_type": 3,
    "assessment_cycle": "季度",
    "assessment_grade": "S",
    "assessment_comment": "表现非常优秀",
    "assessment_dimension": "2024年 第一季度"
}

response = requests.put(url, json=data, headers=headers)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
