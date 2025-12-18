import { GoogleGenAI, Type } from "@google/genai";
import { Subject, AIResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const processLearningRequest = async (
  subject: Subject,
  prompt: string,
  imageData?: string
): Promise<AIResponse> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: imageData 
      ? { parts: [{ inlineData: { mimeType: 'image/jpeg', data: imageData.split(',')[1] } }, { text: prompt }] }
      : { parts: [{ text: prompt }] },
    config: {
      systemInstruction: `Bạn là một "Copilot" điều phối hệ thống AI Cộng sinh dành cho học sinh Việt Nam theo CTGDPT 2018. 
      Nhiệm vụ của bạn là phân tích yêu cầu của người dùng về môn ${subject} và trả về kết quả dưới dạng JSON có cấu trúc 5 phần:
      1. socratic: Giải thích từng bước, gợi mở tư duy (phong cách Socratic).
      2. notebookLM: Trình bày cơ sở lý thuyết, định nghĩa, định lý cốt lõi.
      3. perplexity: Phân tích thực tiễn, mở rộng kiến thức, liên hệ bài toán nâng cao.
      4. specialized: 
         - Nếu là Toán: Trình bày như máy tính Casio 580 (công thức, kết quả số, phím bấm).
         - Nếu là GDKTPL: Trích dẫn văn bản pháp luật chính xác.
         - Nếu là Lịch sử: Trích dẫn tư liệu lịch sử, nguồn chính thống.
      5. diagram: Một sơ đồ Mermaid.js hoặc cấu trúc text rõ ràng để hệ thống hóa kiến thức.
      
      Phản hồi PHẢI là JSON nguyên bản, không kèm markdown code blocks.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          socratic: { type: Type.STRING },
          notebookLM: { type: Type.STRING },
          perplexity: { type: Type.STRING },
          specialized: { type: Type.STRING },
          diagram: { type: Type.STRING },
        },
        required: ["socratic", "notebookLM", "perplexity", "specialized", "diagram"]
      }
    }
  });

  const text = response.text;
  try {
    if (!text) throw new Error("No text returned from model");
    return JSON.parse(text) as AIResponse;
  } catch (e) {
    console.error("Failed to parse AI response", e, "Raw text:", text);
    throw new Error("Lỗi xử lý dữ liệu từ AI.");
  }
};