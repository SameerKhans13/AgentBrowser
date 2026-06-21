import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = (await res.json()) as any;
    if (data.error) {
      console.error('API Error:', data.error.message);
      return;
    }
    console.log('Available models for your key:');
    if (data.models) {
      for (const m of data.models) {
        console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
      }
    } else {
      console.log('No models returned. Response:', JSON.stringify(data));
    }
  } catch (err: any) {
    console.error('Request failed:', err.message);
  }
}

listModels();
