import { GoogleGenerativeAI } from '@google/generative-ai';
import { db, agentRuns } from '@genai/database';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Import all 8 modular tools
import { openBrowser } from './tools/openBrowser';
import { navigateToUrl } from './tools/navigateToUrl';
import { takeScreenshot } from './tools/takeScreenshot';
import { clickOnScreen } from './tools/clickOnScreen';
import { sendKeys } from './tools/sendKeys';
import { scroll } from './tools/scroll';
import { doubleClick } from './tools/doubleClick';
import { logToDb } from './tools/logToDb';

// Import detector
import { detectInteractiveElements, InteractiveElement } from './detector';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

interface AgentTask {
  runId: string;
  targetUrl: string;
  instructions?: string;
}

interface StepHistoryItem {
  stepIndex: number;
  action: string;
  thought: string;
  label: string;
}

export class AutonomousAgent {
  private stepCounter = 1;
  private stepHistory: StepHistoryItem[] = [];

  // Helper to parse JSON from potential markdown blocks returned by the model
  private parseResponse(rawText: string): any {
    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      return JSON.parse(cleaned.trim());
    } catch (e) {
      console.warn('Failed to parse Gemini output as JSON, attempting raw parsing:', rawText);
      // Fallback: try regex to extract JSON object
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error(`Invalid response format from Gemini: ${rawText}`);
    }
  }

  async run(task: AgentTask) {
    console.log(`Starting run session: ${task.runId}`);
    
    // First, insert the record so it exists before any subsequent updates
    await db.insert(agentRuns).values({
      id: task.runId,
      targetUrl: task.targetUrl,
      status: 'PENDING',
      instructions: task.instructions || null,
    });

    // Set run status to RUNNING in PostgreSQL
    await db.update(agentRuns)
      .set({ status: 'RUNNING' })
      .where(eq(agentRuns.id, task.runId));

    // Tool 1: openBrowser
    const { browser, context, page } = await openBrowser();
    await logToDb(db, {
      runId: task.runId,
      stepIndex: this.stepCounter,
      actionType: 'OPEN_BROWSER',
      thought: 'Launching Playwright Chromium browser and opening a clean tab.',
    });

    try {
      // Tool 2: navigateToUrl
      await navigateToUrl(page, task.targetUrl);
      
      // Wait for React application rendering to complete
      await page.waitForSelector('input', { timeout: 10000 });

      this.stepCounter++;
      
      // Tool 3: takeScreenshot
      const initialScreenshot = path.join('screenshots', `run-${task.runId}-step-1.png`);
      await takeScreenshot(page, initialScreenshot);

      await logToDb(db, {
        runId: task.runId,
        stepIndex: this.stepCounter,
        actionType: 'GOTO_URL',
        thought: `Navigating to target landing URL: ${task.targetUrl}`,
        parameters: { url: task.targetUrl },
        screenshotUrl: initialScreenshot,
      });

      this.stepHistory.push({
        stepIndex: this.stepCounter,
        action: 'GOTO_URL',
        thought: 'Navigated to the Shadcn Hook Form documentation page.',
        label: task.targetUrl,
      });

      let runLoop = true;
      const maxSteps = 15;

      while (runLoop && this.stepCounter <= maxSteps) {
        this.stepCounter++;

        // 1. SENSE Phase: Detect elements on the current page
        const elements = await detectInteractiveElements(page);
        
        // Tool 3: takeScreenshot
        const screenshotPath = path.join('screenshots', `run-${task.runId}-step-${this.stepCounter}.png`);
        await takeScreenshot(page, screenshotPath);

        const elementsListText = elements
          .map(e => `[ID: ${e.id}] tag: <${e.tagName}> role: "${e.role}" label: "${e.label}" (coords: x=${e.x}, y=${e.y})`)
          .join('\n');

        const pastStepsText = this.stepHistory
          .map(h => `- Step ${h.stepIndex}: Action: ${h.action} | Thought: "${h.thought}" | Element: "${h.label}"`)
          .join('\n');

        // 2. THINK Phase: Prompt Gemini
        const instructionsText = task.instructions
          ? `CRITICAL CUSTOM INSTRUCTIONS TO FOLLOW:\n${task.instructions}`
          : `Objective: 
1. Identify the input fields (e.g. Name, Username, Title) and description/textarea fields on the page.
2. Fill them with dynamic, realistic demo data (for Username, you can enter "Sameer Khan", and for Description/Bio, you can enter "AI engineer building GradeBench").
3. Click the Submit/Submit Form button to complete the form submission.
4. When both fields are filled and the form is submitted, call action: "done".`;

        const prompt = `
You are an autonomous web automation agent controlling a browser.
Your current target URL is: ${task.targetUrl}

${instructionsText}

Rules:
- Do NOT navigate to any other URL unless required to submit the form.
- Do NOT attempt login or account creation unless explicitly asked.
- If a field is already correctly filled, skip it.
- Call action "done" as soon as the objective is met, or if you verify a success toast/state is showing.

Currently visible interactive elements:
${elementsListText}

Past steps taken:
${pastStepsText || 'None yet'}

Your task is to identify the next single action to take. Return ONLY a JSON object matching this schema, with NO extra markdown or conversational text wrapping:
{
  "thought": "Your high-level reasoning for choosing this action.",
  "action": "click" | "send_keys" | "scroll" | "double_click" | "done" | "finish",
  "elementId": number,
  "text": "string (applicable only for send_keys action)"
}
`;

        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();

        const decision = this.parseResponse(textResponse);
        console.log(`[Decision Step ${this.stepCounter}]: Action = ${decision.action}, Thought = ${decision.thought}`);

        if (decision.action === 'finish' || decision.action === 'done') {
          await logToDb(db, {
            runId: task.runId,
            stepIndex: this.stepCounter,
            actionType: 'FINISH',
            thought: decision.thought,
            screenshotUrl: screenshotPath,
          });
          runLoop = false;
          break;
        }

        // Find the designated element
        const target = elements.find(e => e.id === decision.elementId);
        if (!target && decision.action !== 'scroll') {
          throw new Error(`LLM attempted to interact with element ID ${decision.elementId} which is not currently visible on page.`);
        }

        // 3. ACT Phase: Execute appropriate tool
        switch (decision.action) {
          case 'click':
            await clickOnScreen(page, target!.x, target!.y);
            await logToDb(db, {
              runId: task.runId,
              stepIndex: this.stepCounter,
              actionType: 'CLICK',
              thought: decision.thought,
              parameters: { x: target!.x, y: target!.y, label: target!.label },
              screenshotUrl: screenshotPath,
            });
            this.stepHistory.push({
              stepIndex: this.stepCounter,
              action: 'CLICK',
              thought: decision.thought,
              label: target!.label,
            });
            break;

          case 'send_keys':
            await sendKeys(page, target!.x, target!.y, decision.text);
            await logToDb(db, {
              runId: task.runId,
              stepIndex: this.stepCounter,
              actionType: 'SEND_KEYS',
              thought: decision.thought,
              parameters: { x: target!.x, y: target!.y, text: decision.text, label: target!.label },
              screenshotUrl: screenshotPath,
            });
            this.stepHistory.push({
              stepIndex: this.stepCounter,
              action: 'SEND_KEYS',
              thought: decision.thought,
              label: target!.label,
            });
            break;

          case 'scroll':
            const scrollDistance = 400;
            await scroll(page, scrollDistance);
            await logToDb(db, {
              runId: task.runId,
              stepIndex: this.stepCounter,
              actionType: 'SCROLL',
              thought: decision.thought,
              parameters: { distance: scrollDistance },
              screenshotUrl: screenshotPath,
            });
            this.stepHistory.push({
              stepIndex: this.stepCounter,
              action: 'SCROLL',
              thought: decision.thought,
              label: `Scroll down ${scrollDistance}px`,
            });
            break;

          case 'double_click':
            await doubleClick(page, target!.x, target!.y);
            await logToDb(db, {
              runId: task.runId,
              stepIndex: this.stepCounter,
              actionType: 'DOUBLE_CLICK',
              thought: decision.thought,
              parameters: { x: target!.x, y: target!.y, label: target!.label },
              screenshotUrl: screenshotPath,
            });
            this.stepHistory.push({
              stepIndex: this.stepCounter,
              action: 'DOUBLE_CLICK',
              thought: decision.thought,
              label: target!.label,
            });
            break;

          default:
            throw new Error(`Unknown action type decided by model: ${decision.action}`);
        }

        // Wait a short time for state updates or animation renders
        await page.waitForTimeout(1500);
      }

      if (this.stepCounter > maxSteps) {
        console.warn('Exceeded maximum allowed execution steps (15). Failing run.');
        await db.update(agentRuns)
          .set({ status: 'FAILED', completedAt: new Date(), errorLog: 'Max step limit (15) reached without finishing.' })
          .where(eq(agentRuns.id, task.runId));
      } else {
        await db.update(agentRuns)
          .set({ status: 'COMPLETED', completedAt: new Date() })
          .where(eq(agentRuns.id, task.runId));
      }

    } catch (err: any) {
      console.error('Execution failure inside Sense-Think-Act loop:', err);
      
      await logToDb(db, {
        runId: task.runId,
        stepIndex: this.stepCounter,
        actionType: 'ERROR',
        thought: `Encountered runtime error: ${err.message}`,
        parameters: { error: err.message },
      });

      await db.update(agentRuns)
        .set({ status: 'FAILED', completedAt: new Date(), errorLog: err.message })
        .where(eq(agentRuns.id, task.runId));
    } finally {
      await browser.close();
    }
  }
}

// Instantiate and launch the autonomous web agent session inside CLI mode only
const isMainScript = process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'));
if (isMainScript) {
  const args = process.argv.slice(2);
  const targetUrl = args[0] || 'https://ui.shadcn.com/docs/forms/react-hook-form';

  console.log(`Resolved agent target URL: ${targetUrl}`);

  const agent = new AutonomousAgent();
  agent.run({
    runId: crypto.randomUUID(),
    targetUrl,
  }).catch(err => {
    console.error('Fatal initialization error inside entrypoint:', err);
  });
}
