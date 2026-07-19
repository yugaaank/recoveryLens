<div align="center">

# 🔎 recoveryLens

**Risk-aware recovery insights — a Next.js dashboard backed by Postgres.**

[![Stack](https://img.shields.io/badge/stack-Next.js%2016-8b5cf6?style=for-the-badge)](https://nextjs.org)
[![DB](https://img.shields.io/badge/db-Postgres-8b5cf6?style=for-the-badge)](#)
[![PRs](https://img.shields.io/badge/PRs-welcome-8b5cf6?style=for-the-badge)](#contributing)

</div>

---

<div align="center">

| | |
|---|---|
| 🎯 **Purpose** | Visualize recovery risk from data |
| 🧩 **Stack** | Next.js 16 · React 19 · Chart.js · Postgres |
| 🌑 **Theme** | Dark / rich |
| 📦 **Status** | In development |

</div>

---

## ✨ Features

- 📊 **Chart.js** dashboards via `react-chartjs-2`
- 🔐 **Auth-ready** — `jose` for JWT, `next-themes` for theming
- 🗄️ **Postgres** with a migration (`migration.sql`) + `setup_postgres.sh`
- ✅ **Schema check** — `verify-schema.js` keeps the DB honest
- 📄 Sample `risk-report.json` for demos

## 🚀 Quick start

```bash
./scripts/setup_postgres.sh
npm install
npm run dev
```

## 📁 Structure

```
recoveryLens/
├── src/              # app code
├── scripts/          # setup + verify
├── migration.sql  verify-schema.js  setup_postgres.sh
├── risk-report.json # sample data
└── instructions.md
```

## 🤝 Contributing

PRs welcome — match the dark/rich README style.

## 📜 License

MIT © Yugank Rathore
