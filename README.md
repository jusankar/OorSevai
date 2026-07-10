# OorSevai Database Schema Migrations

This document explains how to update the database schema using Drizzle Kit.

## Prerequisite
Make sure you have your `.env` file configured in the **project root directory** with the following variables:
```env
SQL_HOST=your_database_host
SQL_DB_NAME=your_database_name
SQL_ADMIN_USER=your_admin_user
SQL_ADMIN_PASSWORD=your_admin_password
```

---

## How to Update the Database Schema

To push your latest schema changes from `./src/db/schema.ts` to your Cloud SQL database, **always run the command from the project root directory** (where your `.env` file is located).

### Push Command
Run this command in your terminal from the **project root**:
```bash
npx drizzle-kit push --config=src/db/drizzle.config.ts
```

---

## Why did I get `SQL_HOST must be set in environment variables`?

If you navigate into the `src/db` subdirectory and run:
```bash
# ❌ INCORRECT (Will fail with environment variable errors)
cd src/db
npx drizzle-kit push --config=drizzle.config.ts
```

You will get the error:
`SQL_HOST must be set in environment variables.`

### The Reason
Drizzle Kit runs the config file `drizzle.config.ts` which uses `dotenv` to load configuration:
```typescript
dotenv.config();
```
By default, `dotenv` looks for the `.env` file in the **current working directory** of the terminal process. 
- If you are inside `src/db`, `dotenv` searches for `src/db/.env` (which does not exist), so none of your database credentials are loaded.
- By running the command from the **project root** and specifying the path to the config file (`--config=src/db/drizzle.config.ts`), `dotenv` correctly finds and loads the `.env` file located at the project root.
