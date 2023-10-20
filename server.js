import { generateAnswer } from "./langchain.js";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const port = 5000;
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
app.listen(process.env.PORT || port, () => {
  console.log(`Server is running on port ${port}`);
});
