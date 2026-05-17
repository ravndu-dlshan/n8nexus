import os

import httpx

from logger import setup_logging

log = setup_logging()


class N8nConfigError(Exception):
    """N8N_BASE_URL or N8N_API_KEY is missing."""


class N8nApiError(Exception):
    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def n8n_instance_url() -> str:
    return os.getenv("N8N_BASE_URL", "").strip().rstrip("/")


def n8n_api_root() -> str:
    base = n8n_instance_url()
    if not base:
        raise N8nConfigError("N8N_BASE_URL is not set.")
    if base.endswith("/api/v1"):
        return base
    return f"{base}/api/v1"


def n8n_rest_root() -> str:
    """Editor/internal API base (Execute workflow uses /rest/workflows/{id}/run)."""
    base = n8n_instance_url().rstrip("/")
    if base.endswith("/api/v1"):
        base = base[: -len("/api/v1")]
    return f"{base}/rest"


def n8n_api_key() -> str:
    key = os.getenv("N8N_API_KEY", "").strip()
    if not key:
        raise N8nConfigError("N8N_API_KEY is not set.")
    return key


def is_n8n_configured() -> bool:
    return bool(n8n_instance_url()) and bool(os.getenv("N8N_API_KEY", "").strip())


def _api_headers() -> dict[str, str]:
    return {
        "X-N8N-API-KEY": n8n_api_key(),
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def _parse_error_response(response: httpx.Response) -> str:
    detail = response.text.strip() or response.reason_phrase
    try:
        body = response.json()
        if isinstance(body, dict) and "message" in body:
            detail = str(body["message"])
    except Exception:
        pass
    return detail


def _unwrap_response(data: dict) -> dict:
    inner = data.get("data")
    if isinstance(inner, dict):
        return inner
    return data


def _http_json(
    method: str,
    url: str,
    *,
    json_body: dict | None = None,
    timeout: float = 60.0,
) -> dict:
    headers = _api_headers()
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.request(method, url, json=json_body, headers=headers)
    except httpx.RequestError as e:
        log.exception("n8n request failed %s %s", method, url)
        raise N8nApiError(0, f"Could not reach n8n: {e}") from e

    if response.status_code >= 400:
        raise N8nApiError(response.status_code, _parse_error_response(response))

    if response.status_code == 204 or not response.content:
        return {}

    data = response.json()
    if not isinstance(data, dict):
        raise N8nApiError(0, "Unexpected response from n8n.")
    return _unwrap_response(data)


def _request_json(
    method: str,
    path: str,
    *,
    json_body: dict | None = None,
    timeout: float = 60.0,
) -> dict:
    return _http_json(method, f"{n8n_api_root()}{path}", json_body=json_body, timeout=timeout)


def _request_rest_json(
    method: str,
    path: str,
    *,
    json_body: dict | None = None,
    timeout: float = 60.0,
) -> dict:
    return _http_json(method, f"{n8n_rest_root()}{path}", json_body=json_body, timeout=timeout)


def create_workflow(payload: dict) -> dict:
    return _request_json("POST", "/workflows", json_body=payload)


def get_workflow(workflow_id: str) -> dict:
    return _request_json("GET", f"/workflows/{workflow_id}")


def run_workflow_rest(workflow_id: str, trigger_node_name: str) -> dict:
    """Editor-style run: POST /rest/workflows/{id}/run (Execute workflow button)."""
    return _request_rest_json(
        "POST",
        f"/workflows/{workflow_id}/run",
        json_body={"triggerToStartFrom": {"name": trigger_node_name}},
        timeout=120.0,
    )


def run_workflow(workflow_id: str, workflow_data: dict | None = None) -> dict:
    body: dict | None = None
    if workflow_data is not None:
        body = {"workflowData": workflow_data}
    return _request_json(
        "POST",
        f"/workflows/{workflow_id}/run",
        json_body=body,
        timeout=120.0,
    )


def get_execution(execution_id: str) -> dict:
    try:
        return _request_rest_json("GET", f"/executions/{execution_id}", timeout=60.0)
    except N8nApiError as e:
        if e.status_code in (404, 405):
            return _request_json("GET", f"/executions/{execution_id}", timeout=60.0)
        raise


def _webhook_error_message(body: dict | list | str | None, fallback: str) -> str:
    if isinstance(body, dict):
        parts: list[str] = []
        if body.get("message"):
            parts.append(str(body["message"]))
        if body.get("hint"):
            parts.append(str(body["hint"]))
        if parts:
            return " — ".join(parts)
    if isinstance(body, str) and body.strip():
        return body.strip()
    return fallback or "Webhook request failed"


def trigger_webhook(url: str, payload: dict) -> tuple[int, dict | list | str | None]:
    """POST to an n8n webhook URL; returns (status_code, parsed_or_raw_body)."""
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    try:
        with httpx.Client(timeout=120.0, follow_redirects=True) as client:
            response = client.post(url, json=payload, headers=headers)
    except httpx.RequestError as e:
        log.exception("n8n webhook request failed")
        raise N8nApiError(0, f"Could not reach webhook: {e}") from e

    body: dict | list | str | None
    content_type = response.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            parsed = response.json()
            body = parsed if isinstance(parsed, (dict, list)) else str(parsed)
        except Exception:
            body = response.text.strip() or None
    else:
        text = response.text.strip()
        body = text or None

    if response.status_code >= 400:
        message = _webhook_error_message(body, response.reason_phrase)
        raise N8nApiError(response.status_code, message)

    return response.status_code, body
