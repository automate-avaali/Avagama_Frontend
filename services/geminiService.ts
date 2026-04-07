import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiService = {
  refinePrompt: async (currentPrompt: string, feedback: string) => {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `You are an expert AI prompt engineer. Your task is to refine a system prompt based on user feedback.
      
Current System Prompt:
${currentPrompt}

User Feedback:
${feedback}

Generate the refined system prompt. Return ONLY the new system prompt text.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      }
    });

    return response.text;
  }
};
