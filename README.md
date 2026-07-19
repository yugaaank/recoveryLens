<div align="center">

# recoveryLens

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Postgres](https://img.shields.io/badge/db-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](#schema)
[![Charts](https://img.shields.io/badge/charts-Chart.js-FF6384?logo=chartdotjs&logoColor=white)](#front-end)
[![License](https://img.shields.io/badge/license-MIT-8b5cf6)](#license)

</div>

`recoveryLens` is a post-discharge recovery dashboard. Clinicians or patients
record daily readings (pain, activity, vitals, symptoms), and the app derives a
`risk_score` and recovery-status index (`rsi`) per reading, then visualizes
trends so deteriorating recovery is caught early. It is a Next.js 16 app backed
by PostgreSQL, with a schema-migration and verification step so the database
stays in sync with the code.

## Why

Recovery is a trend, not a single number. `recoveryLens` stores each reading
with its raw inputs *and* the computed risk, so the dashboard can show both the
underlying signals and the derived status over time — and a migration +
verifier keep the columns the app expects actually present in Postgres.

## Schema

Defined in `migration.sql` (idempotent `ADD COLUMN IF NOT EXISTS`) and checked
by `verify-schema.js`. Core tables:

- **`patients`** — `id`, `discharge_date` (added by migration).
- **`readings`** — `id`, `patient_id`, `type`, `pain`, `activity`,
  `temperature`, `heart_rate`, `sleep_hours`, `created_at`, plus migration
  columns: `spo2`, `steps`, `minutes_moved`, `symptoms` (JSONB),
  `risk_score` (float), `rsi` (float), `status` (`'Stable'` default),
  `explanation`.

`verify-schema.js` queries `information_schema` for the `readings` table and
fails if any of the 17 expected columns are missing — a guard run after
migration so the app never silently reads a missing column.

## Data flow

```
reading input → POST /api → insert into readings (+ compute risk_score, rsi, status)
                         → Chart.js dashboard renders trends per patient
migration.sql  →  setup_postgres.sh  →  verify-schema.js   (schema safety net)
```

- `setup_postgres.sh` — applies `migration.sql` to the database from
  `POSTGRES_URL`.
- `risk-report.json` — a sample computed report used for demos/tests.

## Front end

Next.js App Router (`src/app`, `src/components`, `src/lib`) with
`next-themes` for light/dark, `jose` for auth/session, `chart.js` +
`react-chartjs-2` for the trend charts, and `lucide-react` icons. The design
guidelines in `instructions.md` call for a minimal, light, high-contrast UI
(soft accents, generous whitespace, `rounded-lg/xl`, subtle borders).

## Getting started

Requires Node, a Postgres instance, and `POSTGRES_URL` in `.env.local`.

```bash
./scripts/setup_postgres.sh     # apply migration.sql
node verify-schema.js           # confirm readings columns exist
npm install
npm run dev                     # Next.js on :3000
```

## License

MIT
