const express = require("express");
const cors = require("cors");
const { config } = require("dotenv");
const bodyParser = require("body-parser");

const userRoutes = require("./routes/userRoutes.js");
const entryRoutes = require("./routes/entryRoutes.js");
const langchainRoutes = require("./routes/langchainRoutes.js");

config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(userRoutes);
app.use(entryRoutes);
app.use(langchainRoutes);

app.use(express.json());

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});


