const express = require("express");
const cors = require("cors");
const { generateAnswer } = require("./langchain.js");
const { config } = require("dotenv");
const bodyParser = require("body-parser");

config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

let storedData = "";
let answer = "";

app.use(express.json());

app.post("/saveData", async (req, res) => {
  const { data } = req.body;
  storedData = data;
  res.json({ message: `Data received successfully ${storedData}` });
  answer = await generateAnswer(storedData);
});

app.get("/", async (req, res) => {
  res.send(`Stored Data: ${answer}`);
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
