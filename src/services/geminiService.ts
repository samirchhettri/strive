import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Challenge {
  id: string;
  text: string;
  category: "Fitness" | "Productivity" | "Social" | "Mindset";
  points: number;
}

export async function generateDailyChallenges(): Promise<Challenge[]> {
  const prompt = `Generate 3 high-energy daily challenges for a person looking to improve themselves. 
  Keep them short (one sentence), realistic (5-30 mins), and action-based. 
  Assign a point value between 10 and 30 XP based on effort.
  
  Categories must be one of: Fitness, Productivity, Social, Mindset.
  Each of the 3 challenges should preferably be from a different category.
  
  Return as a JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              category: { type: Type.STRING },
              points: { type: Type.NUMBER }
            },
            required: ["id", "text", "category", "points"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating challenges:", error);
    // Fallback challenges
    return [
      { id: "fb1", text: "Do 15 pushups right now.", category: "Fitness", points: 15 },
      { id: "fb2", text: "Write down your 3 top goals for today.", category: "Productivity", points: 20 },
      { id: "fb3", text: "Compliment a stranger or a friend.", category: "Social", points: 25 }
    ];
  }
}
