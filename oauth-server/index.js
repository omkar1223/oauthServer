const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const { setSecureCookie } = require("./services/cookie.js");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { validateAccessToken } = require("./middleware/validateToken.js");

const PORT = process.env.PORT || 4000;
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, // If needed for cookies
  })
);
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send(`<h1>This is my OAuth app</h1>`);
});

app.get("/user/profile/github", validateAccessToken, async (req, res) => {
  const { access_token } = req.cookies;
  try {
    const githubUserDataResponse = await axios.get(
      `https://api.github.com/user`,
      {
        headers: {
          Authorization: `bearer ${access_token}`,
        },
      }
    );

    res.json({ user: githubUserDataResponse.data });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Could not fetch user github profile" });
  }
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
          "Content-Type": "application/json",
        },
      }
    );
    console.log("GitHub Token Response:", tokenResponse.data);

    const accessToken = tokenResponse.data.access_token;
    console.log(accessToken);
    res.cookie("access_token", accessToken);

    return res.redirect(`${process.env.FRONTEND_URL}/v2/profile/github`);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/user/profile/google", validateAccessToken, async (req, res) => {
  const { access_token } = req.cookies;
  try {
    console.log("came here");
    const googleUserDataResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `bearer ${access_token}`,
        },
      }
    );
    console.log(googleUserDataResponse.data);

    res.json({ user: googleUserDataResponse.data });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Could not fetch user google profile" });
  }
});

app.get("/auth/google", (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:${PORT}/auth/google/callback&response_type=code&scope=profile email`;
  res.redirect(googleAuthUrl);
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(404).json({ error: "Auth code not provided" });
  }
  try {
    const tokenResponse = await axios.post(
      `https://oauth2.googleapis.com/token`,
      {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_SECRET_KEY,
        code,
        grant_type: "authorization_code",
        redirect_uri: `http://localhost:${PORT}/auth/google/callback`,
      },
      {
        headers: {
          "Content-Type": "application:x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log(accessToken);

    setSecureCookie(res, accessToken);
    return res.redirect(`${process.env.FRONTEND_URL}/v2/profile/google`);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log("Server is running on " + PORT);
});
