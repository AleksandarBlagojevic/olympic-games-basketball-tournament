const fs = require('fs');

const gamesData = JSON.parse(fs.readFileSync('exibitions.json', 'utf-8'));
const groupsData = JSON.parse(fs.readFileSync('groups.json', 'utf-8'));

let fibaRankingMap = {};
Object.values(groupsData).forEach(group => {
    group.forEach(team => {
        fibaRankingMap[team.ISOCode] = team.FIBARanking;
    });
});

// Funkcija za izracunavanje forme
function calculateForm(teamScore, opponentScore, rank, rankOpponent) {
    if (!rank || !rankOpponent) {
        return (teamScore - opponentScore) / 2;
    }
    const form = teamScore - opponentScore;
    
    if (form > 0) {
        return form * (Math.max(rank, rankOpponent) / (rank + rankOpponent));
    }
    return form * (Math.min(rank, rankOpponent) / (rank + rankOpponent));
}

let teamsData = {};

// Funkcija za dodavanje utakmice u odgovarajuci tim
function addGame(team, date, opponent, result) {
    if (!teamsData[team]) {
        teamsData[team] = {
            Games: [],
            fibaRanking: fibaRankingMap[team] || null,
            totalForm: 0,
            totalPointsScored: 0
        };
    }

    const [teamScore, opponentScore] = result.split('-').map(Number);
    const rankOpponent = fibaRankingMap[opponent] || 0;
    const rank = fibaRankingMap[team] || 0;
    const gameForm = calculateForm(teamScore, opponentScore, rank, rankOpponent);

    // Proverite da li utakmica postoji
    const gameExists = teamsData[team].Games.some(game => 
        game.Date === date && game.Opponent === opponent && game.Result === result
    );
    if (!gameExists) {
        teamsData[team].Games.push({
            Date: date,
            Opponent: opponent,
            Result: result,
            fibaRankOpponent: rankOpponent,
            gameForm: gameForm
        });
        if (teamsData[team].totalForm ===0) {
            teamsData[team].totalForm = gameForm;
        }
        else {
            teamsData[team].totalForm = (teamsData[team].totalForm + gameForm)/2;
        }
        if (teamsData[team].totalPointsScored ===0) {
            teamsData[team].totalPointsScored = teamScore;
        }
        else {
            teamsData[team].totalPointsScored = (teamsData[team].totalPointsScored + teamScore)/2;
        }
    }
}

// Iterira kroz sve utakmice i dodaje protivnicima ako nedostaju
Object.keys(gamesData).forEach(team => {
    gamesData[team].forEach(game => {
        const opponent = game.Opponent;
        const date = game.Date;
        const result = game.Result;

        addGame(team, date, opponent, result);
        addGame(opponent, date, team,result.split('-').reverse().join('-'));
    });
});


Object.keys(teamsData).forEach(team => {
    const num = teamsData[team].Games.length;
    if( num > 0) {
        //teamsData[team].totalForm = teamsData[team].totalForm / num;
        //teamsData[team].totalPointsScored = teamsData[team].totalPointsScored / num;
        teamsData[team].Games = [];
    }
});


Object.values(groupsData).forEach(group => {
    group.forEach(team => {
        fibaRankingMap[team.ISOCode] = team.FIBARanking;
        team.wins = 0;
        team.losses = 0;
        team.points = 0;
        team.totalPointsScored = 0;
        team.totalPointsAllowed = 0;
        team.pointDifference = 0;
        team.totalForm = teamsData[team.ISOCode].totalForm;
        team.avgPointsScored = teamsData[team.ISOCode].totalPointsScored;
        team.Games = teamsData[team.ISOCode].Games;
    });
});

function updateGroup(group, team1, team2, result) {
    
    const [score1, score2] = result.split('-').map(Number);

    const team1Data = groupsData[group].find(t => t.ISOCode === team1);
    const team2Data = groupsData[group].find(t => t.ISOCode === team2);

    if (team1Data && team2Data) {
        team1Data.totalPointsScored += score1;
        team1Data.totalPointsAllowed += score2;
        team1Data.pointDifference = team1Data.totalPointsScored - team1Data.totalPointsAllowed;

        team2Data.totalPointsScored += score2;
        team2Data.totalPointsAllowed += score1;
        team2Data.pointDifference = team2Data.totalPointsScored - team2Data.totalPointsAllowed;

        if (score1 > score2) {
            team1Data.wins = (team1Data.wins || 0) + 1;
            team1Data.points = (team1Data.points || 0) + 2;
            team2Data.losses = (team2Data.losses || 0) + 1;
        } else if (score1 < score2) {
            team2Data.wins = (team2Data.wins || 0) + 1;
            team2Data.points = (team2Data.points || 0) + 2;
            team1Data.losses = (team1Data.losses || 0) + 1;
        } else {
            team1Data.points = (team1Data.points || 0) + 0;
            team2Data.points = (team2Data.points || 0) + 0;
        }
    } 
}
//console.log(groupsData);
//console.log(teamsData);


module.exports = {
    addGame,
    groupsData,
    teamsData, 
    updateGroup
};