const { OpenAI } = require("langchain/llms/openai");
const { config } = require("dotenv");
const { PromptTemplate } = require("langchain/prompts");

config();
const model = new OpenAI({ temperature: 0.9 });

async function generateAnswer(topic, language = "en", prevQuestion = "") {
  let prompt = "";

  let lan = language;

  if (language == "en") {
    lan = "english";
  } else if (language == "de") {
    lan = "german";
  }

  prompt = PromptTemplate.fromTemplate(
    `Please generate a learning question and answer it. The topic is {topic}. Please start each Question with "Q:" and each Answer with "A:" Please write these and answers in the following language: ${lan}. The following questions have already been asked: {prevQuestion}. Please chose Questions that cover another aspect of {topic}.`
  );

  const formattedPrompt = await prompt.format({
    topic: topic,
    prevQuestion: prevQuestion,
  });

  const res = await model.call(formattedPrompt);
  return res;
}

module.exports = {
  generateAnswer,
};
