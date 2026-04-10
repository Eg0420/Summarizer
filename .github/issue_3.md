## Parent PRD

See PRD.md

## What to build

Set up GitHub Actions workflow that automatically runs the Python ETL pipeline when new PDFs are pushed to data/raw/**. The workflow should execute the ETL script directly (extract, chunk, embed, store in /data/gold) and log results.

Refer to sections: Implementation Decisions > Technical Details, User Request: Run ETL script directly in GitHub Actions

## Acceptance criteria

- [ ] GitHub Actions workflow file created (.github/workflows/etl.yml)
- [ ] Workflow triggers on push to data/raw/**
- [ ] Workflow sets up Python environment
- [ ] Runs ETL script on all new PDFs in data/raw
- [ ] Logs extraction progress and errors to workflow output
- [ ] Updates /data/gold automatically
- [ ] Workflow can be retried manually
- [ ] Failures are logged clearly

## Blocked by

#3 (ETL pipeline)

## User stories addressed

Infrastructure; no direct user stories.
