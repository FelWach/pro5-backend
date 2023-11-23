const {
  addUser,
  getAllUsers,
  deleteUser,
  getDataForLogin,
  getDataForRegistration,
  updateUser,
  deleteUserEntry
} = require("../db/dbFunctions");

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

// Für das Hinzugefügen eines neuen Users
router.post("/addUser", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Missing Name, Email or Password!" });
  }

  try {
    const userId = await addUser(name, email, password);
    res.json({ message: "User added successfully!", userId });
  } catch (error) {
    res.status(500).json({ message: "Error while adding user!" });
  }
});

// FÜr das Abrufen aller Users
router.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error while fetching users!" });
  }
});

// Für das Löschen eines Users mit der jeweiligen ID
router.delete("/deleteUser/:id", async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ message: "User ID missing!" });
  }

  try {
    const result = await deleteUser(userId);
    if (result.deletedUserId > 0) {
      res.json({
        message: "User and associated history entries successfully deleted",
      });
    } else {
      res.status(404).json({ message: "User not found!" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error while deleting user and associated history entries",
    });
  }
});

router.put("/updateUser/:id", async (req, res) => {
  const userId = req.params.id;
  const { oldPassword, ...updatedData } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID missing!" });
  }

  try {
    const result = await updateUser(userId, updatedData, oldPassword);
    if (result.updatedUserId > 0) {
      res.json({
        message: "User successfully updated",
      });
    } else {
      res.status(404).json({ message: "User not found!" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error while updating user",
      error: error.message,
    });
  }
});

// Für das Einloggen eines Users
router.post("/login", async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: "Missing login credentials!" });
  }

  try {
    const user = await getDataForLogin(usernameOrEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Internal Server Error" });
      }
      if (result) {
        return res.status(200).json({ userId: user.id });
      } else {
        return res.status(401).json({ message: "Wrong Password!" });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Für die Registrierung eines Users
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing register credentials!" });
  }

  try {
    const existingUser = await getDataForRegistration(name, email);

    if (existingUser) {
      if (existingUser.name === name && existingUser.email === email) {
        return res.status(400).json({
          message: "Username and Email already in use!",
        });
      } else if (existingUser.name === name) {
        return res.status(400).json({
          message: "Username already in use!",
        });
      } else if (existingUser.email === email) {
        return res.status(400).json({
          message: "This Email already in use!",
        });
      }
    }

    // Hinzufügen des neuen Benutzers
    const userId = await addUser(name, email, password); // Du musst die addUser-Funktion implementieren
    return res
      .status(201)
      .json({ message: "User registered successfully!", userId });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route zum Löschen aller Einträge eines Benutzers außer dem Benutzer selbst
router.delete("/deleteUserEntry/:userID", async (req, res) => {
  const userId = req.params.userID;

  if (!userId) {
    return res.status(400).json({ message: "User ID missing!" });
  }

  try {
    const result = await deleteUserEntry(userId);
    res.json({
      message: "All user entries deleted except the user.",
      deletedEntriesCount: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error while deleting user entries",
      error: error.message,
    });
  }
});

module.exports = router;
