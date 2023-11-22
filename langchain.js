const { OpenAI } = require("langchain/llms/openai");
const { config } = require("dotenv");
const { PromptTemplate } = require("langchain/prompts");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");

config();

const model = new OpenAI({ temperature: 0.9 });

let lan = "en";
let lanLevel = "B1";
let diff = "medium";

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function loadPDF(uri) {
  const loader = new PDFLoader(uri);

  const docs = await loader.load();

  shuffleArray(docs);

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
    `Categorize the following text! The Output must start with "Topic:" and must not be longer than 4 words! Do not generate any text before or after the "Topic" output! This is the text: {text}.`
  );

  const formattedPrompt = await prompt.format({
    text: text,
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
