const {
  addEntry,
  getUserEntries,
  deleteEntry,
  getEntry,
  getEntries,
  getEntriesWithTopic,
  getTopic,
} = require("../db/dbFunctions.js");

const { compareLanguages } = require("../langchain.js");

const express = require("express");
const router = express.Router();

router.post("/addEntry", async (req, res) => {
  const { userId, topic, frage, antwort } = req.body;

  if (!userId || !topic || !frage || !antwort) {
    return res.status(400).json({ message: "Ungültige Anfrage" });
  }

  try {
    await addEntry(userId, topic, frage, antwort);
    res.json({ message: "Verlaufseintrag hinzugefügt" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Fehler beim Hinzufügen des Verlaufseintrags" });
  }
});

router.get("/entries/:userId", async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ message: "Benutzer-ID erforderlich" });
  }

  try {
    const userHistory = await getUserEntries(userId);
    res.json(userHistory);
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Abrufen des Verlaufs" });
  }
});

// Löscht einen Verlaufseintrag aus der Verlaufstabelle mit der jeweiligen ID
router.delete("/deleteEntry/:id", async (req, res) => {
  const historyEntryId = req.params.id;

  if (!historyEntryId) {
    return res
      .status(400)
      .json({ message: "Verlaufseintrags-ID erforderlich" });
  }

  try {
    const deletedCount = await deleteEntry(historyEntryId);
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
router.get("/entry/:id", async (req, res) => {
  const questionId = req.params.id;

  if (!questionId) {
    return res.status(400).json({ message: "Frage-ID erforderlich" });
  }

  try {
    const question = await getEntry(questionId);
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
router.get("/entries", async (req, res) => {
  try {
    const allQuestionsAndAnswers = await getEntries();
    res.json(allQuestionsAndAnswers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Fehler beim Abrufen aller Fragen und Antworten" });
  }
});

// Zeigt alle Fragen eines Benutzers zu einem bestimmten Thema an
router.get("/entries/:userId/:topic", async (req, res) => {
  const userId = req.params.userId;
  const topic = req.params.topic;

  if (!userId || !topic) {
    return res
      .status(400)
      .json({ message: "Benutzer-ID und Thema erforderlich" });
  }

  try {
    const questions = await getEntriesWithTopic(userId, topic);
    res.json(questions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Fehler beim Abrufen der Fragen und Antworten" });
  }
});

module.exports = router;
