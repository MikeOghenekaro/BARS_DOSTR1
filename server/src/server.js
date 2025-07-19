/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

var corsOptions = {
  origin: "http://localhost:8081",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//routes
// app.post("api/test/create")
app.get("/", (req, res) => {
  res.json({ message: "Welcome to DOST R1 Information System." });
});

const PORT = process.env.port || 8080;
app.listen(PORT, () => {
  console.log(`SERVER IS WALKING ON PORT ${PORT}`);
});

const db = require("./app/models");
