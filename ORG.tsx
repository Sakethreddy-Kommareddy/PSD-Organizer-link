import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import crypto from 'crypto';

const app = express();
const port = 3000;

app.use(bodyParser.json());

interface Team {
  name: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface StandingsData {
  [year: string]: {
    teams: Team[];
  };
}

let standingsData: StandingsData = {};

fs.readFile('standings.json', 'utf8', (err, data) => {
  if (err) {
    console.error("Error reading standings data:", err);
    return;
  }
  standingsData = JSON.parse(data);
});

function generateToken(): string {
  return crypto.randomBytes(20).toString('hex');
}

app.get('/standings/:year', (req, res) => {
  const year = req.params.year;
  if (!standingsData[year]) {
    return res.status(404).send("Standings not found for the specified year.");
  }
  const sortedStandings = standingsData[year].teams.sort((a, b) => {
    return calculatePoints(b) - calculatePoints(a);
  });
  res.json(sortedStandings);
});

app.put('/standings/:year', (req, res) => {
  const year = req.params.year;
  const token: string = req.body.token;
  const updatedStandings: StandingsData = req.body.standings;

  if (!validateToken(token, year)) {
    return res.status(401).send("Unauthorized");
  }

  standingsData[year] = updatedStandings;

  fs.writeFile('standings.json', JSON.stringify(standingsData, null, 2), (err) => {
    if (err) {
      console.error("Error saving standings data:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.send("Standings updated successfully");
  });
});

app.post('/organizer-link', (req, res) => {
  const year: string = req.body.year;
  const token: string = generateToken();

  organizerTokens[year] = token;

  res.send(`Organizer link generated for ${year}: http://yourdomain.com/organizer/${year}/${token}`);
});

function calculatePoints(team: Team): number {
  return team.wins * 3 + team.draws;
}

const organizerTokens: { [year: string]: string } = {};

function validateToken(token: string, year: string): boolean {
  return organizerTokens[year] === token;
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
