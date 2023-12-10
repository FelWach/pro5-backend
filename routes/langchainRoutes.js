const {
  generateAnswer,
  setConfiguration,
  getTopic,
  loadPDF,
  generateFromDocs,
} = require("../langchain.js");
const { addEntry } = require("../db/dbFunctions.js");
const {
  splitQuestionAnswer,
  removeNewlines,
  removeBeforeAndIncludingTopic,
  setCurrentUserId,
  getCurrentUserId,
} = require("../helperFunctions.js");

const express = require("express");
const router = express.Router();
const formidable = require("formidable");

const fs = require("fs");
const path = require("path");

let pdfUri = "";
let pdfName = "";

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

    addEntry(getCurrentUserId(), topic, currentQuestion, currentAnswer);
    answer += generatedAnswer;
    prevQuestion = currentQuestion;
    console.log(prevQuestion);
  }

  res.send("Entries generated and stored in database!");
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

    addEntry(getCurrentUserId(), topic, currentQuestion, currentAnswer);
    answer += generatedAnswer;
    prevQuestion = currentQuestion;
    console.log(prevQuestion);
  }

  res.send("Entries generated and stored in database!");
});

router.post("/setConfiguration", async (req, res) => {
  const { language, languageLevel, difficulty, temperature } = req.body;

  setConfiguration(language, languageLevel, difficulty, temperature);

  res.json({
    message: `Configuration set successfully with the following parameters: language = ${language}, languageLevel = ${languageLevel}, difficulty = ${difficulty}, temperature = ${temperature}`,
  });
});

router.post("/upload", async (req, res) => {
  const form = new formidable.IncomingForm({ multiples: true });
  const [fields, files] = await form.parse(req);

  const pdfFiles = files.pdfFile;

  if (pdfFiles && pdfFiles.length > 0) {
    const pdfFile = pdfFiles[0];

    const uri = pdfFile.path || pdfFile.filepath;

    if (!uri) {
      return res.status(400).json({ error: "Missing PDF data" });
    }

    try {
      const docs = await loadPDF(uri);

      pdfUri = uri;

      const totalNbPages = docs.length;

      console.log("totalNbPages:", totalNbPages);

      res.json({
        message: "Possible pages to generate from: " + totalNbPages,
        pages: totalNbPages,
      });
    } catch (error) {
      console.error("Error loading PDF:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    console.error("No PDF file uploaded");
    res.status(400).json({ error: "No PDF file uploaded" });
  }
});

router.post("/generateFromDocs", async (req, res) => {
  const { nbQuestions, pageStart, pageEnd } = req.body;

  const docs = await loadPDF(pdfUri);

  let prevQuestion = "";

  if (docs === -1) {
    return res.status(400).json({ error: "No PDF uploaded" });
  }

  try {
    if (!pageStart && !pageEnd) {
      //if no pageStart and pageEnd is given, generate random from all pages
      for (let i = docs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [docs[i], docs[j]] = [docs[j], docs[i]];
      }

      for (let i = 0; i < nbQuestions; i++) {
        let topic = await getTopic(docs[i].pageContent);

        topic = removeBeforeAndIncludingTopic(topic);

        console.log(topic);

        let generatedAnswer = await generateAnswer(topic, prevQuestion);

        console.log(generatedAnswer);

        let { question, answer } = splitQuestionAnswer(generatedAnswer);

        let currentQuestion = question.trim();
        let currentAnswer = answer.trim();

        prevQuestion = currentQuestion;

        addEntry(getCurrentUserId(), pdfName, currentQuestion, currentAnswer);
        //answer += generatedAnswer;
      }
    } else if (!pageEnd) {
      //if only pageStart is given, generate only for the given page and nbQuestions
      for (let i = 0; i < nbQuestions; i++) {
        let topic = await getTopic(docs[pageStart].pageContent);

        topic = removeBeforeAndIncludingTopic(topic);

        console.log(topic);

        let generatedAnswer = await generateAnswer(topic, prevQuestion);

        console.log(generatedAnswer);

        let { question, answer } = splitQuestionAnswer(generatedAnswer);

        let currentQuestion = question.trim();
        let currentAnswer = answer.trim();

        prevQuestion = currentQuestion;

        addEntry(getCurrentUserId(), topic, currentQuestion, currentAnswer);
        //answer += generatedAnswer;
      }
    } else if (pageStart && pageEnd) {
      //if pageStart and pageEnd is given, generate for each page nbQuestions in between
      for (let i = pageStart; i < pageEnd; i++) {
        for (let j = 0; j < nbQuestions; j++) {
          let topic = await getTopic(docs[i].pageContent);

          topic = removeBeforeAndIncludingTopic(topic);

          console.log(topic);

          let generatedAnswer = await generateAnswer(topic, prevQuestion);

          console.log(generatedAnswer);

          let { question, answer } = splitQuestionAnswer(generatedAnswer);

          let currentQuestion = question.trim();
          let currentAnswer = answer.trim();

          prevQuestion = currentQuestion;

          addEntry(getCurrentUserId(), topic, currentQuestion, currentAnswer);
          //answer += generatedAnswer;
        }
      }
    }

    res.json({ message: "stored questions and answers in db" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
