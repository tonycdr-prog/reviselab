# Hosted GROBID

ReviseLab uses GROBID for live PDF structure extraction. The web app never
talks to GROBID directly; only the worker calls the parser endpoint.

## Deployment

Default deployment target is Fly.io using the same image as local development:

```sh
cd infra/grobid
fly launch --copy-config --no-deploy
fly deploy
```

If the Fly app name is already taken, change `app` in `fly.toml` before
deploying. Keep the public service behind HTTPS and set the worker/GitHub
Actions secret:

```sh
GROBID_URL=https://<your-grobid-app>.fly.dev
```

## Runtime expectations

- Image: `grobid/grobid:0.8.2-crf`
- Process: `./grobid-service/bin/grobid-service`
- JVM options: `JAVA_TOOL_OPTIONS=-XX:-UseContainerSupport`
- Health check: `GET /api/isalive`
- Parser endpoint: `POST /api/processFulltextDocument`
- Initial sizing: 2 shared CPUs, 4 GB memory, one always-running machine
- Worker behavior: parser downtime must persist a `failed-parse` state, not
  silently fall back to metadata-only PDF parsing

## CI behavior

The hosted smoke workflow starts the same GROBID image inside GitHub Actions
when `include_pdf=true` and applies the same JVM container-support override as
the Fly config. Production worker deployments should use the hosted `GROBID_URL`
endpoint instead.
