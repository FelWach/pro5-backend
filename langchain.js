const { OpenAI } = require("langchain/llms/openai");
const { config } = require("dotenv");
const { PromptTemplate } = require("langchain/prompts");

config();
const model = new OpenAI({ temperature: 0.9 });

let lan = "en";
let lanLevel = "B1";
let diff = "medium";

function setConfiguration(language, languageLevel, difficulty, temperature) {
  if (temperature < 0 || temperature > 1) {
    temperature = temperature / 100;
  }

  lan = language;
  lanLevel = languageLevel;
  diff = difficulty;

  model.temperature = temperature;
}

async function generateAnswer(topic, prevQuestion = "") {
  let prompt = "";

  prompt = PromptTemplate.fromTemplate(
    `Please generate a learning question and answer it. The topic is {topic}. Please start each Question with "Q:" and each Answer with "A:" Please write these and answers in the following language: {language} and keep a {languageLevel} language level. The questions should be of difficulty {difficulty} The following questions have already been asked: {prevQuestion}. Please chose Questions that cover another aspect of {topic}.`
  );

  const formattedPrompt = await prompt.format({
    topic: topic,
    prevQuestion: prevQuestion,
    language: lan,
    languageLevel: lanLevel,
    difficulty: diff,
  });

  const res = await model.call(formattedPrompt);
  return res;
}

module.exports = {
  generateAnswer,
  setConfiguration,
};
