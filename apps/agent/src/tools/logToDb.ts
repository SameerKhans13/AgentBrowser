import { actionLogs } from '@genai/database';

export interface LogParams {
  runId: string;
  stepIndex: number;
  actionType: 'OPEN_BROWSER' | 'GOTO_URL' | 'SCREENSHOT' | 'CLICK' | 'SEND_KEYS' | 'SCROLL' | 'DOUBLE_CLICK' | 'FINISH' | 'ERROR';
  thought: string;
  parameters?: Record<string, any>;
  screenshotUrl?: string | null;
}

export async function logToDb(db: any, params: LogParams): Promise<void> {
  await db.insert(actionLogs).values({
    runId: params.runId,
    stepIndex: params.stepIndex,
    actionType: params.actionType,
    thought: params.thought,
    parameters: params.parameters || null,
    screenshotUrl: params.screenshotUrl || null,
  });
}
