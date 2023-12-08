const express = require("express");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;
const gmailInstance = require("./config/authorize");
const autoReplyService = require("./services/mailreplyservice");

app.use(express.json());

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scheduleRepeatingTask = async () => {
  if (gmailInstance) {
    try {
      await autoReplyService.autoReplyAndMoveToLabel(gmailInstance);
      console.log("Mail Replied!");
    } catch (err) {
      console.log("An error occurred" + err);
    }
    const randomWaitTime =
      Math.floor(Math.random() * (15 - 10 + 1) + 10) * 1000;
    console.log(
      `Waiting for ${
        randomWaitTime / 1000
      } seconds before the next sequence of tasks...`
    );
    await wait(randomWaitTime);
    await scheduleRepeatingTask();
  } else {
    console.log("Error obtaining GMail instance");
  }
};

app.get("/", (req, res) => {
  res.status(200).send({ message: "server works" });
});

app.listen(PORT, () => {
  console.log("running on port " + PORT);
  scheduleRepeatingTask();
});
