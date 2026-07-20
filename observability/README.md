# Observability

This project emits structured Pino logs in staging and production. Grafana Alloy can collect Docker logs from the staging host and push them to Grafana Cloud Loki.

## Application Logging Path

The API writes JSON logs to stdout through the shared logger in `src/utils/logger.ts`.
In staging, Docker captures those logs and the Alloy collector forwards them to Loki.
The app does not send logs to Grafana directly; it only needs to keep writing structured logs.

The current code emits:

- startup and database connection logs
- HTTP request completion logs for every request
- structured request error logs with request metadata

## Private Slack Alerts

Grafana alerting should route to Slack, not the application. For a private Slack channel:

1. Create or reuse a Slack incoming webhook that is allowed to post into the private channel.
2. Invite the Slack app or integration to that private channel if Slack requires it.
3. Store the webhook URL as a secret in your staging environment or Grafana provisioning flow.
4. In Grafana, create a contact point that uses that webhook.
5. Route your Loki error alert rule to that contact point.

Recommended alert query:

```logql
{app="talent-board-be", environment="staging", level="error"}
```

If you want channel-specific routing, keep one webhook per private channel and one Grafana contact point per channel.

See [observability/grafana/README.md](observability/grafana/README.md) for an example alert rule and a contact point template.

## Staging Logs

1. Copy `.env.staging.example` to `.env.staging` on the staging host. The real `.env.staging` file is gitignored.
2. Fill in the staging API/frontend URLs and Grafana Cloud Loki credentials.
3. Start the Alloy collector:

```bash
docker compose --profile staging-observability up -d alloy_staging
```

4. In Grafana Explore, query:

```logql
{app="talent-board-be", environment="staging"}
```

For errors:

```logql
{app="talent-board-be", environment="staging", level="error"}
```

Keep Loki labels low-cardinality. Good labels are `app`, `environment`, `cluster`, `service`, `container`, and `level`. Keep request IDs, user IDs, emails, tokens, and resume paths as log fields instead of labels.
