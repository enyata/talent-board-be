# Observability

This project emits structured Pino logs in every environment. Grafana Alloy can collect container logs from any runtime and push them to Grafana Cloud Loki.

## Application Logging Path

The API writes JSON logs to stdout through the shared logger in `src/utils/logger.ts`.
Docker or your container runtime captures those logs and the Alloy collector forwards them to Loki.
The app does not send logs to Grafana directly; it only needs to keep writing structured logs.

The current code emits:

- startup and database connection logs
- HTTP request completion logs for every request
- structured request error logs with request metadata

## Private Slack Alerts

Grafana alerting should route to Slack, not the application. For a private Slack channel:

1. Create or reuse a Slack incoming webhook that is allowed to post into the private channel.
2. Invite the Slack app or integration to that private channel if Slack requires it.
3. Store the webhook URL as a secret in the environment you deploy to or in Grafana provisioning.
4. In Grafana, create a contact point that uses that webhook.
5. Route your Loki error alert rule to that contact point.

Recommended alert query:

```logql
{app="talent-board-be", environment="<your-env>", level="error"}
```

If you want channel-specific routing, keep one webhook per private channel and one Grafana contact point per channel.

See [observability/grafana/README.md](observability/grafana/README.md) for an example alert rule and a contact point template.

## Environment Setup

1. Add the Grafana/Loki/Slack values to the environment file used by the deployment target, such as `.env`, `.env.production`, or `.env.staging`.
2. Set `GRAFANA_ENVIRONMENT` to the environment label you want to appear in Loki, for example `development`, `staging`, or `production`.
3. Start the Alloy collector for that environment.

```bash
docker compose up -d alloy
```

4. In Grafana Explore, query:

```logql
{app="talent-board-be", environment="<your-env>"}
```

For errors:

```logql
{app="talent-board-be", environment="<your-env>", level="error"}
```

Keep Loki labels low-cardinality. Good labels are `app`, `environment`, `cluster`, `service`, `container`, and `level`. Keep request IDs, user IDs, emails, tokens, and resume paths as log fields instead of labels.
