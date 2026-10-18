import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get GoogleGenAI client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
  });
});

// Safe public config endpoint (Never exposes secret keys!)
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    hasGemini: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  });
});

// AI Financial Chat endpoint
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [], financialContext } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY_MISSING',
        message: 'Google Gemini API key is not configured. Please set GEMINI_API_KEY in your environment or Secrets panel to enable AI Financial Assistant.',
      });
      return;
    }

    const currencySymbol = financialContext?.currencySymbol || '₹';
    const contextJson = JSON.stringify(financialContext || {}, null, 2);

    const systemInstruction = `You are SpendWise AI, an expert, insightful, and encouraging personal financial advisor.
Your mission and tagline is: "Understand Your Money. Improve Your Future."

STRICT FINANCIAL ACCURACY & REASONING RULES:
1. Ground every statement in the user's REAL financial context provided below.
2. The metrics in the context (opening balance, total balance, total income, total expenses, savings rate, category breakdowns, budgets, and savings goals) have ALREADY been precisely computed by the application logic. DO NOT fabricate or hallucinate transactions, numbers, or dates.
3. Always display currency figures using the user's currency symbol: ${currencySymbol}.
4. Clearly distinguish calculated historical facts (e.g., "In Food & Dining, you spent ${currencySymbol}12,500, which is 28% of your expenses") from estimates, projections, or behavioral recommendations (e.g., "If you allocate an additional ${currencySymbol}3,000 monthly, you will achieve your Emergency Fund 2 months earlier").
5. Structure answers with clean Markdown:
   - Use concise bold headings (### Summary, ### Key Findings, ### Actionable Recommendations)
   - Use bullet points with bold metrics
   - Offer specific, practical savings steps (e.g., 50/30/20 rule, subscription audits, high-utilization budget alerts)
6. Tone: Professional, empowering, constructive, and empathetic fintech advisor. Never scold; highlight opportunities for growth and celebrate progress.

USER CURRENT FINANCIAL CONTEXT:
${contextJson}`;

    // Format chat contents
    const contents: any[] = [];
    
    // Add history if present
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-6)) {
        contents.push({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.content || item.text || '' }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    const reply = response.text || 'I analyzed your financial data, but could not produce a response. Please try again.';

    res.json({
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    res.status(500).json({
      error: 'AI_GENERATION_FAILED',
      message: error?.message || 'Failed to generate financial analysis. Please try again.',
    });
  }
});

// AI Budget Recommendation endpoint
app.post('/api/ai/suggest-budget', async (req: Request, res: Response) => {
  try {
    const { monthlyIncome, categorySpending, currencySymbol = '₹' } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY_MISSING',
        message: 'Gemini API key is required for AI budget suggestions.',
      });
      return;
    }

    const prompt = `Analyze this user's monthly income and recent category spending:
Monthly Income: ${currencySymbol}${monthlyIncome || 0}
Category Spending (Past 30 days):
${JSON.stringify(categorySpending || {}, null, 2)}

Provide recommended realistic monthly budget limits for each category based on sound personal finance principles (like the 50/30/20 rule, realistic cuts, and healthy savings margins).
Return JSON with this exact schema:
{
  "recommendedTotalBudget": number,
  "savingsTarget": number,
  "categoryBudgets": [
    {
      "category": string,
      "recommendedLimit": number,
      "reasoning": string
    }
  ],
  "generalAdvice": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const text = response.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { generalAdvice: text };
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Error suggesting budget:', error);
    res.status(500).json({
      error: 'BUDGET_SUGGESTION_FAILED',
      message: error?.message || 'Failed to suggest budget.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SpendWise AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
