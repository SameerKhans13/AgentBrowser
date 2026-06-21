import { pgTable, uuid, text, timestamp, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';

// 1. Enums
export const runStatusEnum = pgEnum('run_status', ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']);
export const actionTypeEnum = pgEnum('action_type', [
  'OPEN_BROWSER',
  'GOTO_URL',
  'SCREENSHOT',
  'CLICK',
  'SEND_KEYS',
  'SCROLL',
  'DOUBLE_CLICK',
  'FINISH',
  'ERROR'
]);

// 2. Agent Runs Table
export const agentRuns = pgTable('agent_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  targetUrl: text('target_url').notNull(),
  status: runStatusEnum('status').default('PENDING').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  errorLog: text('error_log'),
  instructions: text('instructions'),
});

// 3. Action Logs Table
export const actionLogs = pgTable('action_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  runId: uuid('run_id')
    .references(() => agentRuns.id, { onDelete: 'cascade' })
    .notNull(),
  stepIndex: integer('step_index').notNull(),
  actionType: actionTypeEnum('action_type').notNull(),
  thought: text('thought').notNull(),
  parameters: jsonb('parameters'),
  screenshotUrl: text('screenshot_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
