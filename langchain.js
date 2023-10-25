const { OpenAI } = require("langchain/llms/openai");
const { config } = require("dotenv");

config();
const model = new OpenAI({ temperature: 0.9 });

async function generateAnswer(text) {
  const res = await model.call(`What is meant by ${text}?`);
  return res;
}

module.exports = {
  generateAnswer,
};
