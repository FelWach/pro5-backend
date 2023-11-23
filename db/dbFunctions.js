const sqlite3 = require("sqlite3").verbose(); // Importiere die sqlite3-Bibliothek
const bcrypt = require("bcrypt"); // Importiere die bcrypt-Bibliothek

const dbPath = "./db/pro5.db";

// Funktion zum Initialisieren der Datenbanken ... also der Tabellen (user, history)
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    db.run(
      `CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password TEXT)`,
      (err) => {
        if (err) {
          reject(err);
        } else {
          db.run(
            `CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, topic TEXT, frage TEXT, antwort TEXT)`,
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
              db.close();
            }
          );
        }
      }
    );
  });
}

// Funktion zum Hinzufügen eines Benutzers
async function addUser(name, email, password) {
  return new Promise(async (resolve, reject) => {
    try {
      await initializeDatabase();
      const db = new sqlite3.Database(dbPath);

      // Hashen des Passworts
      bcrypt.hash(password, 10, function (err, hash) {
        if (err) {
          reject(err);
        } else {
          const stmt = db.prepare(
            "INSERT INTO user (name, email, password) VALUES (?, ?, ?)"
          );
          stmt.run(name, email, hash, function (err) {
            if (err) {
              reject(err);
            } else {
              resolve(this.lastID);
            }
            stmt.finalize();
            db.close();
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Funktion zum Abrufen aller Benutzer
async function getAllUsers() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    db.all("SELECT * FROM user", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
      db.close();
    });
  });
}

// Funktion zum Löschen eines Benutzers und aller zugehörigen Verlaufseinträge
async function deleteUser(userId) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = new sqlite3.Database(dbPath);

      db.run("DELETE FROM user WHERE id = ?", [userId], function (err) {
        if (err) {
          reject(err);
        } else {
          const deletedUserId = this.changes;

          // Nachdem der Benutzer gelöscht wurde, lösche auch alle zugehörigen Verlaufseinträge
          db.run(
            "DELETE FROM history WHERE userId = ?",
            [userId],
            function (err) {
              if (err) {
                reject(err);
              } else {
                const deletedHistoryEntries = this.changes;
                resolve({ deletedUserId, deletedHistoryEntries });
              }
            }
          );
        }
        db.close();
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function updateUser(userId, updatedData, oldPassword) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = new sqlite3.Database(dbPath);

      if (updatedData.password && !oldPassword) {
        reject(
          new Error("Old password is required for updating the password.")
        );
        db.close();
        return;
      }

      const getUserQuery = "SELECT * FROM user WHERE id = ?";
      db.get(getUserQuery, [userId], async (err, user) => {
        if (err) {
          reject(err);
          db.close();
          return;
        }

        if (!user) {
          reject(new Error("User not found."));
          db.close();
          return;
        }

        if (updatedData.password && oldPassword) {
          const isOldPasswordValid = await bcrypt.compare(
            oldPassword,
            user.password
          );

          if (!isOldPasswordValid) {
            reject(new Error("Old password is incorrect."));
            db.close();
            return;
          }
        }

        const updateFields = [];
        const updateValues = [];

        if (updatedData.name) {
          updateFields.push("name = ?");
          updateValues.push(updatedData.name);
        }

        if (updatedData.email) {
          updateFields.push("email = ?");
          updateValues.push(updatedData.email);
        }

        if (updatedData.password) {
          const hashedPassword = await bcrypt.hash(updatedData.password, 10);
          updateFields.push("password = ?");
          updateValues.push(hashedPassword);
        }

        if (updateFields.length === 0) {
          reject(new Error("No valid fields provided for update."));
          db.close();
          return;
        }

        const updateQuery = `UPDATE user SET ${updateFields.join(
          ", "
        )} WHERE id = ?`;

        db.run(updateQuery, [...updateValues, userId], function (err) {
          if (err) {
            reject(err);
          } else {
            const updatedUserId = this.changes;
            resolve({ updatedUserId });
          }
          db.close();
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Funktion zum Hinzufügen eines Fragen/Antworten - Verlaufseintrags
async function addEntry(userId, topic, frage, antwort) {
  return new Promise(async (resolve, reject) => {
    try {
      await initializeDatabase();
      const db = new sqlite3.Database(dbPath);

      const stmt = db.prepare(
        "INSERT INTO history (userId, topic, frage, antwort) VALUES (?, ?, ?, ?)"
      );
      stmt.run(userId, topic, frage, antwort, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
        stmt.finalize();
        db.close();
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Funktion zum Abrufen des Fragen/Antworten - Verlaufs eines Benutzers
async function getUserEntries(userId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    db.all("SELECT * FROM history WHERE userId = ?", [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
      db.close();
    });
  });
}

// Funktion zum Löschen eines Verlaufseintrags (mit der jeweiligen ID)
async function deleteEntry(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = new sqlite3.Database(dbPath);

      const stmt = db.prepare("DELETE FROM history WHERE id = ?");
      stmt.run(id, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
        stmt.finalize();
        db.close();
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Funktion zum Abrufen einer Frage mit einer bestimmten ID
async function getEntry(questionId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    db.get(
      "SELECT id, topic, frage as Q, antwort as A FROM history WHERE id = ?",
      [questionId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
        db.close();
      }
    );
  });
}

// Funktion zum Abrufen aller Fragen und Antworten für alle Benutzer
async function getEntries() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    db.all(
      "SELECT id, topic, frage as Q, antwort as A FROM history",
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      }
    );
  });
}

// Funktion zum Abrufen aller Fragen eines Benutzers zu einem bestimmten Thema
async function getEntriesWithTopic(userId, topic) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    db.all(
      "SELECT id, topic, frage as Q, antwort as A FROM history WHERE userId = ? AND topic = ?",
      [userId, topic],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      }
    );
  });
}

// Funktion zum Abrufen aller Themen eines Benutzers
async function getTopic(userId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    db.all(
      "SELECT topic FROM history WHERE userId = ?",
      [userId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      }
    );
  });
}

// Funktion zum Abrufen der Daten eines Benutzers für den Login
async function getDataForLogin(nameOrEmail) {
  return new Promise(async (resolve, reject) => {
    try {
      await initializeDatabase();
      const db = new sqlite3.Database(dbPath);

      const query = "SELECT * FROM user WHERE name = ? OR email = ?";
      const params = [nameOrEmail, nameOrEmail];

      db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
        db.close();
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Funktion zum Abrufen der Daten eines Benutzers für die Registrierung
async function getDataForRegistration(name, email) {
  return new Promise(async (resolve, reject) => {
    try {
      await initializeDatabase();
      const db = new sqlite3.Database(dbPath);

      const query = "SELECT * FROM user WHERE name = ? OR email = ?";
      const params = [name, email];

      db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
        db.close();
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function deleteUserEntry(userId) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = new sqlite3.Database(dbPath);

      db.run(
        "DELETE FROM history WHERE userId = ? AND id != ?",
        [userId, userId],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
          db.close();
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// Export der Funktionen
module.exports = {
  addUser,
  getAllUsers,
  deleteUser,
  addEntry,
  getUserEntries,
  deleteEntry,
  getEntry,
  getEntries,
  getEntriesWithTopic,
  getTopic,
  getDataForLogin,
  getDataForRegistration,
  updateUser,
  deleteUserEntry,
};
