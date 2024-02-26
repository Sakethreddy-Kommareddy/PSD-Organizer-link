const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const port = 3000;

app.use(bodyParser.json());

let standingsData = {}; // This will hold the standings data

// Load standings data from file on server start
fs.readFile('standings.json', 'utf8', (err, data) => {
  if (err) {
    console.error("Error reading standings data:", err);
    return;
  }
  standingsData = JSON.parse(data);
});

// Generate unique token for organizer
function generateToken() {
  return crypto.randomBytes(20).toString('hex');
}

// Endpoint to get standings for a specific year
app.get('/standings/:year', (req, res) => {
  const year = req.params.year;
  if (!standingsData[year]) {
    return res.status(404).send("Standings not found for the specified year.");
  }
  // Sort teams by points
  const sortedStandings = standingsData[year].teams.sort((a, b) => {
    return calculatePoints(b) - calculatePoints(a);
  });
  res.json(sortedStandings);
});

// Endpoint to edit standings for a specific year (requires a token)
app.put('/standings/:year', (req, res) => {
  const year = req.params.year;
  const token = req.body.token;
  const updatedStandings = req.body.standings;

  // Check if the token is valid
  if (!validateToken(token, year)) {
    return res.status(401).send("Unauthorized");
  }

  // Update standings data for the specified year
  standingsData[year] = updatedStandings;

  // Save updated standings data to file
  fs.writeFile('standings.json', JSON.stringify(standingsData, null, 2), (err) => {
    if (err) {
      console.error("Error saving standings data:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.send("Standings updated successfully");
  });
});

// Endpoint to generate private link for organizer
app.post('/organizer-link', (req, res) => {
  const year = req.body.year;
  const token = generateToken();

  // Store the token in memory or database for future validation
  // For simplicity, let's just store it in an object for now
  organizerTokens[year] = token;

  res.send(`Organizer link generated for ${year}: http://yourdomain.com/organizer/${year}/${token}`);
});

// Helper function to calculate points
function calculatePoints(team) {
  return team.wins * 3 + team.draws;
}

// Object to store organizer tokens (in memory, can be replaced with a database)
const organizerTokens = {};

// Function to validate organizer token
function validateToken(token, year) {
  // Check if the token matches the stored token for the given year
  return organizerTokens[year] === token;
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
