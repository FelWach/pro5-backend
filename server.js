const express = require("express");
const cors = require("cors");
const { generateAnswer, setConfiguration } = require("./langchain.js");
const { config } = require("dotenv");
const bodyParser = require("body-parser");
const {
  addUser,
  getAllUsers,
  deleteUserAndHistory,
  addHistoryEntry,
  getUserHistory,
  deleteHistoryEntry,
  getQuestionsAndAnswers,
  getQuestionById,
  getAllQuestionsAndAnswers,
  getQuestionsByUserAndTopic,
} = require("./dbFunctions.js");

const { extractBeforeA, splitQuestionAnswer } = require("./helperFunctions.js");

config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

let storedData = "";
let text = "";
let questionAmount;
let lan;

app.use(express.json());

app.post("/addUser", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, E-Mail und Passwort erforderlich" });
  }

  try {
    const userId = await addUser(name, email, password);
    res.json({ message: "Benutzer wurde hinzugefügt", userId });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Hinzufügen des Benutzers" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Abrufen der Benutzer" });
  }
});

app.post("/generateAnswer", async (req, res) => {
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

    addHistoryEntry(1, topic, currentQuestion, currentAnswer);
    answer += generatedAnswer;
    prevQuestion = currentQuestion;
    console.log(prevQuestion);
  }

  res.send(answer);
});

app.post("/setConfiguration", async (req, res) => {
  const { language, languageLevel, difficulty, temperature } = req.body;

  setConfiguration(language, languageLevel, difficulty, temperature);

  res.json({
    message: `Configuration set successfully with the following parameters: language = ${language}, languageLevel = ${languageLevel}, difficulty = ${difficulty}, temperature = ${temperature}`,
  });
});

app.delete("/deleteUser/:id", async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ message: "Benutzer-ID erforderlich" });
  }

  try {
    const result = await deleteUserAndHistory(userId);
    if (result.deletedUserId > 0) {
      res.json({
        message: "Benutzer und zugehörige Verlaufseinträge wurden gelöscht",
      });
    } else {
      res.status(404).json({ message: "Benutzer nicht gefunden" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Fehler beim Löschen des Benutzers und der Verlaufseinträge",
    });
  }
});

app.post("/addEntry", async (req, res) => {
  const { userId, topic, frage, antwort } = req.body;

  if (!userId || !topic || !frage || !antwort) {
    return res.status(400).json({ message: "Ungültige Anfrage" });
  }

  try {
    // Verlaufseintrag hinzufügen
    await addHistoryEntry(userId, topic, frage, antwort);
    res.json({ message: "Verlaufseintrag hinzugefügt" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Fehler beim Hinzufügen des Verlaufseintrags" });
  }
});

app.get("/entries/:userId", async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ message: "Benutzer-ID erforderlich" });
  }

  try {
    const userHistory = await getUserHistory(userId);
    res.json(userHistory);
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Abrufen des Verlaufs" });
  }
});

// Löscht einen Verlaufseintrag aus der Verlaufstabelle mit der jeweiligen ID
app.delete("/deleteEntry/:id", async (req, res) => {
  const historyEntryId = req.params.id;

  if (!historyEntryId) {
    return res
      .status(400)
      .json({ message: "Verlaufseintrags-ID erforderlich" });
  }

  try {
    const deletedCount = await deleteHistoryEntry(historyEntryId);
    if (deletedCount > 0) {
      res.json({ message: "Verlaufseintrag wurde gelöscht" });
    } else {
      res.status(404).json({ message: "Verlaufseintrag nicht gefunden" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Fehler beim Löschen des Verlaufseintrags" });
  }
});

// Zeigt eine Frage mit der jeweiligen ID an
app.get("/entry/:id", async (req, res) => {
  const questionId = req.params.id;

  if (!questionId) {
    return res.status(400).json({ message: "Frage-ID erforderlich" });
  }

  try {
    const question = await getQuestionById(questionId);
    if (question) {
      res.json(question);
    } else {
      res.status(404).json({ message: "Frage nicht gefunden" });
    }
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Abrufen der Frage" });
  }
});

// Zeigt alle Fragen und Antworten für alle Benutzer an
app.get("/entries", async (req, res) => {
  try {
    const allQuestionsAndAnswers = await getAllQuestionsAndAnswers();
    res.json(allQuestionsAndAnswers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Fehler beim Abrufen aller Fragen und Antworten" });
  }
});

// Zeigt alle Fragen eines Benutzers zu einem bestimmten Thema an
app.get("/entries/:userId/:topic", async (req, res) => {
  const userId = req.params.userId;
  const topic = req.params.topic;

  if (!userId || !topic) {
    return res
      .status(400)
      .json({ message: "Benutzer-ID und Thema erforderlich" });
  }

  try {
    const questions = await getQuestionsByUserAndTopic(userId, topic);
    res.json(questions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Fehler beim Abrufen der Fragen und Antworten" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
