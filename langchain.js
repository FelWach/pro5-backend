const { OpenAI } = require("langchain/llms/openai");
const { config } = require("dotenv");
const { PromptTemplate } = require("langchain/prompts");

config();
const model = new OpenAI({ temperature: 0.9 });

async function generateAnswer(topic, nbQuestions, language = "en") {
  let prompt = "";

  let lan = language;

  if (language == "en") {
    lan = "english";
  } else if (language == "de") {
    lan = "german";
  }

  const singleQuestionPrompt = PromptTemplate.fromTemplate(
    `Please generate a learning question and answer it. The topic is {topic}. Please write these questions and answers in the following language: ${lan}`
  );

  const multiQuestionPrompt = PromptTemplate.fromTemplate(
    `Please generate {nbQuestions} learning questions and answer them. Please start each Question with Question (number of question): and each Answer with Answer (number of answer): .The topic is {topic}. Please write these questions and answers in the following language: ${lan}`
  );

  if (nbQuestions == 1) {
    prompt = singleQuestionPrompt;
  } else {
    prompt = multiQuestionPrompt;
  }

  const formattedPrompt = await prompt.format({
    topic: topic,
    nbQuestions: nbQuestions,
  });

  const res = await model.call(formattedPrompt);
  return res;
}

async function finishAnswer(text, nbQuestions) {
  const prompt = PromptTemplate.fromTemplate(
    `Please finish this previous text if it isn't already or if it is missing questions. There should be {nbQuestions} questions and answers: {text}`
  );

  const formattedPrompt = await prompt.format({
    text: text,
    nbQuestions: nbQuestions,
  });

  const res = await model.call(formattedPrompt);
  const full = text + res;
  return full;
}

module.exports = {
  generateAnswer,
  finishAnswer,
};
