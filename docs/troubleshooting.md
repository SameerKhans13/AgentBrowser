# Troubleshooting Guide

This document lists common issues encountered during setup, development, or deployment of the Antigravity Autonomous Web Agent, along with their solutions.

---

## 🔌 Database Issues

### 1. Connection Refused (`ECONNREFUSED`)
*   **Symptom:** `Error: connect ECONNREFUSED 127.0.0.1:5432` when starting the server or running migrations.
*   **Cause:** The local PostgreSQL container is either not running or running on a different port.
*   **Solution:**
    1.  Verify the docker container state:
        ```bash
        docker compose ps
        ```
    2.  If it's stopped, start it:
        ```bash
        docker compose up -d
        ```
    3.  Check that no local PostgreSQL service (e.g. system postgres) is already running and binding to port `5432`.

### 2. Drizzle Push Failing due to Relation Violations
*   **Symptom:** `DrizzlePushError` or relation mismatch.
*   **Cause:** Out of sync development schemas.
*   **Solution:** If working locally in development, you can force-sync or clear the database volume:
    ```bash
    docker compose down -v
    docker compose up -d
    npm run db:push
    ```

---

## 🌐 Browser & Playwright Issues

### 1. Playwright Browsers Not Found
*   **Symptom:** `Error: Browser type chromium not installed.`
*   **Cause:** Playwright requires a post-install step to download corresponding browser binaries.
*   **Solution:** Run the playwright install script within the workspace:
    ```bash
    npx playwright install
    ```
