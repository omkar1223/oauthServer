const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
require("dotenv").config();

const PORT = process.env.PORT || 4000;
app.use(cors());

app.get("/", (req, res) => {
  res.send(`<h1>This is my OAuth app</h1>`);
});

app.get("/auth/github", (req, res) => {
  console.log("/auth/github route called");
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user,repo,security_events`;
  res.redirect(githubAuthUrl);
});

app.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;
  try {
    console.log("/auth/github/callback route called");
    console.log(code);
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const accessToken = await tokenResponse.data.access_token;
    console.log(accessToken);
    res.cookie("accessToken", accessToken);

    return res.redirect(`${process.env.FRONTEND_URL}/v1/profile/github`);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log("Server is running on " + PORT);
});
