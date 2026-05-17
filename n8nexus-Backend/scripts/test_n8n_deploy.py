"""One-off test: n8n config, create workflow via API, and deploy endpoint."""
from __future__ import annotations

import json
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import urllib.error
import urllib.request

from dotenv import load_dotenv

load_dotenv(_ROOT / ".env")

from chat_history import session_create
from n8n_client import is_n8n_configured, n8n_api_root, n8n_instance_url
from workflow_builder import build_workflow
from workflow_service import deploy_workflow_for_session
from workflow_state import workflow_state_update


def test_direct_n8n_create() -> dict:
    workflow = build_workflow(
        "webhook_lead",
        {
            "workflow_name": "API Test Lead Capture",
            "webhook_path": "api-test-lead",
            "response_status": "Lead received (test)",
        },
    )
    from n8n_deploy import push_workflow_to_n8n

    return push_workflow_to_n8n(workflow)


def test_deploy_session() -> dict:
    sid = session_create()
    workflow_state_update(
        sid,
        template_id="webhook_lead",
        fields={
            "workflow_name": "Session Deploy Test",
            "webhook_path": "session-deploy-test",
            "response_status": "OK",
        },
    )
    return deploy_workflow_for_session(sid)


def test_http_deploy(base: str, session_id: str) -> dict:
    url = f"{base.rstrip('/')}/workflows/sessions/{session_id}/deploy"
    req = urllib.request.Request(url, method="POST", data=b"")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode())


def main() -> int:
    print("n8n configured:", is_n8n_configured())
    print("instance:", n8n_instance_url())
    print("api root:", n8n_api_root())

    if not is_n8n_configured():
        print("FAIL: Set N8N_BASE_URL and N8N_API_KEY in .env")
        return 1

    print("\n--- 1) Direct n8n POST /workflows ---")
    try:
        created = test_direct_n8n_create()
        print("OK workflow id:", created.get("id"))
        print("   name:", created.get("name"))
        print("   active:", created.get("active"))
    except Exception as e:
        print("FAIL:", e)
        return 1

    print("\n--- 2) deploy_workflow_for_session (chat summary) ---")
    try:
        result = test_deploy_session()
        print("success:", result.get("success"))
        print("n8n_workflow_id:", result.get("n8n_workflow_id"))
        print("webhook_test_url:", result.get("webhook_test_url"))
        if not result.get("success"):
            print("chat_summary:\n", result.get("chat_summary"))
            return 1
        print("chat_summary (first 400 chars):\n", (result.get("chat_summary") or "")[:400])
    except Exception as e:
        print("FAIL:", e)
        return 1

    print("\n--- 3) HTTP POST /workflows/sessions/{id}/deploy ---")
    sid = session_create()
    workflow_state_update(
        sid,
        template_id="webhook_lead",
        fields={
            "workflow_name": "HTTP Deploy Test",
            "webhook_path": "http-deploy-test",
            "response_status": "OK",
        },
    )
    try:
        http_result = test_http_deploy("http://127.0.0.1:8000", sid)
        print("OK success:", http_result.get("success"))
        print("   n8n_workflow_id:", http_result.get("n8n_workflow_id"))
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print("FAIL HTTP", e.code, body)
        return 1
    except Exception as e:
        print("FAIL:", e)
        return 1

    print("\nAll tests passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
