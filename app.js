const cors = require('cors');
const dotenv = require("dotenv");
const express = require("express");

const app = express();
const mongoose = require("mongoose");
dotenv.config({ path: "./config.env" });



const PORT = process.env.PORT;
require("./db/connection");

app.use(cors());
app.use(express.json());

//routes
app.use(require("./routes/auth"));




app.listen(PORT, () => {
  console.log("listening");
});
