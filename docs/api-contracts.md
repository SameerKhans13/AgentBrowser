# API Contracts & Communication Protocol

This document defines the HTTP endpoints and WebSockets used to interface the **React Dashboard** with the **Agent browser service**.

---

## 📡 HTTP REST API Endpoints

### 1. List Agent Runs
Returns historical and active agent runs.

*   **Endpoint:** `/api/runs`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `limit` (optional): number of runs to fetch (default: `20`)
    *   `status` (optional): filter by `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`
*   **Response (`200 OK`):**
    ```json
    [
      {
        "id": "e674112c-9a42-4933-9118-0242ac110002",
        "targetUrl": "https://example.com",
        "status": "COMPLETED",
        "startedAt": "2026-06-18T11:00:00.000Z",
        "completedAt": "2026-06-18T11:05:12.000Z",
        "instructions": "Navigate to example.com and take a snapshot."
      }
    ]
    ```

### 2. Fetch Run Logs & Steps
Retrieves full linear action logs for a given run ID.

*   **Endpoint:** `/api/runs/:runId/steps`
*   **Method:** `GET`
*   **Response (`200 OK`):**
    ```json
    {
      "runId": "e674112c-9a42-4933-9118-0242ac110002",
      "steps": [
        {
          "stepIndex": 1,
          "actionType": "OPEN_BROWSER",
          "thought": "Initializing Chromium instance.",
          "parameters": { "headless": true },
          "createdAt": "2026-06-18T11:00:05.000Z"
        }
      ]
    }
    ```

### 3. Trigger Agent Run
Spawns a new autonomous web agent session.

*   **Endpoint:** `/api/runs`
*   **Method:** `POST`
*   **Body Content:**
    ```json
    {
      "targetUrl": "https://example.com",
      "instructions": "Find the main heading text and click it."
    }
    ```
*   **Response (`201 Created`):**
    ```json
    {
      "id": "4b5d2789-9a2c-49e0-811d-cd12f8f74221",
      "status": "PENDING"
    }
    ```
