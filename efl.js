const [
  rounds,
  squads
] = await Promise.all([
  fetch('./data/rounds.json').then(r => r.json()),
  fetch('./data/squads.json').then(r => r.json())
]);

function renderLeague(leagueName, competitionId, automatics, playoffs, relegations) {
  const h1 = document.createElement('h1');
  h1.textContent = leagueName;
  const table = document.createElement('table');
  document.body.append(h1, table);
  const tableBody = document.createElement('tbody');
  table.append(tableBody);
  const header = document.createElement('tr');
  header.innerHTML = '<th>Team</th><th>MP</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th><th class="rate">Rate</th><th>Last 5</th>';
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

// document.body.append(renderMatches(2));

function renderTeam(team, pos) {
  const tr = document.createElement('tr');
  tr.classList.add('team');
  const logo = document.createElement('img');
  logo.classList.add('logo');
  logo.src = './light/' + team.id + '.png';
  logo.width = 32;
  logo.height = 32;
  const nameTd = createTD(
    namedText('pos', pos),
    renderTeamName(team),
  );
  for (const game of matchesForTeam(team.id)) {
    if (game.status !== 'playing')
      continue;
    const score = document.createElement('span');
    score.classList.add('playing');
    score.textContent = game.homeScore + ' - ' + game.awayScore;
    if (game.homeScore === game.awayScore)
      score.classList.add('drawing');
    else if (game.homeId === team.id) {
      if (game.homeScore > game.awayScore)
        score.classList.add('winning');
      else
        score.classList.add('losing');
    } else {
      if (game.awayScore > game.homeScore)
        score.classList.add('winning');
      else
        score.classList.add('losing');
    }

    nameTd.append(score);
  }
  tr.append(
    nameTd,
    createTD(team.played),
    createTD(team.won),
    createTD(team.drawn),
    createTD(team.lost),
    createTD(team.goalsFor),
    createTD(team.goalsAgainst),
    createTD(team.goalDifference),
    createTD(team.points),
    createTD(namedText('rate', team.rate.toFixed(2))),
    createTD(...[...results(team.id)].slice(-5).map(x => namedText(x, ''))),
  );
  let toggled = false;
  tr.onclick = event => {
    toggled = !toggled;
    tr.classList.toggle('expanded', toggled);
    if (toggled) {
      const details = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 11;
      details.classList.add('details');
      details.append(td);
      tr.after(details);
      renderMatches(team.id, td);
    } else {
      tr.nextElementSibling.remove();
    }
    event.preventDefault();
  }
  return tr;
}

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

function matchesForTeam(teamId) {
  const matches = [];
  for (const round of rounds) {
    for (const game of round.games) {
      if (game.homeId !== teamId && game.awayId !== teamId)
        continue;
      matches.push(game);
    }
  }
  matches.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  })
  return matches;
}

function * results(teamId) {
  for (const game of matchesForTeam(teamId)) {
    if (!completedOrPlaying(game.status))
      continue;
    if (game.homeScore === game.awayScore) {
      yield 'draw';
    } else if (game.homeId === teamId) {
      if (game.homeScore > game.awayScore)
        yield 'win';
      else
        yield 'loss';
    } else {
      if (game.awayScore > game.homeScore)
        yield 'win';
      else
        yield 'loss';
    }
  }
}

function lastFive(teamId) {
}
function renderMatches(teamId, parent = document.body) {
  const container = document.createElement('div');
  container.classList.add('matches');
  let scrollIndex = 0;
  let index = 0;
  for (const game of matchesForTeam(teamId)) {
    const match = document.createElement('div');
    match.classList.add('match');
    container.appendChild(match);
    const scoreTime = document.createElement('div');
    scoreTime.classList.add('score-time');
    if (completedOrPlaying(game.status))
      scoreTime.append(namedText('score', game.homeScore + ' - ' + game.awayScore));
    else if (game.status === 'postponed')
      scoreTime.append(namedText('status', game.status));
    else
      scoreTime.append(
        namedText('date', formatDate(new Date(game.date))),
      );
    if (game.status === 'playing')
      scoreTime.classList.add('ongoing');
    const home = renderTeamName(findTeam(game.homeId), true);
    const away = renderTeamName(findTeam(game.awayId));
    if (completedOrPlaying(game.status)) {
      if (game.homeScore > game.awayScore)
        home.classList.add('winner');
      else if (game.homeScore < game.awayScore)
        away.classList.add('winner');
    }
    if (completedOrPlaying(game.status))
      scrollIndex = index;
    index++;
    match.append(
      home,
      scoreTime,
      away,
    );
  }
  parent.append(container);
  const rowHeight = parseInt(window.getComputedStyle(document.body).getPropertyValue('--row-height'));
  container.scrollTop = rowHeight * (scrollIndex - 4);
}

/**
 * @param {Date} date
 */
function formatDate(date) {
  const now = new Date();
  return `${date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    // hour: 'numeric',
    // minute: 'numeric',
  })}`;
}

function findTeam(id) {
  return squads.find(x => x.id === id);
}

function renderTeamName(team, isRight = false) {
  const logo = document.createElement('img');
  logo.classList.add('logo');
  logo.src = './light/' + team.id + '.png';
  logo.width = 28;
  logo.height = 28;
  const span = document.createElement('span');
  span.classList.add('team-name');
  const name = namedText('name', team.name);
  if (isRight)
    span.append(name, logo);
  else
    span.append(logo, name);
  return span;
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
      if (!completedOrPlaying(game.status))
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

function completedOrPlaying(status) {
  return status === 'playing' || status === 'completed';
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