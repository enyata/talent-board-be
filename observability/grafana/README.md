# Grafana Alerting

This folder documents the Grafana-side setup for Loki alerts and Slack notifications.

The application only writes structured logs to stdout. Grafana Alloy ships those logs to Loki, and Grafana evaluates Loki queries to drive alerts.

## Suggested Loki Alert Rule

Use an alert rule that watches for error-level logs from the backend:

```logql
{app="talent-board-be", environment="staging", level="error"}
```

Recommended rule behavior:

- Evaluate every 1 minute.
- Fire when the query matches at least 1 log line in the last 5 minutes.
- Use a short alert title such as `talent-board-be staging errors`.

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

Route the Loki error alert to the Slack contact point above.

Suggested matching labels:

- `app = talent-board-be`
- `environment = staging`
- `level = error`

## Environment Values

The staging example env file includes the placeholders used by this setup:

- `GRAFANA_LOKI_URL`
- `GRAFANA_LOKI_USERNAME`
- `GRAFANA_LOKI_PASSWORD`
- `GRAFANA_SLACK_WEBHOOK_URL`
- `GRAFANA_SLACK_CHANNEL`
