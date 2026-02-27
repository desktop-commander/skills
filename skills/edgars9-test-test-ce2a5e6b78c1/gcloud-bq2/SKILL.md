---
name: gcloud-bq2
ayyydescription: t4est
---

aSSaas

# GCloud BigQuery

Run BigQuery operations using the `bq` and `gcloud` CLI tools.

## Environment

- Project: `airy-runway-456110-g5` (override with `--project_id=<proj>`)
- Account: `es@desktopcommander.app`
- Verify auth: `gcloud auth list --filter=status:ACTIVE --format="value(account)"`

## Common Operations

### Run a query

```bash
bq query --use_legacy_sql=false --format=pretty \
  'SELECT column FROM `project.dataset.table` LIMIT 10'
```

Flags worth knowing:

- `--format=pretty` (default table), `--format=json`, `--format=prettyjson`, `--format=csv`
- `--max_rows=100` to cap output rows
- `--dry_run` to estimate bytes scanned without running
- `--nouse_cache` to force a fresh scan

### List datasets

```bash
bq ls
```

### List tables in a dataset

```bash
bq ls dataset_name
```

### Describe a table (schema, row count, size)

```bash
bq show --format=pretty dataset_name.table_name
```

### Get table schema as JSON

```bash
bq show --schema --format=prettyjson dataset_name.table_name
```

### Preview rows (no query cost)

```bash
bq head -n 5 dataset_name.table_name
```

### Export query results to file

```bash
bq query --use_legacy_sql=false --format=csv \
  'SELECT * FROM `project.dataset.table` LIMIT 1000' > output.csv
```

### Export large results to GCS then download

```bash
bq extract --destination_format=CSV \
  project:dataset.table gs://bucket/path/output.csv
gsutil cp gs://bucket/path/output.csv ./output.csv
```

### Create a table from query results

```bash
bq query --use_legacy_sql=false \
  --destination_table=dataset.new_table \
  'SELECT * FROM `project.dataset.source_table` WHERE condition'
```

### Load data into a table

```bash
bq load --source_format=CSV --autodetect \
  dataset.table_name ./local_file.csv
```

## Safety Rules

- Always use `--use_legacy_sql=false` (standard SQL).
- Use `--dry_run` before large/expensive queries to check bytes scanned.
- Never run `DROP`, `DELETE`, or `TRUNCATE` without explicit user confirmation.
- Prefer `LIMIT` clauses to avoid accidentally scanning huge tables.
- Use `--max_rows` to cap output and avoid flooding the terminal.

## Troubleshooting

- **Auth expired**: Run `gcloud auth login` to re-authenticate.
- **Project mismatch**: Run `gcloud config set project <project-id>` or pass `--project_id`.
- **Permission denied**: Check IAM roles with `gcloud projects get-iam-policy <project-id> --filter="bindings.members:user:<email>"`.
- **Query timeout**: For long queries, use `bq query --synchronous_mode=false` to get a job ID, then poll with `bq wait <job-id>`.
- **Large results**: If query returns >100k rows, write to a destination table first then export.
