const express = require("express");
const cors = require("cors");
const { generateAnswer, finishAnswer } = require("./langchain.js");
const { config } = require("dotenv");
const bodyParser = require("body-parser");
const {
  addUser,
  getAllUsers,
  deleteUser,
  addHistoryEntry,
  getUserHistory,
} = require("./dbFunctions.js");

// Umgebungsvariablen aus der Datei .env laden
config();

// Server erstellen
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Datenbankverbindung
let storedData = "";
let answer = "";
let text = "";
let questionAmount;

// Middleware für die Verarbeitung von JSON-Daten
app.use(express.json());

// Routen für die Daten in der Datenbank
app.post("/saveData", async (req, res) => {
  const { data } = req.body;
  storedData = data;
  res.json({ message: `Data received successfully ${storedData}` });
  answer = await generateAnswer(storedData);
});

// Route zum Abrufen der gespeicherten Daten
app.get("/", async (req, res) => {
  res.send(`Stored Data: ${answer}`);
});

// ROUTEN FÜR DIE BENUTZERTABELLE

// Route zum Hinzufügen eines Benutzers
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

// Route zum Abrufen aller Benutzer
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

app.get("/main", async (req, res) => {
  answer = await generateAnswer(storedData, questionAmount, lan);
  text = await finishAnswer(answer, questionAmount);
  if (answer.charAt(answer.length - 1) !== ".") {
    text = await finishAnswer(text, questionAmount);
  }
  res.send(text);
});
// Route zum Hinzufügen eines Verlaufseintrags

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

// ROUTEN FÜR DIE VERLAUFSTABELLE

// Route zum Hinzufügen eines Verlaufseintrags
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

// Route zum Abrufen des Verlaufs eines Benutzers
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

// Server starten
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
