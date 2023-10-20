import { OpenAI } from "langchain/llms/openai";
import { config } from "dotenv";
config();
const model = new OpenAI({ temperature: 0.9 });

export async function generateAnswer(text) {
  const res = await model.call(`What is meant by ${text}?`);
  return res;
}
