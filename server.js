const express = require("express");
const cors = require("cors");
const { generateAnswer } = require("./langchain.js");
const { config } = require("dotenv");
const bodyParser = require("body-parser");
const {
  addUser,
  getAllUsers,
  deleteUser,
  addHistoryEntry,
  getUserHistory,
} = require("./dbFunctions.js");

const { extractBeforeA } = require("./helperFunctions.js");

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

app.get("/getAllUsers", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Abrufen der Benutzer" });
  }
});

app.post("/saveData", async (req, res) => {
  const { topic, nbQuestions, language } = req.body;
  storedData = topic;
  questionAmount = nbQuestions;
  lan = language;
  res.json({
    message: `Data received successfully ${storedData} with a number of Questions = ${questionAmount} and the language is ${lan}`,
  });
});

app.post("/generateAnswer", async (req, res) => {
  const { topic, nbQuestions, language } = req.body;

  storedData = topic;
  questionAmount = nbQuestions;
  lan = language;

  res.send(
    `Data received successfully ${topic} with a number of Questions = ${nbQuestions} and the language is ${language}`
  );
});

app.get("/main", async (req, res) => {
  let answer = "";

  let prevQuestion = "";

  for (let i = 0; i < questionAmount; i++) {
    let generatedAnswer = await generateAnswer(storedData, lan, prevQuestion);
    answer += generatedAnswer;
    prevQuestion = extractBeforeA(generatedAnswer).replace(/^\s*[\r\n]/gm, "");
    console.log(prevQuestion);
  }

  res.send(answer);
});

app.delete("/deleteUser/:id", async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ message: "Benutzer-ID erforderlich" });
  }

  try {
    const deletedCount = await deleteUser(userId);
    if (deletedCount > 0) {
      res.json({ message: "Benutzer wurde gelöscht" });
    } else {
      res.status(404).json({ message: "Benutzer nicht gefunden" });
    }
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Löschen des Benutzers" });
  }
});

app.post("/addHistoryEntry", async (req, res) => {
  const { userId, themaId, frage, antwort } = req.body;

  if (!userId || !themaId || !frage || !antwort) {
    return res.status(400).json({ message: "Ungültige Anfrage" });
  }

  try {
    // Verlaufseintrag hinzufügen
    await addHistoryEntry(userId, themaId, frage, antwort);
    res.json({ message: "Verlaufseintrag hinzugefügt" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Fehler beim Hinzufügen des Verlaufseintrags" });
  }
});

app.get("/getUserHistory/:userId", async (req, res) => {
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

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
