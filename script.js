document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const leagueSelect = document.getElementById('leagueSelect');
    const newLeagueName = document.getElementById('newLeagueName');
    const createLeagueButton = document.getElementById('createLeagueButton');
    const competitionSelect = document.getElementById('competitionSelect');
    const addTeamButton = document.getElementById('addTeamButton');
    const teamNameInput = document.getElementById('teamNameInput');
    const teamsList = document.getElementById('teamsList');
    const generateScheduleButton = document.getElementById('generateScheduleButton');
    const scheduleDisplay = document.getElementById('scheduleDisplay');
    const matchSelect = document.getElementById('matchSelect');
    const addSetButton = document.getElementById('addSetButton');
    const matchDateInput = document.getElementById('matchDate');
    const matchStatusSelect = document.getElementById('matchStatus');
    const scoreInputs = document.getElementById('scoreInputs');
    const saveMatchButton = document.getElementById('saveMatchButton');
    const resultsTableBody = document.querySelector('#resultsTable tbody');
    const deleteLeagueButton = document.getElementById('deleteLeagueButton');
    const exportDataButton = document.getElementById('exportDataButton'); // Export Button

    // App state variables
    let leagues = {};
    let currentLeague = null;
    const appsScriptUrl = "https://script.google.com/macros/s/AKfycbynF-0Y2SGdiQ40Ma8B6tqRJhSrlpYCkWQsgxcpb0oT7TjgESWwWqJ_Ij41inlgZSb_/exec"; // Replace with your Apps Script URL


    // Load leagues from localStorage
    function loadLeagues() {
        try {
            const storedLeagues = localStorage.getItem('volleyballLeagues');
            if (storedLeagues) {
                leagues = JSON.parse(storedLeagues);
                console.log('Leagues loaded:', leagues);
                updateLeagueSelect();
            }
        } catch (error) {
            console.error('Error loading leagues from local storage:', error);
        }
    }

    // Save leagues to localStorage
    function saveLeagues() {
        try {
            localStorage.setItem('volleyballLeagues', JSON.stringify(leagues));
        } catch (error) {
            console.error('Error saving leagues to local storage:', error);
        }
    }

    // Initialization: Load leagues on page load
    loadLeagues();

    // Update league select dropdown
    function updateLeagueSelect() {
        leagueSelect.innerHTML = '<option value="">Selecciona una liga</option>';
        for (const leagueName in leagues) {
            const option = document.createElement('option');
            option.value = leagueName;
            option.textContent = leagueName;
            leagueSelect.appendChild(option);
        }
    }

    // Load data for a specific league
    function loadLeagueData(leagueName) {
         currentLeague = leagues[leagueName];
        if (!currentLeague) {
            currentLeague = { teams: [], matches: [], schedule: [], results: [], competitionType: "roundRobin", matchInfo: {} };
            leagues[leagueName] = currentLeague;
        }
        competitionSelect.value = currentLeague.competitionType;
        updateTeamList();
        displaySchedule();
        updateMatchSelect();
        updateResultsTable();
        displayMatchResults();
    }

    function resetCurrentLeague() {
        currentLeague = { teams: [], matches: [], schedule: [], results: [], competitionType: "roundRobin", matchInfo: {} };
        updateTeamList();
        displaySchedule();
        updateMatchSelect();
        updateResultsTable();
        displayMatchResults();
    }


     // Update the team list in the UI
    function updateTeamList() {
        teamsList.innerHTML = '';
        if (!currentLeague) {
            return;
        }

        currentLeague.teams.forEach((team, index) => {
            const li = document.createElement('li');
            li.textContent = team.name;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.classList.add('delete-team-button')
            deleteButton.dataset.index = index;
            deleteButton.addEventListener('click', removeTeam);
            li.appendChild(deleteButton);
            teamsList.appendChild(li);
        });
    }

    // Remove a team
    function removeTeam(event) {
        const index = event.target.dataset.index;
        currentLeague.teams.splice(index, 1);
        currentLeague.schedule = [];
        updateTeamList();
        scheduleDisplay.innerHTML = "";
        updateMatchSelect();
        saveLeagues();
    }

     // Update the match select dropdown
    function updateMatchSelect() {
        matchSelect.innerHTML = '<option value="">Selecciona un partido</option>';
        if (!currentLeague || !currentLeague.schedule) {
            return;
        }

         currentLeague.schedule.forEach((round, roundIndex) => {
             if (Array.isArray(round)) {
                round.forEach((match, matchIndex) => {
                    const matchId = `${roundIndex}-${matchIndex}`;
                    const matchStatus = currentLeague.matchInfo[matchId]?.status || 'Pendiente';
                    if (!currentLeague.matchInfo[matchId] || currentLeague.matchInfo[matchId].status !== 'played') {
                        const option = document.createElement('option');
                        option.value = `${roundIndex}-${matchIndex}`;
                        option.textContent = `Ronda ${roundIndex + 1}: ${match.teamA?.name || 'Descansa'} vs ${match.teamB?.name || 'Descansa'} (${matchStatus})`;
                        matchSelect.appendChild(option);
                    }
                });
            } else if (typeof round === 'object' && round !== null && round.hasOwnProperty('teamA') && round.hasOwnProperty('teamB')) {
                const matchId = `${roundIndex}`;
                 const matchStatus = currentLeague.matchInfo[matchId]?.status || 'Pendiente';
                 if(!currentLeague.matchInfo[matchId] || currentLeague.matchInfo[matchId].status !== 'played'){
                   const option = document.createElement('option');
                    option.value = `${roundIndex}`;
                    option.textContent = `Final: ${round.teamA?.name || 'Descansa'} vs ${round.teamB?.name || 'Descansa'} (${matchStatus})`;
                    matchSelect.appendChild(option);
                }
            }
        });
    }

    // Event listener for the create league button
    createLeagueButton.addEventListener('click', function () {
        const leagueName = newLeagueName.value.trim();
        if (!leagueName) {
            alert('Por favor, introduce un nombre para la liga');
            return;
        }

        if (!/^[a-zA-Z0-9\s]+$/.test(leagueName)){
            alert('El nombre de la liga solo puede contener letras, números y espacios.');
            return;
        }
         if (leagues[leagueName]) {
            alert("Ya existe una liga con este nombre");
            return;
        }
        leagues[leagueName] = { teams: [], matches: [], schedule: [], results: [], competitionType: "roundRobin", matchInfo: {} };
        updateLeagueSelect();
        newLeagueName.value = "";
        saveLeagues();
        leagueSelect.value = leagueName; // Select the newly created league in the dropdown
        loadLeagueData(leagueName); // Load data for the new league
    });

    // Event listener for the delete league button
    deleteLeagueButton.addEventListener('click', function () {
        const selectedLeague = leagueSelect.value;
        if (selectedLeague) {
            delete leagues[selectedLeague];
            saveLeagues();
            updateLeagueSelect();
            resetCurrentLeague();
        } else {
            alert('Por favor, selecciona una liga para eliminar');
        }
    });

    // Event listener for league select change
    leagueSelect.addEventListener('change', function () {
        const selectedLeague = leagueSelect.value;
        if (selectedLeague) {
            loadLeagueData(selectedLeague);
        } else {
            resetCurrentLeague();
        }
    });

    // Event listener for competition type change
    competitionSelect.addEventListener('change', function () {
         if (currentLeague) {
            currentLeague.competitionType = competitionSelect.value;
             currentLeague.schedule = [];
             displaySchedule();
             updateMatchSelect();
            saveLeagues();
        }
    });

    // Event listener for add team button
    addTeamButton.addEventListener('click', function () {
         if (!currentLeague) {
            alert('Por favor, crea o selecciona una liga primero');
            return;
        }
        const teamName = teamNameInput.value.trim();
          if (!teamName){
            alert('Por favor, introduce un nombre para el equipo');
            return;
        }

        if (!/^[a-zA-Z0-9\s]+$/.test(teamName)){
            alert('El nombre del equipo solo puede contener letras, números y espacios.');
           return;
        }
        const newTeam = { name: teamName, wins: 0, losses: 0, setsWon: 0, pointsWon: 0};
        currentLeague.teams.push(newTeam);
        updateTeamList();
        teamNameInput.value = "";
        saveLeagues();
    });

    // Event listener for generate schedule button
    generateScheduleButton.addEventListener('click', function () {
        if (!currentLeague) {
            alert('Por favor, crea o selecciona una liga primero');
            return;
        }
         if (currentLeague.teams.length < 2) {
            alert('Se necesitan al menos 2 equipos para generar el calendario');
            return;
        }
        currentLeague.schedule = generateSchedule(currentLeague.teams, currentLeague.competitionType);
        displaySchedule();
        updateMatchSelect();
        saveLeagues();
    });

     // Function to generate the schedule
    function generateSchedule(teams, competitionType) {
        let schedule;
        switch (competitionType) {
            case 'roundRobin':
                schedule = createRoundRobinSchedule(teams);
                break;
            case 'singleElimination':
                schedule = createSingleEliminationSchedule(teams);
                break;
            case 'doubleElimination':
                schedule = createDoubleEliminationSchedule(teams);
                 break;
            case 'divisionalPlay':
                schedule = createDivisionalPlaySchedule(teams);
                break;
            default:
                schedule = createRoundRobinSchedule(teams);
        }
         schedule.forEach((round, roundIndex) => {
            if (Array.isArray(round)) {
                 round.forEach((match, matchIndex) => {
                    const matchId = `${roundIndex}-${matchIndex}`;
                     const matchDate = new Date();
                    matchDate.setDate(matchDate.getDate() + (roundIndex * 7));
                    const formattedDate = matchDate.toISOString().split('T')[0];
                    if (!currentLeague.matchInfo[matchId]){
                        currentLeague.matchInfo[matchId] = { status: 'pending', date: formattedDate };
                    } else {
                        currentLeague.matchInfo[matchId].date = formattedDate;
                    }
                });
            } else if (typeof round === 'object' && round !== null && round.hasOwnProperty('teamA') && round.hasOwnProperty('teamB')) {
               const matchId = `${roundIndex}`;
                const matchDate = new Date();
                matchDate.setDate(matchDate.getDate() + (roundIndex * 7));
                const formattedDate = matchDate.toISOString().split('T')[0];
                 if (!currentLeague.matchInfo[matchId]){
                    currentLeague.matchInfo[matchId] = { status: 'pending', date: formattedDate };
                } else {
                    currentLeague.matchInfo[matchId].date = formattedDate;
                }
            }
        });
         return schedule;
    }

     // Function to create round robin schedule
    function createRoundRobinSchedule(teams) {
        const numberOfTeams = teams.length;
        const numberOfRounds = numberOfTeams - 1;
        const schedule = [];

        for (let round = 0; round < numberOfRounds; round++) {
            const roundMatches = [];
            for (let i = 0; i < numberOfTeams / 2; i++) {
                const teamA = teams[i];
                const teamB = teams[numberOfTeams - 1 - i];
                if (teamA && teamB) {
                     if (teamA !== teamB) {
                       roundMatches.push({ teamA: teamA, teamB: teamB });
                   } else {
                       roundMatches.push({ teamA: teamA, teamB: null });
                    }
                } else if (teamA) {
                    roundMatches.push({ teamA: teamA, teamB: null });
                }
            }
            schedule.push(roundMatches);
            teams.splice(1, 0, teams.pop());
        }
        return schedule;
    }

      // Function to create single elimination schedule
    function createSingleEliminationSchedule(teams) {
        const numberOfTeams = teams.length;
        const schedule = [];
        if (numberOfTeams < 2) {
            return schedule;
        }
        let tempTeams = [...teams];
         while (tempTeams.length > 1) {
            const matches = [];
            while (tempTeams.length > 0) {
                const teamA = tempTeams.shift();
                const teamB = tempTeams.shift();
               if (teamB) {
                    matches.push({ teamA, teamB });
                } else {
                     matches.push({ teamA: teamA, teamB: null });
                }
           }
            schedule.push(matches);
           tempTeams = matches.filter(match => match.teamB).map(match => match.teamA);
        }
        return schedule;
    }

     // Function to create double elimination schedule
     function createDoubleEliminationSchedule(teams) {
        const numberOfTeams = teams.length;
        const schedule = [];
         if (numberOfTeams < 2) {
            return schedule;
        }
         const winnersBracket = [];
        let losersBracket = [];
        let tempTeams = [...teams];
         while (tempTeams.length > 1) {
             const matches = [];
           while (tempTeams.length > 0) {
                const teamA = tempTeams.shift();
                const teamB = tempTeams.shift();
                if (teamB) {
                    matches.push({ teamA, teamB });
                } else {
                    matches.push({ teamA: teamA, teamB: null });
                }
            }
            winnersBracket.push(matches);
            tempTeams = matches.filter(match => match.teamB).map(match => match.teamA);
        }
          losersBracket.push(winnersBracket[0].filter(match => match.teamB).map(match => match.teamB).reverse());
        let losersCurrentRound = losersBracket[0];
        while (losersCurrentRound.length > 1) {
            const losersMatches = [];
            while (losersCurrentRound.length > 0) {
                const teamA = losersCurrentRound.shift();
                const teamB = losersCurrentRound.shift();
                 losersMatches.push({ teamA, teamB });
            }
           losersBracket.push(losersMatches);
           losersCurrentRound = losersMatches.filter(match => match.teamB).map(match => match.teamA);
        }
       schedule.push(...winnersBracket);
       schedule.push(...losersBracket);
        return schedule;
    }
      // Function to create divisional play schedule
    function createDivisionalPlaySchedule(teams) {
        const numberOfTeams = teams.length;
        const schedule = [];
        if (numberOfTeams < 2) {
            return schedule;
        }

       const divisions = Math.ceil(numberOfTeams / 2);
       const divisionTeams = [];
       for (let i = 0; i < divisions; i++) {
            divisionTeams.push([]);
        }

        teams.forEach((team, index) => {
             divisionTeams[index % divisions].push(team);
       });

        divisionTeams.forEach((division, index) => {
            const divisionSchedule = createRoundRobinSchedule(division);
           schedule.push(...divisionSchedule.map(round => {
               return round;
            }));
        });
        const finalMatch = {
            teamA: divisionTeams[0][0],
            teamB: divisionTeams[divisionTeams.length - 1][0]
        };
       schedule.push(finalMatch);
        return schedule;
    }

   // Display the schedule in the UI
     function displaySchedule() {
        scheduleDisplay.innerHTML = '';
        if (!currentLeague || !currentLeague.schedule) {
            return;
        }
        const table = document.createElement('table');
        table.classList.add('schedule-table');

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th>Ronda/Partido</th>
            <th>Equipo A</th>
            <th>Equipo B</th>
            <th>Fecha</th>
            <th>Estado</th>
         `;
        thead.appendChild(headerRow);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        currentLeague.schedule.forEach((round, roundIndex) => {
             if (Array.isArray(round)) {
                round.forEach(match => {
                    const row = document.createElement('tr');
                    const matchId = `${roundIndex}-${currentLeague.schedule[roundIndex].indexOf(match)}`;
                    const matchStatus = currentLeague.matchInfo[matchId].status;
                     const matchDate = currentLeague.matchInfo[matchId].date;
                    row.innerHTML = `
                         <td>Ronda ${roundIndex + 1}</td>
                        <td>${match.teamA?.name || 'Descansa'}</td>
                        <td>${match.teamB?.name || 'Descansa'}</td>
                         <td><input type="date" class="match-date-input" value="${matchDate}" data-match-id="${matchId}"></td>
                         <td>
                            <span class="match-status-indicator ${getStatusClass(matchStatus)}">
                                ${matchStatus.toUpperCase()}
                            </span>
                            <select class="match-status-select" data-match-id="${matchId}">
                                 <option value="pending" ${matchStatus === 'pending' ? 'selected' : ''}>Pendiente</option>
                                <option value="played" ${matchStatus === 'played' ? 'selected' : ''}>Jugado</option>
                                 <option value="suspended" ${matchStatus === 'suspended' ? 'selected' : ''}>Suspendido</option>
                            </select>
                       </td>
                    `;
                    tbody.appendChild(row);
                });
            } else if (typeof round === 'object' && round !== null && round.hasOwnProperty('teamA') && round.hasOwnProperty('teamB')) {
                const row = document.createElement('tr');
                const matchId = `${roundIndex}`;
                const matchStatus = currentLeague.matchInfo[matchId].status;
                 const matchDate = currentLeague.matchInfo[matchId].date;

                row.innerHTML = `
                         <td>Final</td>
                        <td>${round.teamA?.name || 'Descansa'}</td>
                        <td>${round.teamB?.name || 'Descansa'}</td>
                        <td><input type="date" class="match-date-input" value="${matchDate}" data-match-id="${matchId}"></td>
                         <td>
                             <span class="match-status-indicator ${getStatusClass(matchStatus)}">
                                 ${matchStatus.toUpperCase()}
                             </span>
                             <select class="match-status-select" data-match-id="${matchId}">
                                 <option value="pending" ${matchStatus === 'pending' ? 'selected' : ''}>Pendiente</option>
                                <option value="played" ${matchStatus === 'played' ? 'selected' : ''}>Jugado</option>
                                 <option value="suspended" ${matchStatus === 'suspended' ? 'selected' : ''}>Suspendido</option>
                             </select>
                         </td>
                    `;
               tbody.appendChild(row);
           }
        });

        table.appendChild(tbody);
        scheduleDisplay.appendChild(table);

         // Event listeners for date and status changes
        scheduleDisplay.querySelectorAll('.match-date-input').forEach(input => {
            input.addEventListener('change', (event) => {
                const matchId = event.target.dataset.matchId;
                 currentLeague.matchInfo[matchId].date = event.target.value;
                displaySchedule();
                 updateMatchSelect();
                saveLeagues();
            });
        });
        scheduleDisplay.querySelectorAll('.match-status-select').forEach(select => {
            select.addEventListener('change', (event) => {
                const matchId = event.target.dataset.matchId;
                 currentLeague.matchInfo[matchId].status = event.target.value;
                 displaySchedule();
                 updateMatchSelect();
                saveLeagues();
            });
        });
    }

    // Function to get the status class
    function getStatusClass(status) {
        switch (status) {
            case 'pending':
                return 'match-status-pending';
           case 'played':
                return 'match-status-played';
             case 'suspended':
                return 'match-status-suspended';
           default:
                return '';
        }
    }

     // Event listener for add set button
    addSetButton.addEventListener('click', function () {
        const scoreInputDiv = document.createElement('div');
        scoreInputDiv.classList.add('score-input');
        const scoreInputA = document.createElement('input');
        scoreInputA.type = "number";
        scoreInputA.placeholder = "Equipo A";
        scoreInputA.classList.add('score-input-a');
        scoreInputDiv.appendChild(scoreInputA);

        const scoreInputB = document.createElement('input');
        scoreInputB.type = "number";
        scoreInputB.placeholder = "Equipo B";
        scoreInputB.classList.add('score-input-b');
        scoreInputDiv.appendChild(scoreInputB);
        scoreInputs.appendChild(scoreInputDiv);
    });


    // Function to get match result
    function getMatchResult(match) {
        let teamAWins = 0;
        let teamBWins = 0;
        let teamAPoints = 0;
        let teamBPoints = 0;
        match.sets.forEach(set => {
            teamAPoints += set.scoreA;
            teamBPoints += set.scoreB;
            if (set.scoreA > set.scoreB) {
                teamAWins++;
            } else if (set.scoreB > set.scoreA) {
                teamBWins++;
            }
        });
        return { teamAWins, teamBWins, teamAPoints, teamBPoints };
    }


   // Event listener for the save match button
    saveMatchButton.addEventListener('click', function () {
        const matchValue = matchSelect.value;
         if (!matchValue) {
            alert('Selecciona un partido válido.');
           return;
        }
        const [roundIndex, matchIndex] = matchValue.split('-').map(Number);
       let selectedMatch;
         if (Array.isArray(currentLeague.schedule[roundIndex])) {
           selectedMatch = currentLeague.schedule[roundIndex][matchIndex];
        } else {
            selectedMatch = currentLeague.schedule[roundIndex];
        }
        const sets = [];
        let allSetsValid = true;
         scoreInputs.querySelectorAll('.score-input').forEach(setElement => {
            const scoreA = parseInt(setElement.querySelector('.score-input-a').value);
            const scoreB = parseInt(setElement.querySelector('.score-input-b').value);

           if (isNaN(scoreA) || isNaN(scoreB)) {
                alert('Ingresa puntajes válidos para cada set.');
                allSetsValid = false;
                return;
            }
           sets.push({ scoreA, scoreB });
        });
         if (!allSetsValid) {
            return;
        }
         if (sets.length === 0) {
             alert('Añade al menos un set');
             return;
        }
       const matchResult = {
             teamA: selectedMatch.teamA,
            teamB: selectedMatch.teamB,
           sets: sets
        };
          const existingMatchIndex = currentLeague.results.findIndex(
            result => result.teamA === selectedMatch.teamA && result.teamB === selectedMatch.teamB
       );
       if (existingMatchIndex !== -1) {
            currentLeague.results[existingMatchIndex] = matchResult;
        } else {
            currentLeague.results.push(matchResult);
       }
        const matchId = Array.isArray(currentLeague.schedule[roundIndex]) ? `${roundIndex}-${matchIndex}` : `${roundIndex}`;
          currentLeague.matchInfo[matchId] = {
           date: matchDateInput.value,
           status: matchStatusSelect.value
      };
        displaySchedule();
        updateMatchResults();
        updateMatchSelect();
        scoreInputs.innerHTML = '';
       matchDateInput.value = '';
        matchStatusSelect.value = 'pending';
       saveLeagues();
    });


    // Function to update team results
    function updateMatchResults() {
         if (!currentLeague) return;

        // Reset all team stats
        currentLeague.teams.forEach(team => {
           team.wins = 0;
            team.losses = 0;
           team.setsWon = 0;
            team.pointsWon = 0;
        });

        // Calculate each team's stats
        currentLeague.results.forEach(match => {
            const { teamAWins, teamBWins, teamAPoints, teamBPoints } = getMatchResult(match);


            const teamA = currentLeague.teams.find(team => team.name === match.teamA.name);
            const teamB = currentLeague.teams.find(team => team.name === match.teamB.name);

              if (teamA && teamB) {
                  if(teamAWins > teamBWins) {
                    teamA.wins++;
                    teamB.losses++;
                     teamA.setsWon += match.sets.length;
                 } else if (teamBWins > teamAWins) {
                    teamB.wins++;
                     teamA.losses++;
                      teamB.setsWon += match.sets.length;
                 }
                  teamA.pointsWon += teamAPoints;
                 teamB.pointsWon += teamBPoints;
              }

        });
         updateResultsTable();
        displayMatchResults();
    }

    // Function to update the results table
     function updateResultsTable() {
        resultsTableBody.innerHTML = '';
         if (!currentLeague) {
            return;
        }
        currentLeague.teams.forEach(team => {
            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
             nameCell.textContent = team.name;
            row.appendChild(nameCell);

           const playedCell = document.createElement('td');
            playedCell.textContent = team.wins + team.losses;
            row.appendChild(playedCell);

           const winCell = document.createElement('td');
           winCell.textContent = team.wins;
           row.appendChild(winCell);

           const loseCell = document.createElement('td');
           loseCell.textContent = team.losses;
            row.appendChild(loseCell);

            const setsCell = document.createElement('td');
           setsCell.textContent = team.setsWon;
           row.appendChild(setsCell);

           const pointsCell = document.createElement('td');
           pointsCell.textContent = team.pointsWon;
           row.appendChild(pointsCell);

           const resultsCell = document.createElement('td');
           const matches = currentLeague.results.filter(match => match.teamA.name === team.name || match.teamB.name === team.name);

           const resultsText = matches.map(match => {
                const { teamAWins, teamBWins } = getMatchResult(match);

                if (match.teamA.name === team.name) {
                     return `${teamAWins}-${teamBWins} (${match.sets.map(set => `${set.scoreA}-${set.scoreB}`).join(', ')})`;
               } else if (match.teamB.name === team.name) {
                     return `${teamBWins}-${teamAWins} (${match.sets.map(set => `${set.scoreB}-${set.scoreA}`).join(', ')})`;
                }
            }).join(' <br> ');
           resultsCell.innerHTML = resultsText;
           row.appendChild(resultsCell);
            resultsTableBody.appendChild(row);
        });
    }
     // Function to display the selected match result
    function displayMatchResults() {
        scoreInputs.innerHTML = '';
        if (!currentLeague || !currentLeague.results) {
           return;
        }
         const selectedMatchValue = matchSelect.value;
        if (!selectedMatchValue) return;
        const [roundIndex, matchIndex] = selectedMatchValue.split('-').map(Number);
        let selectedMatch;
        if (Array.isArray(currentLeague.schedule[roundIndex])) {
           selectedMatch = currentLeague.schedule[roundIndex][matchIndex];
       } else {
           selectedMatch = currentLeague.schedule[roundIndex];
       }

         const matchResult = currentLeague.results.find(
           result => result.teamA.name === selectedMatch.teamA.name && result.teamB.name === selectedMatch.teamB.name
        );
        if (matchResult) {
            matchResult.sets.forEach(set => {
                const scoreInputDiv = document.createElement('div');
                scoreInputDiv.classList.add('score-input');
                const scoreInputA = document.createElement('input');
                scoreInputA.type = "number";
               scoreInputA.placeholder = "Equipo A";
               scoreInputA.classList.add('score-input-a');
               scoreInputA.value = set.scoreA;
                scoreInputDiv.appendChild(scoreInputA);

                const scoreInputB = document.createElement('input');
                scoreInputB.type = "number";
               scoreInputB.placeholder = "Equipo B";
              scoreInputB.classList.add('score-input-b');
               scoreInputB.value = set.scoreB;
                scoreInputDiv.appendChild(scoreInputB);
               scoreInputs.appendChild(scoreInputDiv);
           });
      }
       const matchId = Array.isArray(currentLeague.schedule[roundIndex]) ? `${roundIndex}-${currentLeague.schedule[roundIndex].indexOf(selectedMatch)}` : `${roundIndex}`;
       if(currentLeague.matchInfo[matchId]){
           matchDateInput.value = currentLeague.matchInfo[matchId].date;
           matchStatusSelect.value = currentLeague.matchInfo[matchId].status;
       } else {
            matchDateInput.value = "";
           matchStatusSelect.value = 'pending';
        }
    }
    // Event listener for match select change
    matchSelect.addEventListener('change', displayMatchResults);

    // Event listener for export data button
    exportDataButton.addEventListener('click', function() {
        if (!currentLeague) {
            alert('Por favor, selecciona una liga para exportar datos.');
            return;
        }

        const dataToExport = {
            leagueName: leagueSelect.value,
            competitionType: currentLeague.competitionType,
            teams: currentLeague.teams,
            schedule: currentLeague.schedule,
            matchInfo: currentLeague.matchInfo,
            results: currentLeague.results
        };

        fetch(appsScriptUrl, {
            method: 'POST',
            mode: 'no-cors', // Avoid CORS issues for simple requests
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToExport)
        })
        .then(response => {
            // Since mode is no-cors, response object will be opaque and limited
             alert('Datos exportados a Google Sheet exitosamente (verifique la hoja de cálculo).');
        })
        .catch(error => {
            console.error('Error al exportar datos:', error);
            alert('Error al exportar datos a Google Sheet.');
        });
    });


    // Initialization: Update the league selector
    updateLeagueSelect();
});
