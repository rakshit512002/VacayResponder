const fs = require("fs");
const { google } = require("googleapis");
const { OAuth2Client } = require("google-auth-library");
const path = require("path");
const { composer } = require("googleapis/build/src/apis/composer");

//You are supposed to create these two files in the config folder, namely credentials.json, gmailToken.json
const TOKEN_PATH = path.join(process.cwd(), "config/gmailToken.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "config/credentials.json");
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
const token = JSON.parse(fs.readFileSync(TOKEN_PATH));

const oauth2Client = new OAuth2Client(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);

oauth2Client.credentials = token;

// Function to refresh the access token using the refresh token
function refreshAccessToken(callback) {
  oauth2Client.on("tokens", (tokens) => {
    if (tokens.refresh_token) {
      // If an updated refresh token is provided, save it to the gmailToken.json file
      credentials.web.refresh_token = tokens.refresh_token;
    }
    // Save the refreshed access token to the token.json file
    credentials.web.access_token = tokens.access_token;
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
  });

  oauth2Client.refreshAccessToken((err, tokens) => {
    if (err) {
      console.error("Error refreshing access token:", err);
      callback(err);
    } else {
      callback(null);
    }
  });
}

// Function to ensure a valid access token
function ensureAccessToken(callback) {
  if (oauth2Client.isTokenExpiring()) {
    refreshAccessToken((err) => {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    });
  } else {
    callback(null);
  }
}

let gmail = null;
ensureAccessToken((err) => {
  if (err) {
    console.error("Error ensuring access token:", err);
  } else {
    gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    // console.log(gmail);
  }
});

module.exports = gmail;
