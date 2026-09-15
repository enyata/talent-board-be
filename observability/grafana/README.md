# Grafana Alerting

This folder documents the Grafana-side setup for Loki alerts and Slack notifications.

The application only writes structured logs to stdout. Grafana Alloy ships those logs to Loki, and Grafana evaluates Loki queries to drive alerts.

## Suggested Loki Alert Rule

Use separate alert rules for paging and non-paging signals.

Page when the app or background jobs are actually broken:

```logql
{app="talent-board-be", environment="<your-env>"}
| json
| level="error"
| event=~"request_failed|unhandled_request_error|worker_failed"
```

Recommended paging rule behavior:

- Evaluate every 1 minute.
- Fire when the query matches at least 1 log line in the last 5 minutes.
- Use a short alert title such as `talent-board-be <your-env> paging`.

Do not page on validation failures by default:

```logql
{app="talent-board-be", environment="<your-env>"}
| json
| event="validation_failed"
```

Recommended non-paging behavior:

- Keep the rule as warning-only, or route it to a lower-severity channel.
- Use it to spot noisy clients, bad payloads, or broken integrations without waking anyone up.

Optional health-check rule for request failures:

```logql
{app="talent-board-be", environment="<your-env>"}
| json
| event="http_request"
| level="error"
| statusCode >= 500
```

Use this if you want to alert directly on 5xx responses regardless of whether the global error handler also logged an exception.

## Slack Contact Point

For a private Slack channel, use a Slack incoming webhook that is allowed to post to that channel.

Important notes:

- Invite the Slack app or webhook integration to the private channel before testing the alert.
- Keep one webhook per private channel if you want alerts split by team or severity.
- Store the webhook URL as a secret in Grafana provisioning or your deployment system.

Example contact point fields:

```yaml
contactPoints:
  - orgId: 1
    name: talent-board-be-private-slack
    receivers:
      - uid: talent-board-be-private-slack
        type: slack
        settings:
          url: ${GRAFANA_SLACK_WEBHOOK_URL}
          channel: ${GRAFANA_SLACK_CHANNEL}
          title: "{{ .CommonAnnotations.summary }}"
          text: "{{ range .Alerts }}{{ .Labels.app }} {{ .Labels.environment }} {{ .Labels.level }}\n{{ .Annotations.description }}{{ end }}"
```

## Notification Policy

Route the paging Loki alert to the Slack contact point above.

Suggested matching labels:

- `app = talent-board-be`
- `environment = <your-env>`
- `level = error`

If you also keep the validation rule, route it to a warning channel or leave it unnotified.

## Environment Values

The shared example env file includes the placeholders used by this setup:

- `GRAFANA_LOKI_URL`
- `GRAFANA_LOKI_USERNAME`
- `GRAFANA_LOKI_PASSWORD`
- `GRAFANA_ENVIRONMENT`
- `GRAFANA_SLACK_WEBHOOK_URL`
- `GRAFANA_SLACK_CHANNEL`
