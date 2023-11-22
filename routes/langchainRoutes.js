const { generateAnswer, setConfiguration } = require("../langchain.js");
const { addEntry } = require("../db/dbFunctions.js");
const {
  splitQuestionAnswer,
  removeNewlines,
} = require("../helperFunctions.js");
const pdfParse = require("pdf-parse");

const express = require("express");
const router = express.Router();

router.post("/generate", async (req, res) => {
  const { topic, nbQuestions } = req.body;

  questionAmount = nbQuestions;

  let answer = "";

  let prevQuestion = "";

  for (let i = 0; i < questionAmount; i++) {
    let generatedAnswer = await generateAnswer(topic, prevQuestion);
    let { question, answer } = splitQuestionAnswer(generatedAnswer);

    let currentQuestion = question.trim();
    let currentAnswer = answer.trim();

    addEntry(1, topic, currentQuestion, currentAnswer);
    answer += generatedAnswer;
    prevQuestion = currentQuestion;
    console.log(prevQuestion);
  }

  res.send("Entry generated and stored in database!");
});

router.post("/generate/:topic", async (req, res) => {
  const { nbQuestions } = req.body;
  topic = req.params.topic;

  questionAmount = nbQuestions;
  let answer = "";

  let prevQuestion = "";

  for (let i = 0; i < questionAmount; i++) {
    let generatedAnswer = await generateAnswer(topic, prevQuestion);
    let { question, answer } = splitQuestionAnswer(generatedAnswer);

    let currentQuestion = question.trim();
    let currentAnswer = answer.trim();

    addEntry(1, topic, currentQuestion, currentAnswer);
    answer += generatedAnswer;
    prevQuestion = currentQuestion;
    console.log(prevQuestion);
  }

  res.send("Entry generated and stored in database!");
});

router.post("/setConfiguration", async (req, res) => {
  const { language, languageLevel, difficulty, temperature } = req.body;

  setConfiguration(language, languageLevel, difficulty, temperature);

  res.json({
    message: `Configuration set successfully with the following parameters: language = ${language}, languageLevel = ${languageLevel}, difficulty = ${difficulty}, temperature = ${temperature}`,
  });
});

router.post("/upload", async (req, res) => {
  try {
    const { uri, name, size } = req.body;

    if (!uri) {
      return res.status(400).json({ error: "Missing PDF data" });
    }

    //store in name, uri and size in pdf-table

    const data = await parsePDF(uri);

    const text = removeNewlines(data.text);

    res.json({ pdfText: text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function parsePDF(uri) {
  const data = await pdfParse(uri);
  return data;
}

module.exports = router;
