const { OpenAI } = require("langchain/llms/openai");
const { config } = require("dotenv");
const { PromptTemplate } = require("langchain/prompts");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { HuggingFaceInference } = require("langchain/llms/hf");

config();

const modelName = "gpt-3.5-turbo-instruct";
//const modelName = "text-davinci-003";
//const modelName = "mistralai/Mistral-7B-v0.1";

const model = new OpenAI(
  { 
  modelName: modelName,
  temperature: 0.9 
  });

  // const model = new HuggingFaceInference({
  //   model: modelName,
  //   temperature: 0.9 
  // });  

console.log(model);

let lan = "en";
let lanLevel = "B1";
let diff = "medium";
let docs = [];

async function loadPDF(uri) {
  if (!uri) {
    return -1;
  }
  const loader = new PDFLoader(uri);

  docs = await loader.load();

  //shuffleArray(docs);

  return docs;
}

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
    `Please generate a learning question and answer it. 
    The topic is {topic}. Please start each Question with "Q:" and each Answer with "A:". 
    Please write these and answers in the following language: {language} and keep a {languageLevel} language level. 
    The questions should be of difficulty {difficulty}. 
    The following questions have already been asked: {prevQuestion}. 
    Please generate Questions and Answers that cover a different aspect of {topic}.`
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

async function generateFromDocs(topic) {
  let output = "";

  let prompt = "";

  prompt = PromptTemplate.fromTemplate(
    `Please generate a learning question and answer it. 
    The question should be about: {topic}. 
    Please start each Question with "Q:" and each Answer with "A:". 
    Please write these and answers in the following language: {language} and keep a {languageLevel} language level. 
    The questions should be of difficulty {difficulty}. `
  );

  const formattedPrompt = await prompt.format({
    topic: topic,
    language: lan,
    languageLevel: lanLevel,
    difficulty: diff,
  });

  output = await model.call(formattedPrompt);

  return output;
}

async function getTopic(input) {
  let text = input;

  prompt = PromptTemplate.fromTemplate(
    `Categorize the following text in the following language {language}! The Output must start with "Topic:" and must not be longer than 4 words! Do not generate any text before or after the "Topic" output! This is the text: {text}.`
  );

  const formattedPrompt = await prompt.format({
    text: text,
    language: lan,
  });

  const res = await model.call(formattedPrompt);
  return res;
}

module.exports = {
  generateAnswer,
  setConfiguration,
  getTopic,
  loadPDF,
  generateFromDocs,
};
