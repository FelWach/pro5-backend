const sqlite3 = require("sqlite3").verbose();

const dbPath = "./pro5.db";

async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    db.run(
      `CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT)`,
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
        db.close();
      }
    );
  });
}

async function addUser(name, password) {
  return new Promise(async (resolve, reject) => {
    try {
      await initializeDatabase();
      const db = new sqlite3.Database(dbPath);

      const stmt = db.prepare(
        "INSERT INTO user (name, password) VALUES (?, ?)"
      );
      stmt.run(name, password, function (err) {
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

module.exports = { addUser, getAllUsers, deleteUser };
