import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
    try {
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-pro',
            contents: 'Respond with OK',
        });
        for await (const chunk of responseStream) {
            process.stdout.write(chunk.text);
        }
        console.log('\\nSuccess!');
    } catch (err) {
        console.error('Fetch failed exactly as in the CLI:', err);
    }
}
test();
