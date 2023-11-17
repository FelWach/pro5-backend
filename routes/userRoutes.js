const { addUser, getAllUsers, deleteUser, getDataForLogin, getDataForRegistration } = require("../db/dbFunctions");

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");


// Für das Hinzugefügen eines neuen Users
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


// FÜr das Abrufen aller Users
router.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Abrufen der Benutzer" });
  }
});


// Für das Löschen eines Users mit der jeweiligen ID
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


// Für das Einloggen eines Users
router.post("/login", async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: "Fehlende Anmeldeinformationen" });
  }

  try {
    const user = await getDataForLogin(usernameOrEmail);
    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Interner Serverfehler" });
      }
      if (result) {
        return res.status(200).json({ userId: user.id });
      } else {
        return res.status(401).json({ message: "Falsches Passwort" });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Interner Serverfehler" });
  }
});


// Für die Registrierung eines Users
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Fehlende Registrierungsinformationen" });
  }

  try {
    const existingUser = await getDataForRegistration(name, email);

    if (existingUser) {
      if (existingUser.name === name && existingUser.email === email) {
        return res.status(400).json({ message: "Benutzername und E-Mail existieren bereits" });
      } else if (existingUser.name === name) {
        return res.status(400).json({ message: "Benutzername existiert bereits, bitte einen anderen wählen" });
      } else if (existingUser.email === email) {
        return res.status(400).json({ message: "E-Mail existiert bereits, bitte eine andere wählen" });
      }
    }

    // Hinzufügen des neuen Benutzers
    const userId = await addUser(name, email, password); // Du musst die addUser-Funktion implementieren
    return res.status(201).json({ message: "Benutzer erfolgreich registriert", userId });
  } catch (error) {
    return res.status(500).json({ message: "Interner Serverfehler" });
  }
});


module.exports = router;


