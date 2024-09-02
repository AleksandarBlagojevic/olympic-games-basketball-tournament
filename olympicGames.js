const data = require('./base');

function romanNumber(num) {
    if (num === 1) {
        return 'I';
    }
    else if (num === 2) {
        return 'II';
    }
    else if (num === 3) {
        return 'III';
    }
    else {
        return 'X';
    }
}

function getRandomNumber() {
    return Math.random();
}

function znak(rankA) {
    return (rankA < getRandomNumber()) ? 1 : -1;
}

function simulateMatch(team1, team2) {
    const victory = getRandomNumber();
    const rank = team1.FIBARanking / (team1.FIBARanking + team2.FIBARanking);
    let avgTeamA = team1.avgPointsScored;
    let avgTeamB = team2.avgPointsScored;
    const formA = team1.totalForm + victory;
    const formB = team2.totalForm + victory;
    const maxDiff = 25;
    
    const win = victory > rank;

    for(let i=0; i<5; ++i) {
        avgTeamA += (znak(rank) * formA);
        avgTeamB += (znak(1 - rank) * formB);
        let A = Math.abs(avgTeamA - team1.avgPointsScored);
        let B = Math.abs(avgTeamB - team2.avgPointsScored);
        if ( A> maxDiff || B > maxDiff || avgTeamA < 0 || avgTeamA < 0) {
            avgTeamA = team1.avgPointsScored;
            avgTeamB = team2.avgPointsScored;
            avgTeamA += (znak(rank) * formA);
            avgTeamB += (znak(1 - rank) * formB);
        }
        if((i%2==1)&&(win && avgTeamA>avgTeamB) || (!win && avgTeamA<avgTeamB)){
            break;
        }
    }
    
    if (win && avgTeamA < avgTeamB) {
        const tmp = avgTeamB;
        avgTeamB = avgTeamA;
        avgTeamA = tmp; 
    } 
    else if(!win && avgTeamA > avgTeamB){
        const tmp = avgTeamB;
        avgTeamB = avgTeamA;
        avgTeamA = tmp;
    }
    while( Math.round(avgTeamA)===Math.round(avgTeamB)) {
        avgTeamA += (znak(rank) * formA);
        avgTeamB += (znak(1 - rank) * formB);
    }
    
    return `${Math.round(avgTeamA)}-${Math.round(avgTeamB)}`;
}

function getHeadToHeadResult(teamA, teamB) {
    if(!teamA.Games || !teamB.Games) {
        return 0;
    }
    const game = teamA.Games.find(game => game.Opponent === teamB.ISOCode);
    if (game) {
        const [scoreA, scoreB] = game.Result.split('-').map(Number);
        return scoreA > scoreB ? 1 : (scoreA < scoreB ? -1 : 0);
    }
    return 0; // Ako utakmica ne postoji
}

// Definisanje parova
const matchSchedules = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]]
];

let date = new Date();
for (let round = 0; round < matchSchedules.length; round++) {
    console.log(`Grupna faza - ${romanNumber(round + 1)} kolo`);
    for (const group in data.groupsData) {
        console.log(`\tGrupa ${group}:`);
        matchSchedules[round].forEach(([team1Index, team2Index]) => {
            const team1 = data.groupsData[group][team1Index];
            const team2 = data.groupsData[group][team2Index];
            const result = simulateMatch(team1, team2);
            data.addGame(team1.ISOCode,date,team2.ISOCode,result);
            data.addGame(team2.ISOCode,date,team1.ISOCode,result.split('-').reverse().join('-'));
            data.updateGroup(group, team1.ISOCode, team2.ISOCode, result);
            const results = result.split('-');
            console.log(`\t\t${team1.Team} - ${team2.Team} (${results[0]}:${results[1]})`);
            date += 1;
        });
    }
}

console.log();
console.log('Konačan plasman u grupama:');

function sortTeamsByRankingCriteria(teams) {
    return teams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if ((b.totalPointsScored - b.totalPointsAllowed) !== (a.totalPointsScored - a.totalPointsAllowed)) {
            return (b.totalPointsScored - b.totalPointsAllowed) - (a.totalPointsScored - a.totalPointsAllowed);
        }
        return b.totalPointsScored - a.totalPointsScored;
    });
}

// Kreiranje nizova za prvoplasirane, drugoplasirane i treceplasirane timove
const firstPlaceTeams = [];
const secondPlaceTeams = [];
const thirdPlaceTeams = [];

Object.keys(data.groupsData).forEach(group => {
    console.log(`\tGrupa ${group}:`);
    const sortedTeams = data.groupsData[group].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const result = getHeadToHeadResult(a, b);
        if (result !== 0) {
            return result;
        }
        // Ako su bodovi i medjusobni rezultati isti, uporedi razliku u poenima
        return (b.totalPointsScored - b.totalPointsAllowed) - (a.totalPointsScored - a.totalPointsAllowed);
    });

    data.groupsData[group] = sortedTeams;

    sortedTeams.forEach(team => {
        console.log(`\t\t${team.Team} - ${team.wins}/${team.losses}/${team.points}/${team.totalPointsScored}/${team.totalPointsAllowed}/${team.pointDifference}`);
    });

    firstPlaceTeams.push(sortedTeams[0]);
    secondPlaceTeams.push(sortedTeams[1]);
    thirdPlaceTeams.push(sortedTeams[2]);
});

// Sortiramo prvoplasirane, drugoplasirane i treceplasirane timove
const rankedFirstPlaceTeams = sortTeamsByRankingCriteria(firstPlaceTeams);
const rankedSecondPlaceTeams = sortTeamsByRankingCriteria(secondPlaceTeams);
const rankedThirdPlaceTeams = sortTeamsByRankingCriteria(thirdPlaceTeams);

// ZREB

// Funkcija za kreiranje parova cetvrtfinala
function createQuarterFinalPairs() {
    const potD = [rankedFirstPlaceTeams[0], rankedFirstPlaceTeams[1]];
    const potE = [rankedFirstPlaceTeams[2], rankedSecondPlaceTeams[0]];
    const potF = [rankedSecondPlaceTeams[1], rankedSecondPlaceTeams[2]];
    const potG = [rankedThirdPlaceTeams[0], rankedThirdPlaceTeams[1]];
    
    console.log();
    console.log('Šeširi:');
    console.log('\tŠešir D');
    console.log(`\t\t${potD[0].Team}`);
    console.log(`\t\t${potD[1].Team}`);
    console.log('\tŠešir E');
    console.log(`\t\t${potE[0].Team}`);
    console.log(`\t\t${potE[1].Team}`);
    console.log('\tŠešir F');
    console.log(`\t\t${potF[0].Team}`);
    console.log(`\t\t${potF[1].Team}`);
    console.log('\tŠešir G');
    console.log(`\t\t${potG[0].Team}`);
    console.log(`\t\t${potG[1].Team}`);

    function haveTeamsPlayed(team1, team2) {
        return team1.Games.some(game => game.Opponent === team2.ISOCode);
    }

    function getRandomPair(pot1, pot2) {
        let team1, team2, attempts = 0;
        team1 = pot1.splice(Math.floor(Math.random() * pot1.length), 1)[0];
        do {
            team2 = pot2[Math.floor(Math.random() * pot2.length)];
            attempts++;
        } while (haveTeamsPlayed(team1, team2) && attempts < 10);

        if (haveTeamsPlayed(team1, team2)) {
            team2 = pot2.splice(Math.floor(Math.random() * pot2.length), 1)[0];
        } else {
            pot2.splice(pot2.indexOf(team2), 1);
        }
        return [team1, team2];
    }

    // Formiranje parova
    const quarterFinalPairs = [];
    quarterFinalPairs.push(getRandomPair(potD, potG));
    quarterFinalPairs.push(getRandomPair(potE, potF));
    quarterFinalPairs.push(getRandomPair(potD, potG));
    quarterFinalPairs.push(getRandomPair(potE, potF));

    console.log();
    console.log('Eliminaciona faza:');
    console.log(`\t${quarterFinalPairs[1][0].Team} - ${quarterFinalPairs[1][1].Team}`); // Prvi par EF
    console.log(`\t${quarterFinalPairs[0][0].Team} - ${quarterFinalPairs[0][1].Team}`); // Prvi par DG
    console.log();
    console.log(`\t${quarterFinalPairs[2][0].Team} - ${quarterFinalPairs[2][1].Team}`); // Drugi par DG
    console.log(`\t${quarterFinalPairs[3][0].Team} - ${quarterFinalPairs[3][1].Team}`); // Drugi bar EF

    return quarterFinalPairs;
}

const quarterfinalPairs = createQuarterFinalPairs();
console.log();
console.log('Četvrtfinale:');
const semifinal = [];
let teamA = quarterfinalPairs[1][0];
let teamB = quarterfinalPairs[1][1];
let result = simulateMatch(teamA, teamB);
let score = result.split('-').map(Number);
data.addGame(teamA.ISOCode,date,teamB.ISOCode,result);
data.addGame(teamB.ISOCode,date,teamA.ISOCode,result.split('-').reverse().join('-'));
if(score[0] > score[1]){
    semifinal.push([teamA]);
}
else{
    semifinal.push([teamB]);
}
console.log(`\t${teamA.Team} - ${teamB.Team} (${result.replace('-', ':')})`); 

teamA = quarterfinalPairs[0][0];
teamB = quarterfinalPairs[0][1];
result = simulateMatch(teamA, teamB);
score = result.split('-').map(Number);
data.addGame(teamA.ISOCode,date,teamB.ISOCode,result);
data.addGame(teamB.ISOCode,date,teamA.ISOCode,result.split('-').reverse().join('-'));
if(score[0] > score[1]){
    semifinal[0].push(teamA);
}
else{
    semifinal[0].push(teamB);
}
console.log(`\t${teamA.Team} - ${teamB.Team} (${result.replace('-', ':')})`); 


teamA = quarterfinalPairs[2][0];
teamB = quarterfinalPairs[2][1];
result = simulateMatch(teamA, teamB);
score = result.split('-').map(Number);
data.addGame(teamA.ISOCode,date,teamB.ISOCode,result);
data.addGame(teamB.ISOCode,date,teamA.ISOCode,result.split('-').reverse().join('-'));
if(score[0] > score[1]){
    semifinal.push([teamA]);
}
else{
    semifinal.push([teamB]);
}
console.log(`\t${teamA.Team} - ${teamB.Team} (${result.replace('-', ':')})`); 


teamA = quarterfinalPairs[3][0];
teamB = quarterfinalPairs[3][1];
result = simulateMatch(teamA, teamB);
score = result.split('-').map(Number);
data.addGame(teamA.ISOCode,date,teamB.ISOCode,result);
data.addGame(teamB.ISOCode,date,teamA.ISOCode,result.split('-').reverse().join('-'));
if(score[0] > score[1]){
    semifinal[1].push(teamA);
}
else{
    semifinal[1].push(teamB);
}
console.log(`\t${teamA.Team} - ${teamB.Team} (${result.replace('-', ':')})`); 
//console.log(semifinal);

console.log();
console.log('Polufinale:');
const thirdPlace = [];
const final = [];

teamA = semifinal[0][0];
teamB = semifinal[0][1];
result = simulateMatch(teamA, teamB);
score = result.split('-').map(Number);
data.addGame(teamA.ISOCode,date,teamB.ISOCode,result);
data.addGame(teamB.ISOCode,date,teamA.ISOCode,result.split('-').reverse().join('-'));
if(score[0] > score[1]){
    final.push(teamA);
    thirdPlace.push(teamB);
}
else{
    
    final.push(teamB);
    thirdPlace.push(teamA);
}
console.log(`\t${teamA.Team} - ${teamB.Team} (${result.replace('-', ':')})`); 

teamA = semifinal[1][0];
teamB = semifinal[1][1];
result = simulateMatch(teamA, teamB);
score = result.split('-').map(Number);
data.addGame(teamA.ISOCode,date,teamB.ISOCode,result);
data.addGame(teamB.ISOCode,date,teamA.ISOCode,result.split('-').reverse().join('-'));
if(score[0] > score[1]){
    final.push(teamA);
    thirdPlace.push(teamB);
}
else{
    
    final.push(teamB);
    thirdPlace.push(teamA);
}
console.log(`\t${teamA.Team} - ${teamB.Team} (${result.replace('-', ':')})`); 


console.log();
console.log('Utakmica za treće mesto:');
let thirdPlaceTeam = {};
teamA = thirdPlace[0];
teamB = thirdPlace[1];
result = simulateMatch(teamA, teamB);
score = result.split('-').map(Number);
data.addGame(teamA.ISOCode,date,teamB.ISOCode,result);
data.addGame(teamB.ISOCode,date,teamA.ISOCode,result.split('-').reverse().join('-'));
if(score[0] > score[1]){
    thirdPlaceTeam = teamA;
}
else{
    thirdPlaceTeam = teamB;
}
console.log(`\t${teamA.Team} - ${teamB.Team} (${result.replace('-', ':')})`); 



console.log();
console.log('Finale:');
teamA = final[0];
teamB = final[1];
result = simulateMatch(teamA, teamB);
score = result.split('-').map(Number);
data.addGame(teamA.ISOCode,date,teamB.ISOCode,result);
data.addGame(teamB.ISOCode,date,teamA.ISOCode,result.split('-').reverse().join('-'));
console.log(`\t${teamA.Team} - ${teamB.Team} (${result.replace('-', ':')})`);
console.log();
console.log('Medalje:');
if(score[0] > score[1]){
    console.log(`\t1. ${teamA.Team}`);
    console.log(`\t2. ${teamB.Team}`);
}
else{
    console.log(`\t1. ${teamB.Team}`);
    console.log(`\t2. ${teamA.Team}`);
}
console.log(`\t3. ${thirdPlaceTeam.Team}`);
