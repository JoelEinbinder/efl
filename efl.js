const [
  rounds,
  squads
] = await Promise.all([
  fetch('./data/rounds.json').then(r => r.json()),
  fetch('./data/squads.json').then(r => r.json())
]);
console.log(rounds, squads);

function renderLeague(leagueName, competitionId, automatics, playoffs, relegations) {
  const h1 = document.createElement('h1');
  h1.textContent = leagueName;
  const table = document.createElement('table');
  document.body.append(h1, table);
  const tableBody = document.createElement('tbody');
  table.append(tableBody);
  const header = document.createElement('tr');
  header.innerHTML = '<th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>F</th><th>A</th><th>GD</th><th>Pts</th><th>Rate</th>';
  tableBody.appendChild(header);
  let pos = 0;
  for (const team of squads.filter(x => x.competitionId === competitionId).map(makeTeam).sort(sortTeams)) {
    pos++;
    const hr = renderTeam(team, pos);
    if (pos <= automatics)
      hr.classList.add('automatic');
    else if (pos <= automatics + playoffs)
      hr.classList.add('playoff');
    else if (24 - pos < relegations)
      hr.classList.add('relegation');
    tableBody.appendChild(hr);
  }
}
renderLeague('League 1', 11, 2, 4, 4);
renderLeague('League 2', 12, 3, 4, 2);

function renderTeam(team, pos) {
  const tr = document.createElement('tr');
  const logo = document.createElement('img');
  logo.classList.add('logo');
  logo.src = './light/' + team.id + '.png';
  logo.width = 32;
  logo.height = 32;
  tr.append(
    createTD(namedText('pos', pos),
    logo,
    namedText('name', team.name)),
    createTD(team.played),
    createTD(team.won),
    createTD(team.drawn),
    createTD(team.lost),
    createTD(team.goalsFor),
    createTD(team.goalsAgainst),
    createTD(team.goalDifference),
    createTD(team.points),
    createTD(team.rate.toFixed(2)),
  );
  return tr;
  function createTD(...children) {
    const td = document.createElement('td');
    td.append(...children);
    return td;
  }
  function namedText(name, text) {
    const span = document.createElement('span');
    span.textContent = text;
    span.classList.add(name);
    return span;
  }
}

function makeTeam(team) {
  let played = 0;
  let won = 0;
  let lost = 0;
  let drawn = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  for (const round of rounds) {
    for (const game of round.games) {
      if (game.status !== 'completed')
        continue;
      if (game.homeId === team.id) {
        played++;
        goalsFor += game.homeScore;
        goalsAgainst += game.awayScore;
        if (game.homeScore > game.awayScore) {
          won++;
        } else if (game.homeScore < game.awayScore) {
          lost++;
        } else {
          drawn++;
        }
      } else if (game.awayId === team.id) {
        played++;
        goalsFor += game.awayScore;
        goalsAgainst += game.homeScore;
        if (game.awayScore > game.homeScore) {
          won++;
        } else if (game.awayScore < game.homeScore) {
          lost++;
        } else {
          drawn++;
        }
      }
    }
  }
  const points = won * 3 + drawn;
  const goalDifference = goalsFor - goalsAgainst;
  const rate = points/played;
  return {
    id: team.id,
    name: team.name,
    played,
    won,
    lost,
    drawn,
    points,
    goalsFor,
    goalsAgainst,
    goalDifference,
    rate,
  }
}

function sortTeams(a, b) {
  if (a.played !== b.played && a.played > 0 && b.played > 0) {
    const rd =  b.rate - a.rate;
    if (Math.abs(rd) > 0.0001)
      return rd;
    return b.played - a.played;
  }
  return b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor;
}