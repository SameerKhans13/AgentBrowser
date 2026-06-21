import express from 'express';
import cors from 'cors';
import { db, agentRuns, actionLogs } from '@genai/database';
import { desc, eq } from 'drizzle-orm';
import crypto from 'crypto';
import { AutonomousAgent } from './index';
import * as dotenv from 'dotenv';

dotenv.config();

// Indicate to index.ts to skip auto-running CLI mode
process.env.RUN_MODE = 'server';

import path from 'path';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use('/screenshots', express.static(path.join(process.cwd(), 'screenshots')));

// 1. Get all agent runs
app.get('/api/runs', async (req, res) => {
  try {
    const runsList = await db
      .select()
      .from(agentRuns)
      .orderBy(desc(agentRuns.startedAt));
    res.json(runsList);
  } catch (err: any) {
    console.error('Error fetching runs:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get step logs for a run
app.get('/api/runs/:id/logs', async (req, res) => {
  try {
    const logsList = await db
      .select()
      .from(actionLogs)
      .where(eq(actionLogs.runId, req.params.id))
      .orderBy(actionLogs.stepIndex);
    res.json(logsList);
  } catch (err: any) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Trigger a new run asynchronously
app.post('/api/run', async (req, res) => {
  const { targetUrl, instructions } = req.body;
  if (!targetUrl) {
    return res.status(400).json({ error: 'targetUrl parameter is required' });
  }

  const runId = crypto.randomUUID();

  // Run the agent loop completely async in the background
  const agent = new AutonomousAgent();
  agent.run({
    runId,
    targetUrl,
    instructions,
  }).then(() => {
    console.log(`[Server]: Run ${runId} finished successfully.`);
  }).catch((err) => {
    console.error(`[Server]: Run ${runId} encountered error:`, err);
  });

  // Return the new session ID immediately to permit polling
  res.json({ id: runId, status: 'PENDING', targetUrl, instructions });
});

app.listen(port, () => {
  console.log(`[API Server] Running on http://localhost:${port}`);
});
