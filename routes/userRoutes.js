const { addUser, getAllUsers, deleteUser } = require("../dbFunctions.js");

const express = require("express");
const router = express.Router();

router.post("/addUser", async (req, res) => {
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

router.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Abrufen der Benutzer" });
  }
});

router.delete("/deleteUser/:id", async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ message: "Benutzer-ID erforderlich" });
  }

  try {
    const result = await deleteUser(userId);
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

module.exports = router;
