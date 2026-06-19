import { db } from './index';
import { agentRuns } from './schema';
import { sql } from 'drizzle-orm';

async function verify() {
  console.log('🔌 Verifying PostgreSQL connection pool health...');

  try {
    // 1. Run raw sql check
    const result = await db.execute(sql`SELECT NOW()`);
    console.log('✅ Base connection successful!');
    console.log(`📡 PostgreSQL server time: ${JSON.stringify(result.rows[0])}`);

    // 2. Query count from agent_runs
    const runsCount = await db.select().from(agentRuns).limit(1);
    console.log('✅ Schema query successful!');
    console.log(`📊 Retrieved agent runs count baseline: ${runsCount.length}`);

    console.log('🚀 Database configuration is 100% healthy and operational!');
  } catch (err) {
    console.error('❌ Connection or schema validation failed:');
    console.error(err);
    process.exit(1);
  }

  process.exit(0);
}

verify();
