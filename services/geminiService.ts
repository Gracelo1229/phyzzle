
import { GoogleGenAI, Type } from "@google/genai";
import { ChallengeTopic, PhysicsQuestion, WordChallenge } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateKawaiiPrincess = async (): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: "A high-quality 3D realistic kawaii princess character, laboratory researcher style, cute big eyes, pink hair, wearing a white scientist coat, soft cinematic lighting, 8k resolution, Unreal Engine 5 render style, adorable and vibrant." }]
    },
    config: {
      imageConfig: { aspectRatio: "1:1" }
    }
  });

  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  if (part?.inlineData) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=200&auto=format&fit=crop"; // Fallback
};

export const generatePhysicsQuestion = async (topic: ChallengeTopic): Promise<PhysicsQuestion> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a multiple choice educational question focusing on the topic: ${topic}. 
    The question should be engaging and suitable for a general knowledge challenge. 
    If the topic is IQ Science, provide a logic or observation-based science puzzle.
    If English, provide a grammar or vocabulary challenge.
    Return the result in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          topic: { type: Type.STRING },
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          correctIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING }
        },
        required: ["id", "topic", "question", "options", "correctIndex", "explanation"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return {
      id: 'err-1',
      topic: topic,
      question: "Which of these is a primary color in additive color mixing (light)?",
      options: ["Green", "Yellow", "Purple", "Orange"],
      correctIndex: 0,
      explanation: "The primary colors of light are Red, Green, and Blue (RGB)."
    };
  }
};

export const generateWordChallenge = async (): Promise<WordChallenge> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a single English word for a guessing game. The word should be related to science, lab, or academic subjects. 
    Provide the word, a clear hint, and a scrambled version of the word.
    Return the result in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          hint: { type: Type.STRING },
          scrambled: { type: Type.STRING }
        },
        required: ["word", "hint", "scrambled"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (error) {
    return { word: "GRAVITY", hint: "The force that pulls objects toward Earth", scrambled: "YIVTRAG" };
  }
};
