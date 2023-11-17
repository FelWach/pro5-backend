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
    return res.status(400).json({ message: "Missing request data!" });
  }

  try {
    await addEntry(userId, topic, frage, antwort);
    res.json({ message: "Entry added successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error while adding entry!" });
  }
});

router.get("/entries/:userId", async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ message: "User ID required!" });
  }

  try {
    const userHistory = await getUserEntries(userId);
    res.json(userHistory);
  } catch (error) {
    res.status(500).json({ message: "Error while fetching user history!" });
  }
});

// Löscht einen Verlaufseintrag aus der Verlaufstabelle mit der jeweiligen ID
router.delete("/deleteEntry/:id", async (req, res) => {
  const historyEntryId = req.params.id;

  if (!historyEntryId) {
    return res.status(400).json({ message: "Entry ID required!" });
  }

  try {
    const deletedCount = await deleteEntry(historyEntryId);
    if (deletedCount > 0) {
      res.json({ message: "Entry deleted successfully!" });
    } else {
      res.status(404).json({ message: "Entry not found!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error while deleting entry!" });
  }
});

// Zeigt eine Frage mit der jeweiligen ID an
router.get("/entry/:id", async (req, res) => {
  const questionId = req.params.id;

  if (!questionId) {
    return res.status(400).json({ message: "Entry ID required!" });
  }

  try {
    const question = await getEntry(questionId);
    if (question) {
      res.json(question);
    } else {
      res.status(404).json({ message: "Entry not found!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error while fetching entry!" });
  }
});

// Zeigt alle Fragen und Antworten für alle Benutzer an
router.get("/entries", async (req, res) => {
  try {
    const allQuestionsAndAnswers = await getEntries();
    res.json(allQuestionsAndAnswers);
  } catch (error) {
    res.status(500).json({ message: "Error while fetching entries!" });
  }
});

// Zeigt alle Fragen eines Benutzers zu einem bestimmten Thema an
router.get("/entries/:userId/:topic", async (req, res) => {
  const userId = req.params.userId;
  const topic = req.params.topic;

  if (!userId || !topic) {
    return res.status(400).json({ message: "User ID and topic required!" });
  }

  try {
    const questions = await getEntriesWithTopic(userId, topic);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Error while fetching entries!" });
  }
});

module.exports = router;
