const express = require("express");
const cors = require("cors");
const { generateAnswer, finishAnswer } = require("./langchain.js");
const { config } = require("dotenv");
const bodyParser = require("body-parser");
const { addUser, getAllUsers, deleteUser } = require("./dbFunctions.js");

config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

let storedData = "";
let answer = "";
let text = "";
let questionAmount;

app.use(express.json());

app.post("/addUser", async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: "Name und Passwort erforderlich" });
  }

  try {
    const userId = await addUser(name, password);
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

app.get("/main", async (req, res) => {
  answer = await generateAnswer(storedData, questionAmount, lan);
  text = await finishAnswer(answer, questionAmount);
  if (answer.charAt(answer.length - 1) !== ".") {
    text = await finishAnswer(text, questionAmount);
  }
  res.send(text);
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

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
