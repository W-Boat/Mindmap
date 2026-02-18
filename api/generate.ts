import { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

interface DeepSeekRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature: number;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const callDeepSeekAPI = (body: DeepSeekRequest): Promise<string> => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.deepseek.com',
      port: 443,
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response: DeepSeekResponse = JSON.parse(data);
          if (response.choices && response.choices[0] && response.choices[0].message) {
            resolve(response.choices[0].message.content);
          } else {
            reject(new Error('Invalid response structure from DeepSeek API'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse DeepSeek response: ${error}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`DeepSeek API request failed: ${error.message}`));
    });

    req.write(JSON.stringify(body));
    req.end();
  });
};

export default async (req: VercelRequest, res: VercelResponse) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { topic } = req.body;

  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    res.status(400).json({ error: 'Topic is required and must be a non-empty string' });
    return;
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('DEEPSEEK_API_KEY environment variable is not set');
    res.status(500).json({ error: 'Server configuration error: API key not set' });
    return;
  }

  try {
    const prompt = `
Create a comprehensive mind map about the following topic: "${topic.trim()}".

Format the output strictly as Markdown compatible with Markmap (using # for root, ## for level 2, ### for level 3, - for list items).
Do not include any conversational text, code blocks (like \`\`\`markdown), or explanations.
Start directly with the root node (# Title).
Ensure the hierarchy is logical and deep.`;

    const requestBody: DeepSeekRequest = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a specialized Mind Map generator. You output raw Markdown only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    };

    const content = await callDeepSeekAPI(requestBody);

    // Clean up if the model accidentally wrapped it in code blocks
    let cleanedContent = content
      .replace(/^```markdown\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    res.status(200).json({ content: cleanedContent });
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `Failed to generate content: ${errorMessage}` });
  }
};
