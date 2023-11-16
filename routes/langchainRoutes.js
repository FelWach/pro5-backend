const { generateAnswer, setConfiguration } = require("../langchain.js");
const { addEntry } = require("../dbFunctions.js");
const { splitQuestionAnswer } = require("../helperFunctions.js");

const express = require("express");
const router = express.Router();

router.post("/generateAnswer", async (req, res) => {
  const { topic, nbQuestions } = req.body;

  storedData = topic;
  questionAmount = nbQuestions;

  let answer = "";

  let prevQuestion = "";

  for (let i = 0; i < questionAmount; i++) {
    let generatedAnswer = await generateAnswer(storedData, prevQuestion);
    let { question, answer } = splitQuestionAnswer(generatedAnswer);

    let currentQuestion = question.trim();
    let currentAnswer = answer.trim();

    addEntry(1, topic, currentQuestion, currentAnswer);
    answer += generatedAnswer;
    prevQuestion = currentQuestion;
    console.log(prevQuestion);
  }

  res.send(answer);
});

router.post("/setConfiguration", async (req, res) => {
  const { language, languageLevel, difficulty, temperature } = req.body;

  setConfiguration(language, languageLevel, difficulty, temperature);

  res.json({
    message: `Configuration set successfully with the following parameters: language = ${language}, languageLevel = ${languageLevel}, difficulty = ${difficulty}, temperature = ${temperature}`,
  });
});

module.exports = router;
