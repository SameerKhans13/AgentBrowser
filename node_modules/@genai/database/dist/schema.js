"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionLogs = exports.agentRuns = exports.actionTypeEnum = exports.runStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// 1. Enums
exports.runStatusEnum = (0, pg_core_1.pgEnum)('run_status', ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']);
exports.actionTypeEnum = (0, pg_core_1.pgEnum)('action_type', [
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
exports.agentRuns = (0, pg_core_1.pgTable)('agent_runs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    targetUrl: (0, pg_core_1.text)('target_url').notNull(),
    status: (0, exports.runStatusEnum)('status').default('PENDING').notNull(),
    startedAt: (0, pg_core_1.timestamp)('started_at').defaultNow().notNull(),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    errorLog: (0, pg_core_1.text)('error_log'),
});
// 3. Action Logs Table
exports.actionLogs = (0, pg_core_1.pgTable)('action_logs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    runId: (0, pg_core_1.uuid)('run_id')
        .references(() => exports.agentRuns.id, { onDelete: 'cascade' })
        .notNull(),
    stepIndex: (0, pg_core_1.integer)('step_index').notNull(),
    actionType: (0, exports.actionTypeEnum)('action_type').notNull(),
    thought: (0, pg_core_1.text)('thought').notNull(),
    parameters: (0, pg_core_1.jsonb)('parameters'),
    screenshotUrl: (0, pg_core_1.text)('screenshot_url'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
//# sourceMappingURL=schema.js.map