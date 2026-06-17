import { db } from './index';
import { agentRuns, actionLogs } from './schema';

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Insert Completed Run
    const [run1] = await db.insert(agentRuns).values({
      targetUrl: 'https://example.com',
      status: 'COMPLETED',
      instructions: 'Navigate to example.com, click the more information link, and take a screenshot.',
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      completedAt: new Date(),
    }).returning();

    console.log(`✅ Inserted agent run ID: ${run1.id}`);

    // 2. Insert Action Logs for Completed Run
    await db.insert(actionLogs).values([
      {
        runId: run1.id,
        stepIndex: 1,
        actionType: 'OPEN_BROWSER',
        thought: 'I need to launch the browser and prepare for navigation.',
        parameters: { headless: true },
      },
      {
        runId: run1.id,
        stepIndex: 2,
        actionType: 'GOTO_URL',
        thought: 'Navigating directly to the requested landing page.',
        parameters: { url: 'https://example.com' },
      },
      {
        runId: run1.id,
        stepIndex: 3,
        actionType: 'CLICK',
        thought: 'Looking for a "More information" anchor. Located accessible link node. Clicking it.',
        parameters: { x: 450, y: 320 },
      },
      {
        runId: run1.id,
        stepIndex: 4,
        actionType: 'SCREENSHOT',
        thought: 'Action completed. Taking a final viewport snapshot for verification.',
        parameters: { path: 'screenshots/example-complete.png' },
      },
      {
        runId: run1.id,
        stepIndex: 5,
        actionType: 'FINISH',
        thought: 'Mission successful. The page has been successfully navigated and verified.',
      }
    ]);

    console.log('✅ Inserted action logs for Completed Run.');

    // 3. Insert Failed Run
    const [run2] = await db.insert(agentRuns).values({
      targetUrl: 'https://non-existent-site-xyz.com',
      status: 'FAILED',
      instructions: 'Analyze the product features and pricing tiers.',
      startedAt: new Date(Date.now() - 7200000), // 2 hours ago
      completedAt: new Date(Date.now() - 7000000),
      errorLog: 'Error: net::ERR_NAME_NOT_RESOLVED at https://non-existent-site-xyz.com',
    }).returning();

    console.log(`✅ Inserted agent run ID: ${run2.id}`);

    // 4. Insert Action Logs for Failed Run
    await db.insert(actionLogs).values([
      {
        runId: run2.id,
        stepIndex: 1,
        actionType: 'OPEN_BROWSER',
        thought: 'Starting the browser service.',
        parameters: { headless: true },
      },
      {
        runId: run2.id,
        stepIndex: 2,
        actionType: 'GOTO_URL',
        thought: 'Navigating to the requested site.',
        parameters: { url: 'https://non-existent-site-xyz.com' },
      },
      {
        runId: run2.id,
        stepIndex: 3,
        actionType: 'ERROR',
        thought: 'The browser failed to resolve the domain name. Logging error stack and stopping.',
        parameters: { error: 'net::ERR_NAME_NOT_RESOLVED' },
      }
    ]);

    console.log('✅ Inserted action logs for Failed Run.');
    console.log('🌱 Seeding process complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
