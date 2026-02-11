
// import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// // Always use the named parameter and environment variable directly
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// export const getGeminiResponse = async (prompt: string, history: { role: string, parts: { text: string }[] }[] = []) => {
//   try {
//     // Call generateContent directly with the model name and contents
//     const response: GenerateContentResponse = await ai.models.generateContent({
//       model: 'gemini-3-flash-preview',
//       contents: [
//         ...history.map(h => ({ role: h.role, parts: h.parts })),
//         { role: 'user', parts: [{ text: prompt }] }
//       ],
//       config: {
//         systemInstruction: "You are ZenAI, a world-class creative assistant. Your goal is to help developers and creatives brainstorm, plan, and execute projects efficiently. Keep your tone professional yet inspiring. Use Markdown for formatting.",
//         temperature: 0.7,
//       }
//     });

//     // Access the text property directly from the response
//     return response.text;
//   } catch (error) {
//     console.error("Gemini API Error:", error);
//     return "I'm sorry, I encountered an error while processing your request. Please check your connection and try again.";
//   }
// };

// export const generateTasksFromGoal = async (goal: string) => {
//   try {
//     // Use responseSchema for controlled JSON output
//     const response: GenerateContentResponse = await ai.models.generateContent({
//       model: 'gemini-3-flash-preview',
//       contents: `Given the goal: "${goal}", break it down into exactly 5 actionable tasks.`,
//       config: {
//         responseMimeType: "application/json",
//         responseSchema: {
//           type: Type.ARRAY,
//           items: {
//             type: Type.OBJECT,
//             properties: {
//               title: {
//                 type: Type.STRING,
//                 description: 'Description of the task',
//               },
//               priority: {
//                 type: Type.STRING,
//                 enum: ['low', 'medium', 'high'],
//                 description: 'Priority level of the task',
//               },
//             },
//             required: ["title", "priority"],
//             propertyOrdering: ["title", "priority"],
//           },
//         },
//       }
//     });
    
//     // Access response.text and parse safely
//     const jsonStr = response.text || '[]';
//     return JSON.parse(jsonStr.trim());
//   } catch (error) {
//     console.error("Task Generation Error:", error);
//     return [];
//   }
// };
