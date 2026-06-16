# Database Package

This package manages the database schema, migrations, and client connections using **Drizzle ORM** and **PostgreSQL**.

## 🛠️ Tech Stack
- **ORM:** Drizzle ORM
- **Driver:** `node-postgres` (pg)
- **Database:** PostgreSQL

## 📂 Structure
- `src/schema.ts` — Definition of tables, enums, and relationships.
- `src/index.ts` — Database connection pooling client.
- `drizzle.config.ts` — Configuration file for Drizzle Kit.

## 🚀 Commands
From the database directory or using monorepo shortcuts:

### Push Schema
Directly sync database schema with PostgreSQL:
```bash
npm run db:push
```

### Drizzle Studio
Explore the database schema and table records using a local visual browser editor:
```bash
npx drizzle-kit studio
```
