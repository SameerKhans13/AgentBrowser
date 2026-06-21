import * as dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/genai',
});

export const db = drizzle(pool, { schema });
export const { agentRuns, actionLogs, runStatusEnum, actionTypeEnum } = schema;
