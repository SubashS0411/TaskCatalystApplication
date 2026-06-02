import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/parse-tasks', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an AI task assistant. The user provides a messy "Brain Dump" of their tasks.
Extract the tasks and structure them into a JSON array. Each object in the array should have:
- "title": a clear, concise task title (string).
- "description": brief context or details (string or null).
- "isUrgent": boolean, based on the Eisenhower Matrix.
- "isImportant": boolean, based on the Eisenhower Matrix.
- "dueDate": ISO 8601 timestamp string if a deadline is mentioned, else null.
- "estimatedTime": number, estimated time to complete in minutes based on typical duration.

Brain Dump: ${text}`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                isUrgent: { type: Type.BOOLEAN },
                isImportant: { type: Type.BOOLEAN },
                dueDate: { type: Type.STRING },
                estimatedTime: { type: Type.INTEGER }
              },
              required: ['title', 'isUrgent', 'isImportant', 'estimatedTime']
            }
          }
        }
      });

      const jsonStr = response.text;
      if (!jsonStr) {
         throw new Error("No response from model");
      }
      
      const parsedTasks = JSON.parse(jsonStr);
      res.json({ tasks: parsedTasks });
    } catch (error: any) {
      console.error('Error parsing tasks:', error);
      res.status(500).json({ error: error.message || 'Failed to parse tasks' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
