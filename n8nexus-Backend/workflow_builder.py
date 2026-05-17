import copy

from n8n_registry import (
    TEMPLATES,
    get_template,
    load_template_json,
    normalize_webhook_path,
    validate_field,
)


def _find_node(workflow: dict, node_name: str) -> dict | None:
    for node in workflow.get("nodes", []):
        if node.get("name") == node_name:
            return node
    return None


def _set_string_values(node: dict, updates: dict[str, str]) -> None:
    strings = node.setdefault("parameters", {}).setdefault("values", {}).setdefault(
        "string", []
    )
    by_name = {item["name"]: item for item in strings if "name" in item}
    for key, value in updates.items():
        if key in by_name:
            by_name[key]["value"] = value
        else:
            strings.append({"name": key, "value": value})


def build_workflow(template_id: str, fields: dict[str, str]) -> dict:
    spec = get_template(template_id)
    if spec is None:
        raise ValueError(f"Unknown template: {template_id}")

    merged = {**spec.field_defaults(), **{k: v.strip() for k, v in fields.items() if v}}
    for f in spec.fields:
        val = merged.get(f.name, "")
        if val:
            err = validate_field(template_id, f.name, str(val))
            if err:
                raise ValueError(f"{f.label}: {err}")

    workflow = copy.deepcopy(load_template_json(template_id))
    workflow["name"] = merged.get("workflow_name", workflow.get("name", "Generated Workflow"))

    if template_id == "manual_set":
        set_node = _find_node(workflow, "Set")
        if set_node:
            _set_string_values(
                set_node,
                {
                    "message": merged["message"],
                    "status": merged["status"],
                },
            )

    elif template_id == "manual_http":
        http_node = _find_node(workflow, "HTTP Request")
        if http_node:
            http_node.setdefault("parameters", {})["url"] = merged["url"]

    elif template_id == "webhook_lead":
        path = normalize_webhook_path(merged["webhook_path"])
        webhook = _find_node(workflow, "Webhook")
        if webhook:
            webhook.setdefault("parameters", {})["path"] = path
            webhook["webhookId"] = f"{path}-demo"
        set_node = _find_node(workflow, "Set Response")
        if set_node:
            _set_string_values(set_node, {"status": merged["response_status"]})

    elif template_id == "webhook_ai":
        path = normalize_webhook_path(merged["webhook_path"])
        webhook = _find_node(workflow, "Webhook")
        if webhook:
            webhook.setdefault("parameters", {})["path"] = path
            webhook["webhookId"] = f"{path}-demo"
        set_node = _find_node(workflow, "Mock AI Response")
        if set_node:
            _set_string_values(set_node, {"reply": merged["ai_reply"]})

    elif template_id == "webhook_supabase":
        path = normalize_webhook_path(merged["webhook_path"])
        webhook = _find_node(workflow, "Webhook")
        if webhook:
            webhook.setdefault("parameters", {})["path"] = path
            webhook["webhookId"] = f"{path}-demo"
        set_node = _find_node(workflow, "Prepare Database Payload")
        if set_node:
            _set_string_values(
                set_node,
                {
                    "database": merged.get("database_label", "Supabase"),
                    "status": merged.get("status_message", "Ready for insert"),
                },
            )

    else:
        raise ValueError(f"Unsupported template: {template_id}")

    return workflow
