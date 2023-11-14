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

// Funktion zum Löschen eines Benutzers (mit der jeweilige ID)
async function deleteUser(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = new sqlite3.Database(dbPath);

      const stmt = db.prepare("DELETE FROM user WHERE id = ?");
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

// Export der Funktionen
module.exports = {
  addUser,
  getAllUsers,
  deleteUser,
  addHistoryEntry,
  getUserHistory,
};
