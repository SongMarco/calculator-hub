#!/usr/bin/env python3
"""custom.resend 커넥터의 surrogate를 JSON으로 출력 (Node 스크립트에서 사용).

Usage: resend-cred.py
Output: {"surrogate": "hsurr:...", "placement": "bearer_header"}
Sentinel/authd가 egress 시점에 surrogate를 실제 키로 치환하므로,
이 값을 그대로 Authorization 헤더에 사용해도 키가 노출되지 않는다.
"""
import json
import sys

sys.path.insert(0, "/opt/hatch/skills/skill-creator/bin")
from dynamic_credentials import dynamic_credential_entry, DynamicCredentialError

for entry_name in ("api_key", "access_token"):
    try:
        entry = dynamic_credential_entry("custom.resend", entry_name)
        print(json.dumps({"surrogate": entry["surrogate"], "placement": entry.get("placement")}))
        sys.exit(0)
    except DynamicCredentialError:
        continue

print(json.dumps({"error": "custom.resend credential not connected"}))
sys.exit(1)
