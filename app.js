const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3006, () => {
      console.log("Server Running at http://localhost:3006/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const cvDBobjectToResponse = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//API 1
app.get("/players/", async (request, Response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  Response.send(playersArray.map((player) => cvDBobjectToResponse(player)));
});

//API 2
app.get("/players/:playerId/", async (request, Response) => {
  const { playerId } = request.params;
  const getplayerQuery = `SELECT * FROM player_details
    WHERE player_id=${playerId};`;
  const player = await db.get(getplayerQuery);
  Response.send(cvDBobjectToResponse(player));
});

//API 3
app.put("/players/:playerId/", async (request, Response) => {
  const { playerId } = request.params;
  const playerDEtails = request.body;
  const { playerName } = playerDEtails;
  const updateQuery = `UPDATE player_details SET
    player_name='${playerName}';`;
  await db.run(updateQuery);
  Response.send("Player Details Updated");
});

const convertdbobjecttoresponseobject = (objexts) => {
  return {
    matchId: objexts.match_id,
    match: objexts.match,
    year: objexts.year,
  };
};
//API 4
app.get("/matches/:matchId", async (request, Response) => {
  const { matchId } = request.params;
  const getmatchQuery = `SELECT * FROM match_details
    WHERE match_id=${matchId};`;
  const match = await db.get(getmatchQuery);
  Response.send(convertdbobjecttoresponseobject(match));
});

//API 5
app.get("/players/:playerId/matches/", async (request, Response) => {
  const { playerId } = request.params;
  const matchQuery = `SELECT * FROM player_match_score 
    NATURAL JOIN match_details WHERE player_id=${playerId};`;
  const matchArray = await db.all(matchQuery);
  Response.send(
    matchArray.map((matchs) => convertdbobjecttoresponseobject(matchs))
  );
});

//API 6
app.get("/matches/:matchId/players/", async (request, Response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
        SELECT * FROM player_match_score
        NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const matchss = await db.all(getMatchPlayersQuery);
  Response.send(matchss.map((match) => cvDBobjectToResponse(match)));
});

//API 7
app.get("/players/:playerId/playerScores/", async (request, Response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score NATURAL JOIN
    player_details WHERE player_id = ${playerId};
    `;
  const score = await db.get(getPlayerScored);
  Response.send(score);
});

module.exports = app;
