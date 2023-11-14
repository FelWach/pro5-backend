const sqlite3 = require("sqlite3").verbose(); // Importiere die sqlite3-Bibliothek
const bcrypt = require("bcrypt"); // Importiere die bcrypt-Bibliothek

const dbPath = "./pro5.db";

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

// Ab hier die Funktionen für die Usertabelle

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
async function deleteUserAndHistory(userId) {
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

// Ab hier die Funktionen für die Verlaufstabelle

// Funktion zum Hinzufügen eines Fragen/Antworten - Verlaufseintrags
async function addHistoryEntry(userId, topic, frage, antwort) {
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
async function getUserHistory(userId) {
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
async function deleteHistoryEntry(id) {
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

// Funktion zum Abrufen aller Fragen und Antworten eines Benutzers
async function getQuestionsAndAnswers(userId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    db.all(
      "SELECT id, topic, frage as Q, antwort as A FROM history WHERE userId = ?",
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

// Funktion zum Abrufen einer Frage mit einer bestimmten ID
async function getQuestionById(questionId) {
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
async function getAllQuestionsAndAnswers() {
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
async function getQuestionsByUserAndTopic(userId, topic) {
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

// Export der Funktionen
module.exports = {
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
};
