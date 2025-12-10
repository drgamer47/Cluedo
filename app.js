// Application Logic

const game = new ClueGame();
let isGameSetup = false;
let youDisplayName = 'You'; // Store the custom name for "You"

// Setup game - Add input validation to automatically correct invalid values
const numPlayersInput = document.getElementById('numPlayers');

// Validate and correct on input (as user types)
numPlayersInput.addEventListener('input', (e) => {
    let value = parseInt(e.target.value);
    // Allow empty input while typing
    if (isNaN(value)) {
        return;
    }
    // Auto-correct to valid range
    if (value < 2) {
        e.target.value = 2;
    } else if (value > 6) {
        e.target.value = 6;
    }
});

// Validate on blur (when user leaves the field) - handles edge cases
numPlayersInput.addEventListener('blur', (e) => {
    let value = parseInt(e.target.value);
    if (isNaN(value) || value < 2) {
        e.target.value = 2;
    } else if (value > 6) {
        e.target.value = 6;
    }
});

document.getElementById('setupGame').addEventListener('click', () => {
    console.log('[setupGame] Button clicked');
    const numPlayersInput = document.getElementById('numPlayers');
    const numPlayers = parseInt(numPlayersInput.value);
    console.log('[setupGame] Number of players:', numPlayers);
    
    // Validate minimum players
    if (numPlayers < 2) {
        console.warn('[setupGame] Invalid number of players (too few):', numPlayers);
        alert('You need at least 2 players (including yourself).');
        numPlayersInput.value = 2;
        return;
    }
    
    // Validate maximum players
    if (numPlayers > 6) {
        console.warn('[setupGame] Invalid number of players (too many):', numPlayers);
        alert('Maximum 6 players allowed (including yourself).');
        numPlayersInput.value = 6;
        return;
    }
    
    
    const playerNamesDiv = document.getElementById('playerNames');
    playerNamesDiv.innerHTML = '';
    
    // Add "You" as the first player option (included in the total count)
    const youInput = document.createElement('input');
    youInput.type = 'text';
    youInput.placeholder = 'Your Name';
    youInput.id = 'playerYou';
    youInput.value = 'You';
    playerNamesDiv.appendChild(youInput);
    
    // Create input fields for other players (numPlayers - 1, since "You" is included)
    const numOtherPlayers = numPlayers - 1;
    for (let i = 0; i < numOtherPlayers; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Player ${i + 1} Name`;
        input.id = `player${i}`;
        input.value = `Player ${i + 1}`;
        playerNamesDiv.appendChild(input);
    }
    
    // Setup button
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirm Players';
    confirmBtn.style.marginTop = '10px';
        confirmBtn.addEventListener('click', () => {
        console.log('[confirmPlayers] Button clicked');
        const names = [];
        // Store the custom display name for "You"
        const youNameInput = document.getElementById('playerYou');
        youDisplayName = youNameInput.value.trim() || 'You';
        console.log('[confirmPlayers] Your display name:', youDisplayName);
        // Always use the internal identifier "You" for the first slot to avoid
        // creating an extra player when the user renames themselves.
        names.push('You');
        // Add other players after You (each is to the left in order)
        for (let i = 0; i < numOtherPlayers; i++) {
            const name = document.getElementById(`player${i}`).value || `Player ${i + 1}`;
            names.push(name);
        }
        console.log('[confirmPlayers] Player names:', names);
        
            // Pass total number of players (which includes "You")
        game.setupGame(numPlayers, names);
        isGameSetup = true;
        console.log('[confirmPlayers] Game setup complete, isGameSetup:', isGameSetup);
        document.getElementById('mainContent').style.display = 'grid';
        updateUI();
    });
    
    playerNamesDiv.appendChild(confirmBtn);
});

// Initialize dropdowns
function initializeDropdowns() {
    const sugPlayer = document.getElementById('sugPlayer');
    const sugCharacter = document.getElementById('sugCharacter');
    const sugRoom = document.getElementById('sugRoom');
    const sugWeapon = document.getElementById('sugWeapon');
    const sugShownBy = document.getElementById('sugShownBy');
    
    // Populate player dropdowns
    function populatePlayerDropdowns() {
        sugPlayer.innerHTML = '<option value="">Select Player</option>';
        sugShownBy.innerHTML = '<option value="">Shown by (optional)</option>';
        
        // For suggestions, include "You" since you can make suggestions
        const allPlayersForSuggestions = ['You', ...game.players];
        
        // Suggestion player dropdown includes "You"
        allPlayersForSuggestions.forEach(player => {
                const option = document.createElement('option');
                option.value = player;
                option.textContent = getPlayerDisplayName(player);
            sugPlayer.appendChild(option);
        });
        
        // Shown by dropdown includes all players
        allPlayersForSuggestions.forEach(player => {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = getPlayerDisplayName(player);
            sugShownBy.appendChild(option);
        });
    }
    
    // Populate suggestion dropdowns
    function populateSuggestionDropdowns() {
        sugCharacter.innerHTML = '<option value="">Character</option>';
        game.characters.forEach(char => {
            const option = document.createElement('option');
            option.value = char;
            option.textContent = char;
            sugCharacter.appendChild(option);
        });
        
        sugRoom.innerHTML = '<option value="">Room</option>';
        game.rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room;
            option.textContent = room;
            sugRoom.appendChild(option);
        });
        
        sugWeapon.innerHTML = '<option value="">Weapon</option>';
        game.weapons.forEach(weapon => {
            const option = document.createElement('option');
            option.value = weapon;
            option.textContent = weapon;
            sugWeapon.appendChild(option);
        });
    }
    
    populatePlayerDropdowns();
    populateSuggestionDropdowns();
}

// Handle "shown to me" checkbox
document.getElementById('shownToMe').addEventListener('change', (e) => {
    const cardShownSelect = document.getElementById('sugCardShown');
    const shownBySelect = document.getElementById('sugShownBy');
    
    if (e.target.checked) {
        cardShownSelect.style.display = 'block';
        // Keep shownBy visible but update label
        shownBySelect.style.display = 'block';
        const firstOption = shownBySelect.querySelector('option');
        if (firstOption) {
            firstOption.textContent = 'Who showed you the card?';
        }
        
        // Populate card shown dropdown with the three cards from the suggestion
        updateCardShownDropdown();
    } else {
        // Don't hide cardShownSelect - allow specifying card even when not shown to me
        // Just update the label
        const firstOption = shownBySelect.querySelector('option');
        if (firstOption) {
            firstOption.textContent = 'Shown by (optional)';
        }
        // Update card shown dropdown in case cards changed
        updateCardShownDropdown();
    }
});

// Show card shown dropdown when shownBy is selected (even if not shown to me)
document.getElementById('sugShownBy').addEventListener('change', () => {
    const cardShownSelect = document.getElementById('sugCardShown');
    const shownBy = document.getElementById('sugShownBy').value;
    
    if (shownBy) {
        // Show the card dropdown if someone showed a card
        cardShownSelect.style.display = 'block';
        updateCardShownDropdown();
    } else {
        // Hide if no one showed a card
        cardShownSelect.style.display = 'none';
        cardShownSelect.value = '';
    }
});

function updateCardShownDropdown() {
    const cardShownSelect = document.getElementById('sugCardShown');
    const character = document.getElementById('sugCharacter').value;
    const room = document.getElementById('sugRoom').value;
    const weapon = document.getElementById('sugWeapon').value;
    
    cardShownSelect.innerHTML = '<option value="">Which card was shown?</option>';
    if (character) {
        const option = document.createElement('option');
        option.value = character;
        option.textContent = character;
        cardShownSelect.appendChild(option);
    }
    if (room) {
        const option = document.createElement('option');
        option.value = room;
        option.textContent = room;
        cardShownSelect.appendChild(option);
    }
    if (weapon) {
        const option = document.createElement('option');
        option.value = weapon;
        option.textContent = weapon;
        cardShownSelect.appendChild(option);
    }
}

// Update card shown dropdown when suggestion cards change
['sugCharacter', 'sugRoom', 'sugWeapon'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
        if (document.getElementById('shownToMe').checked) {
            updateCardShownDropdown();
        }
    });
});

// Update "Shown by" dropdown to exclude the suggester (a player can't show a card to themselves)
document.getElementById('sugPlayer').addEventListener('change', () => {
    const suggester = document.getElementById('sugPlayer').value;
    const shownBySelect = document.getElementById('sugShownBy');
    const currentValue = shownBySelect.value;
    
    // Rebuild the dropdown, excluding the suggester
    const allPlayersForSuggestions = ['You', ...game.players];
    shownBySelect.innerHTML = '<option value="">Shown by (optional)</option>';
    
    allPlayersForSuggestions.forEach(player => {
        // Don't include the suggester (they can't show a card to themselves)
        if (player !== suggester) {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = getPlayerDisplayName(player);
            shownBySelect.appendChild(option);
        }
    });
    
    // If the current value was the suggester, clear it
    if (currentValue === suggester) {
        shownBySelect.value = '';
    } else if (currentValue) {
        // Try to restore the previous value if it's still valid
        shownBySelect.value = currentValue;
    }
});

// Add suggestion
document.getElementById('addSuggestion').addEventListener('click', () => {
    console.log('[addSuggestion] Button clicked');
    const player = document.getElementById('sugPlayer').value;
    const character = document.getElementById('sugCharacter').value;
    const room = document.getElementById('sugRoom').value;
    const weapon = document.getElementById('sugWeapon').value;
    const shownToMe = document.getElementById('shownToMe').checked;
    const cardShown = document.getElementById('sugCardShown').value;
    const shownBy = document.getElementById('sugShownBy').value;
    console.log('[addSuggestion] Data:', { player, character, room, weapon, shownToMe, cardShown, shownBy });
    
    if (!player || !character || !room || !weapon) {
        alert('Please fill in all suggestion fields');
        return;
    }
    
    if (shownToMe) {
        if (!cardShown) {
            alert('Please select which card was shown to you');
            return;
        }
        if (!shownBy) {
            alert('Please select who showed you the card');
            return;
        }
        // A player can't show a card to themselves
        if (player === shownBy) {
            alert('A player cannot show a card to themselves. Please select a different player.');
            return;
        }
    }
    
    // Validate that if shownBy is set, they're not the same as the suggester
    if (shownBy && player === shownBy && !shownToMe) {
        alert('A player cannot show a card to themselves. The showing player must be different from the suggester.');
        return;
    }
    
    const suggestion = game.addSuggestion(player, character, room, weapon, shownBy || null, shownToMe, cardShown || null);
    console.log('[addSuggestion] Suggestion added:', suggestion);
    
    // Clear suggestion form
    document.getElementById('sugPlayer').value = '';
    document.getElementById('sugCharacter').value = '';
    document.getElementById('sugRoom').value = '';
    document.getElementById('sugWeapon').value = '';
    document.getElementById('sugShownBy').value = '';
    document.getElementById('shownToMe').checked = false;
    document.getElementById('sugCardShown').value = '';
    document.getElementById('sugCardShown').style.display = 'none';
    
    console.log('[addSuggestion] Form cleared, calling updateUI');
    updateUI();
});

// Get assistant suggestions
document.getElementById('getSuggestions').addEventListener('click', () => {
    const suggestions = game.getBestSuggestions();
    const container = document.getElementById('assistantSuggestions');
    
    if (suggestions.length === 0) {
        container.innerHTML = '<p>No suggestions available. Make sure the game is set up and you have marked some cards.</p>';
        return;
    }
    
    // Clear container first
    container.innerHTML = '';
    
    // Create clickable suggestion items
    suggestions.forEach((sug, index) => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'suggestion-item clickable-suggestion';
        // Replace "You" in the message with the display name
        const displayMessage = sug.message.replace(/\bYou\b/g, youDisplayName);
        suggestionDiv.innerHTML = `
            <strong>${getPlayerDisplayName(sug.player)}</strong>
            <div>${displayMessage}</div>
        `;
        
        // Add click handler to populate form
        suggestionDiv.addEventListener('click', () => {
            // Always set player to "You" since these are suggestions for you to make
            document.getElementById('sugPlayer').value = 'You';
            document.getElementById('sugCharacter').value = sug.character;
            document.getElementById('sugRoom').value = sug.room;
            document.getElementById('sugWeapon').value = sug.weapon;
            
            // Scroll to suggestion form
            document.getElementById('sugPlayer').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        
        container.appendChild(suggestionDiv);
    });
    
    const unknownCount = game.getUnknownCardsCount();
    const countDiv = document.createElement('div');
    countDiv.style.marginTop = '10px';
    countDiv.style.padding = '10px';
    countDiv.style.background = '#e7f3ff';
    countDiv.style.borderRadius = '5px';
    countDiv.innerHTML = `<strong>Unknown Cards Remaining: ${unknownCount}</strong>`;
    container.appendChild(countDiv);
});

function updateUI() {
    console.log('[updateUI] Called, isGameSetup:', isGameSetup);
    if (!isGameSetup) {
        console.log('[updateUI] Game not set up, returning early');
        return;
    }

    // Update "Your Cards" section
    const myCardsDiv = document.getElementById('myCards');
    const allCards = [...game.characters, ...game.rooms, ...game.weapons];
    console.log('[updateUI] Total cards:', allCards.length, 'My cards:', game.myCards);

    myCardsDiv.innerHTML = '';
    allCards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.textContent = card;

        // Check card status to determine if "You" has the card
        // This reflects when other players have cards (which means "You" don't have them)
        const cardStatus = game.getCardStatus(card);
        const youHasCard = cardStatus.has.includes('You');
        const youDoesntHaveCard = cardStatus.doesntHave.includes('You');
        
        // If any other player has the card, "You" definitely doesn't have it
        // (The game logic should mark "You" as doesn't have, but check this as a fallback)
        const otherPlayerHasCard = cardStatus.has.length > 0 && 
                                   cardStatus.has.some(player => player !== 'You');
        
        // Find which player has the card (if any)
        const playerWhoHasCard = cardStatus.has.find(player => player !== 'You');
        
        // If card status explicitly says "You" has it, show as has
        // If card status says "You" doesn't have it OR another player has it, show as doesn't-have
        // Otherwise, fall back to game.myCards
        let hasCard;
        if (youHasCard) {
            hasCard = true;
            console.log('[updateUI] Card', card, '- You have it');
        } else if (youDoesntHaveCard || otherPlayerHasCard) {
            hasCard = false;
            if (playerWhoHasCard) {
                console.log('[updateUI] Card', card, '- Player', playerWhoHasCard, 'has it');
            }
            // Also remove from myCards if it's there (sync with card status)
            if (game.myCards.includes(card)) {
                const index = game.myCards.indexOf(card);
                if (index > -1) {
                    console.log('[updateUI] Removing', card, 'from myCards (syncing with card status)');
                    game.myCards.splice(index, 1);
                }
            }
        } else {
            // Fall back to game.myCards if card status is unknown
            hasCard = game.myCards.includes(card);
            console.log('[updateUI] Card', card, '- Status unknown, using myCards:', hasCard);
        }

        if (hasCard) {
            cardDiv.classList.add('has');
        } else {
            cardDiv.classList.add('doesnt-have');
            
            // If another player has this card, apply their tick color
            if (playerWhoHasCard) {
                const playerTickColor = getPlayerTickColor(playerWhoHasCard);
                if (playerTickColor) {
                    cardDiv.style.setProperty('background', playerTickColor, 'important');
                    cardDiv.style.setProperty('color', getContrastColor(playerTickColor), 'important');
                    cardDiv.style.setProperty('border-color', playerTickColor, 'important');
                }
            }
        }

        cardDiv.addEventListener('click', () => {
            console.log('[myCards] Card clicked:', card, 'Currently in myCards:', game.myCards.includes(card));
            if (game.myCards.includes(card)) {
                console.log('[myCards] Removing card:', card);
                game.removeMyCard(card);
            } else {
                console.log('[myCards] Adding card:', card);
                game.addMyCard(card);
            }
            console.log('[myCards] Updated myCards:', game.myCards);
            updateUI();
        });

        myCardsDiv.appendChild(cardDiv);
    });

    // Update Card Status table
    const cardStatusDiv = document.getElementById('cardStatus');
    cardStatusDiv.innerHTML = '';

    const statuses = game.getAllCardStatuses();
    const allPlayersList = ['You', ...game.players];

    // Render the grid layout
    renderCardStatusGrid(cardStatusDiv, statuses, allPlayersList);
}

// Also add this helper function if it's missing
function loadUtilityButtonSettings() {
}

// Helper function to create click handler for player status cells
function createPlayerStatusClickHandler(player, name, status) {
    return () => {
        const hasCard = status.has.includes(player);
        const doesntHaveCard = status.doesntHave.includes(player);
        
        if (player === 'You') {
            // Special handling for "You"
            if (hasCard) {
                // Has -> Doesn't have
                game.removeMyCard(name);
                game.markCardDoesntHave('You', name, true);
            } else if (doesntHaveCard) {
                // Doesn't have -> Unknown (clear status)
                game.clearCardStatus('You', name, true);
            } else {
                // Unknown -> Has
                game.addMyCard(name);
            }
        } else {
            // For other players
            if (hasCard) {
                // Has -> Doesn't have
                game.markCardDoesntHave(player, name, true);
            } else if (doesntHaveCard) {
                // Doesn't have -> Unknown (clear status)
                game.clearCardStatus(player, name, true);
            } else {
                // Unknown -> Has
                game.markCardHas(player, name, true);
            }
        }
        updateUI();
    };
}

// Helper function to create player status cell
function createPlayerStatusCell(player, name, status, allPlayersList) {
    const playerCell = document.createElement('td');
    playerCell.className = 'player-status-cell';
    playerCell.style.cursor = 'pointer';
    
    // Determine current status
    const hasCard = status.has.includes(player);
    const doesntHaveCard = status.doesntHave.includes(player);
    const hasOneOf = status.hasOneOf && status.hasOneOf.some(entry => entry.player === player);
    
    // Apply player-specific colors for tick/X backgrounds
    const tickBgColor = getPlayerTickColor(player);
    const xBgColor = getPlayerXColor(player);
    
    if (hasCard) {
        playerCell.innerHTML = '✓';
        playerCell.className += ' has-status';
        playerCell.title = `${getPlayerDisplayName(player)} has ${name} (click to mark as doesn't have)`;
        if (tickBgColor) {
            playerCell.style.setProperty('background', tickBgColor, 'important');
            playerCell.style.setProperty('color', getContrastColor(tickBgColor), 'important');
        }
    } else if (doesntHaveCard) {
        playerCell.innerHTML = '✗';
        playerCell.className += ' doesnt-have-status';
        playerCell.title = `${getPlayerDisplayName(player)} doesn't have ${name} (click to clear/unknown)`;
        if (xBgColor) {
            playerCell.style.setProperty('background', xBgColor, 'important');
            playerCell.style.setProperty('color', getContrastColor(xBgColor), 'important');
        }
    } else if (hasOneOf) {
        const entry = status.hasOneOf.find(e => e.player === player);
        playerCell.innerHTML = '?';
        playerCell.className += ' has-one-of-status';
        playerCell.title = `${getPlayerDisplayName(player)} has one of: ${entry.cards.join(', ')} (click to mark as has)`;
    } else {
        // Show explicit '?' for unknown to avoid relying on pseudo-content
        playerCell.innerHTML = '?';
        playerCell.className += ' unknown-status';
        playerCell.title = `Unknown if ${getPlayerDisplayName(player)} has ${name} (click to mark as has)`;
    }
    
    playerCell.setAttribute('data-player', player);
    playerCell.addEventListener('click', createPlayerStatusClickHandler(player, name, status));
    
    return playerCell;
}

// Render card status in grid layout
function renderCardStatusGrid(cardStatusDiv, statuses, allPlayersList) {
    ['characters', 'rooms', 'weapons'].forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'status-category';
        
        // Create simple header
        const header = document.createElement('h3');
        header.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryDiv.appendChild(header);
        
        // Create grid table (works on both desktop and mobile)
        const gridTable = document.createElement('table');
        gridTable.className = 'card-status-grid';
        
        // Header row
        const headerRow = document.createElement('tr');
        const cardHeader = document.createElement('th');
        cardHeader.textContent = 'Card';
        cardHeader.className = 'card-name-header';
        headerRow.appendChild(cardHeader);
        
        allPlayersList.forEach(player => {
            const playerHeader = document.createElement('th');
            playerHeader.textContent = getPlayerDisplayName(player);
            playerHeader.className = 'player-header';
            playerHeader.setAttribute('data-player', player);
            // Apply player color
            const playerColor = getPlayerColor(player);
            if (playerColor) {
                playerHeader.style.background = playerColor;
                playerHeader.style.color = getContrastColor(playerColor);
            }
            headerRow.appendChild(playerHeader);
        });
        
        const envelopeHeader = document.createElement('th');
        envelopeHeader.textContent = 'Envelope';
        envelopeHeader.className = 'envelope-header';
        headerRow.appendChild(envelopeHeader);
        gridTable.appendChild(headerRow);
        
        // Data rows - one row per card
        statuses[category].forEach(({ name, status }) => {
            const row = document.createElement('tr');
            row.className = 'card-status-row';
            
            // Card name cell
            const cardCell = document.createElement('td');
            cardCell.className = 'card-name-cell';
            const cardNameDiv = document.createElement('div');
            cardNameDiv.className = 'card-name';
            cardNameDiv.textContent = name;
            
            // Add status indicator and apply player tick color if a player has this card
            if (status.envelope) {
                cardNameDiv.classList.add('envelope-card');
            } else if (status.has.length > 0) {
                cardNameDiv.classList.add('has-card');
                // Apply the tick color of the player who has this card
                const playerWhoHas = status.has[0]; // Get first player who has it
                const playerTickColor = getPlayerTickColor(playerWhoHas);
                if (playerTickColor) {
                    cardNameDiv.style.setProperty('background', playerTickColor, 'important');
                    cardNameDiv.style.setProperty('color', getContrastColor(playerTickColor), 'important');
                }
            } else if (status.hasOneOf && status.hasOneOf.length > 0) {
                cardNameDiv.classList.add('has-one-of-card');
            }
            
            cardCell.appendChild(cardNameDiv);
            row.appendChild(cardCell);
            
            // Player status cells
            allPlayersList.forEach(player => {
                const playerCell = document.createElement('td');
                playerCell.className = 'player-status-cell';
                playerCell.style.cursor = 'pointer';
                
                // Determine current status
                const hasCard = status.has.includes(player);
                const doesntHaveCard = status.doesntHave.includes(player);
                const hasOneOf = status.hasOneOf && status.hasOneOf.some(entry => entry.player === player);
                
                // Set initial display
                // Apply player-specific colors for tick/X backgrounds
                const tickBgColor = getPlayerTickColor(player);
                const xBgColor = getPlayerXColor(player);
                
                if (hasCard) {
                    playerCell.innerHTML = '✓';
                    playerCell.className += ' has-status';
                    playerCell.title = `${getPlayerDisplayName(player)} has ${name} (click to mark as doesn't have)`;
                    if (tickBgColor) {
                        playerCell.style.setProperty('background', tickBgColor, 'important');
                        playerCell.style.setProperty('color', getContrastColor(tickBgColor), 'important');
                    }
                } else if (doesntHaveCard) {
                    playerCell.innerHTML = '✗';
                    playerCell.className += ' doesnt-have-status';
                    playerCell.title = `${getPlayerDisplayName(player)} doesn't have ${name} (click to clear/unknown)`;
                    if (xBgColor) {
                        playerCell.style.setProperty('background', xBgColor, 'important');
                        playerCell.style.setProperty('color', getContrastColor(xBgColor), 'important');
                    }
                } else if (hasOneOf) {
                    const entry = status.hasOneOf.find(e => e.player === player);
                    playerCell.innerHTML = '?';
                    playerCell.className += ' has-one-of-status';
                    playerCell.title = `${getPlayerDisplayName(player)} has one of: ${entry.cards.join(', ')} (click to mark as has)`;
                } else {
                    // Show explicit '?' for unknown to avoid relying on pseudo-content
                    playerCell.innerHTML = '?';
                    playerCell.className += ' unknown-status';
                    playerCell.title = `Unknown if ${getPlayerDisplayName(player)} has ${name} (click to mark as has)`;
                }
                
                playerCell.setAttribute('data-player', player);
                
                // Add click handler to toggle status: Unknown -> Has -> Doesn't have -> Unknown
                playerCell.addEventListener('click', () => {
                    console.log('[cardStatus] Cell clicked - Player:', player, 'Card:', name, 'Current status - has:', hasCard, 'doesntHave:', doesntHaveCard);
                    if (player === 'You') {
                        // Special handling for "You"
                        if (hasCard) {
                            // Has -> Doesn't have
                            console.log('[cardStatus] You: Has -> Doesn\'t have');
                            // Mark as doesn't have FIRST (while "You" is still in "has" list for tracking)
                            // This allows markCardDoesntHave to detect wasMarkedAsHas and clear auto-set players
                            game.markCardDoesntHave('You', name, true);
                            // Then remove from myCards (this clears "You" status but tracking is already done)
                            game.removeMyCard(name);
                        } else if (doesntHaveCard) {
                            // Doesn't have -> Unknown (clear status)
                            console.log('[cardStatus] You: Doesn\'t have -> Unknown');
                            game.clearCardStatus('You', name, true);
                        } else {
                            // Unknown -> Has
                            console.log('[cardStatus] You: Unknown -> Has');
                            game.addMyCard(name);
                        }
                    } else {
                        // For other players
                        if (hasCard) {
                            // Has -> Doesn't have
                            console.log('[cardStatus]', player, ': Has -> Doesn\'t have');
                            game.markCardDoesntHave(player, name, true);
                        } else if (doesntHaveCard) {
                            // Doesn't have -> Unknown (clear status)
                            console.log('[cardStatus]', player, ': Doesn\'t have -> Unknown');
                            game.clearCardStatus(player, name, true);
                        } else {
                            // Unknown -> Has
                            console.log('[cardStatus]', player, ': Unknown -> Has');
                            game.markCardHas(player, name, true);
                        }
                    }
                    console.log('[cardStatus] Calling updateUI after status change');
                    updateUI();
                });
                
                row.appendChild(playerCell);
            });
            
            // Envelope cell
            const envelopeCell = document.createElement('td');
            envelopeCell.className = 'envelope-status-cell';
            envelopeCell.style.cursor = 'pointer';
            if (status.envelope) {
                envelopeCell.innerHTML = '📩';
                envelopeCell.className += ' in-envelope';
                envelopeCell.title = `${name} is in the envelope!`;
            } else {
                envelopeCell.innerHTML = '—';
                envelopeCell.title = `${name} is not in the envelope (click to mark as in envelope)`;
            }
            
            envelopeCell.addEventListener('click', () => {
                console.log('[envelopeCell] Clicked for card:', name, 'Current envelope status:', status.envelope);
                if (status.envelope) {
                    // Unmarking envelope - restore previous state
                    console.log('[envelopeCell] Unmarking envelope, restoring previous state');
                    game.cardStatus[name].envelope = false;
                    
                    // Restore previous state if it was saved
                    if (game.cardStatus[name].previousState) {
                        const prevState = game.cardStatus[name].previousState;
                        
                        // Restore "has" list - if someone else had it, they get it back
                        game.cardStatus[name].has = [...prevState.has];
                        
                        // Restore "doesntHave" list - but remove anyone who is in "has"
                        game.cardStatus[name].doesntHave = [...prevState.doesntHave];
                        prevState.has.forEach(player => {
                            const index = game.cardStatus[name].doesntHave.indexOf(player);
                            if (index > -1) {
                                game.cardStatus[name].doesntHave.splice(index, 1);
                            }
                        });
                        
                        // Restore "hasOneOf" status
                        game.cardStatus[name].hasOneOf = prevState.hasOneOf ? JSON.parse(JSON.stringify(prevState.hasOneOf)) : [];
                        
                        // Restore myCards if "You" was in the previous "has" list
                        if (prevState.has.includes('You')) {
                            if (!game.myCards.includes(name)) {
                                game.myCards.push(name);
                                console.log('[envelopeCell] Restored', name, 'to myCards');
                            }
                        } else {
                            // If "You" didn't have it before, make sure it's not in myCards
                            const myCardsIndex = game.myCards.indexOf(name);
                            if (myCardsIndex > -1) {
                                game.myCards.splice(myCardsIndex, 1);
                                console.log('[envelopeCell] Removed', name, 'from myCards (You didn\'t have it before)');
                            }
                        }
                        
                        // Simply restore the previous state - if someone had the card, they get it back
                        // Other players go back to their previous state (unknown if they weren't explicitly marked)
                        // Don't automatically mark others as "doesn't have" - just restore what was there before
                        
                        delete game.cardStatus[name].previousState;
                        console.log('[envelopeCell] Restored previous state:', prevState);
                    } else {
                        // If no previous state, clear everything
                        game.cardStatus[name].has = [];
                        game.cardStatus[name].doesntHave = [];
                        game.cardStatus[name].hasOneOf = [];
                    }
                } else {
                    // Marking as envelope - save current state and mark everyone as doesn't have
                    console.log('[envelopeCell] Marking as envelope, saving current state');
                    
                    // Save current state before marking as envelope
                    game.cardStatus[name].previousState = {
                        has: [...status.has],
                        doesntHave: [...status.doesntHave],
                        hasOneOf: status.hasOneOf ? JSON.parse(JSON.stringify(status.hasOneOf)) : []
                    };
                    console.log('[envelopeCell] Saved previous state:', game.cardStatus[name].previousState);
                    
                    // Mark as envelope and mark everyone as doesn't have
                    // This includes players who currently have it - they can't have it if it's in envelope
                    game.cardStatus[name].envelope = true;
                    game.cardStatus[name].has = [];
                    const allPlayers = ['You', ...game.players];
                    // Mark everyone as doesn't have (overwrites any "has" status)
                    game.cardStatus[name].doesntHave = [...allPlayers];
                    game.cardStatus[name].hasOneOf = [];
                    
                    // Also remove from myCards if "You" had it
                    if (status.has.includes('You') && game.myCards.includes(name)) {
                        const index = game.myCards.indexOf(name);
                        if (index > -1) {
                            game.myCards.splice(index, 1);
                            console.log('[envelopeCell] Removed', name, 'from myCards');
                        }
                    }
                    
                    console.log('[envelopeCell] Marked everyone as doesn\'t have:', allPlayers);
                }
                
                // Only call updateDeductions if we're marking as envelope (not restoring)
                // When restoring, we want to restore the exact previous state without triggering deductions
                const wasEnvelope = status.envelope;
                if (!wasEnvelope) {
                    // We're marking as envelope, so update deductions
                    game.updateDeductions();
                }
                // If we're restoring (wasEnvelope was true), skip updateDeductions to preserve restored state
                // This prevents automatic deductions from changing the restored state
                
                updateUI();
            });
            
            row.appendChild(envelopeCell);
            
            gridTable.appendChild(row);
        });
        
        // Append table directly to category div
        categoryDiv.appendChild(gridTable);
        cardStatusDiv.appendChild(categoryDiv);
    });
    
    // Update card count tracker
    const cardCountsDiv = document.getElementById('cardCounts');
    if (cardCountsDiv) {
        const cardCounts = game.getCardCounts();
        const allPlayersListForCounts = ['You', ...game.players];
        
        if (Object.keys(cardCounts).length === 0) {
            cardCountsDiv.innerHTML = '<p>Set up the game to see card counts.</p>';
        } else {
            cardCountsDiv.innerHTML = allPlayersListForCounts.map(player => {
                const count = cardCounts[player];
                if (!count) return '';
                const statusClass = count.difference === 0 ? 'count-correct' : 
                                   count.difference > 0 ? 'count-too-many' : 'count-too-few';
                const statusIcon = count.difference === 0 ? '✓' : 
                                  count.difference > 0 ? '⚠️' : '⚠️';
                const statusText = count.difference === 0 ? 'Correct' : 
                                  count.difference > 0 ? `Too many (+${count.difference})` : 
                                  `Too few (${count.difference})`;
                
                return `<div class="card-count-item ${statusClass}">
                    <div class="count-player">${getPlayerDisplayName(player)}</div>
                    <div class="count-numbers">
                        <span class="count-actual">${count.actual}</span>
                        <span class="count-separator">/</span>
                        <span class="count-expected">${count.expected}</span>
                    </div>
                    <div class="count-status">${statusIcon} ${statusText}</div>
                </div>`;
            }).join('');
        }
    }

    // Update probability calculator
    const probabilitiesDiv = document.getElementById('probabilities');
    if (probabilitiesDiv) {
        const probabilities = game.getCardProbabilities();
        
        if (Object.keys(probabilities).length === 0) {
            probabilitiesDiv.innerHTML = '<p>Set up the game to see probabilities.</p>';
        } else {
            // Group by category
            const byCategory = {
                character: [],
                room: [],
                weapon: []
            };
            
            Object.entries(probabilities).forEach(([card, data]) => {
                if (data && data.category) {
                    byCategory[data.category].push({ card, probability: data.probability });
                }
            });
            
            // Sort by probability (highest first)
            Object.keys(byCategory).forEach(category => {
                byCategory[category].sort((a, b) => b.probability - a.probability);
            });
            
            let probHTML = '';
            ['character', 'room', 'weapon'].forEach(category => {
                if (byCategory[category].length > 0) {
                    probHTML += `<div class="probability-category">
                        <h4>${category.charAt(0).toUpperCase() + category.slice(1)}s</h4>
                        <div class="probability-list">`;
                    
                    byCategory[category].forEach(({ card, probability }) => {
                        const probClass = probability === 100 ? 'prob-envelope' :
                                         probability === 0 ? 'prob-known' :
                                         probability > 50 ? 'prob-high' :
                                         probability > 25 ? 'prob-medium' : 'prob-low';
                        const probBar = probability > 0 && probability < 100 ? 
                            `<div class="probability-bar">
                                <div class="probability-fill" style="width: ${probability}%"></div>
                            </div>` : '';
                        
                        probHTML += `<div class="probability-item ${probClass}">
                            <div class="probability-card-name">${card}</div>
                            <div class="probability-value">${probability}%</div>
                            ${probBar}
                        </div>`;
                    });
                    
                    probHTML += `</div></div>`;
                }
            });
            
            probabilitiesDiv.innerHTML = probHTML || '<p>No probability data available.</p>';
        }
    }
    
    // Update deductions
    const deductionsDiv = document.getElementById('deductions');
    const deductions = game.getDeductions();
    
    if (deductions.length === 0) {
        deductionsDiv.innerHTML = '<p>No deductions yet. Mark cards and add suggestions to see deductions.</p>';
    } else {
        deductionsDiv.innerHTML = deductions.map(ded => {
            let icon = '✓';
            if (ded.type === 'envelope') icon = '📩';
            else if (ded.type === 'hasOneOf') icon = '❓';
            
            let message = ded.message;
            if (ded.player === 'You') {
                if (youDisplayName === 'You') {
                    // Default phrasing: "You have ..."
                    message = ded.message;
                } else {
                    // Custom name: use "has" instead of "have" and replace "You"
                    message = ded.message
                        .replace(/\bYou have\b/g, `${youDisplayName} has`)
                        .replace(/\bYou\b/g, youDisplayName);
                }
            }
            
            return `<div class="deduction-item">
                <strong>${icon}</strong> ${message}
            </div>`;
        }).join('');
    }
    
    // Update moves history
    const movesHistoryDiv = document.getElementById('movesHistory');
    const moves = game.getMoves();
    
    if (moves.length === 0) {
        movesHistoryDiv.innerHTML = '<p>No moves yet. Add suggestions to track moves.</p>';
    } else {
        movesHistoryDiv.innerHTML = moves.slice().reverse().map(move => {
            if (move.type === 'suggestion') {
                let moveText = `Move ${move.moveNumber}: <strong>${getPlayerDisplayName(move.player)}</strong> suggested `;
                moveText += `<strong>${move.character}</strong> in the <strong>${move.room}</strong> with the <strong>${move.weapon}</strong>`;
                if (move.shownToMe && move.cardShown) {
                    const showingPlayer = move.shownBy ? getPlayerDisplayName(move.shownBy) : 'Next player';
                    moveText += ` - <span style="color: #2196F3; font-weight: bold;">${showingPlayer} showed me <strong>${move.cardShown}</strong>!</span>`;
                } else if (move.shownBy) {
                    moveText += ` - <span style="color: #4CAF50; font-weight: bold;">${getPlayerDisplayName(move.shownBy)} showed a card (has one of: ${move.character}, ${move.room}, ${move.weapon})</span>`;
                } else {
                    moveText += ` - <span style="color: #dc3545;">No one showed a card</span>`;
                }
                return `<div class="move-item">${moveText}</div>`;
            } else if (move.type === 'markHas') {
                return `<div class="move-item">Move ${move.moveNumber}: <strong>${getPlayerDisplayName(move.player)}</strong> has <strong>${move.card}</strong></div>`;
            } else if (move.type === 'markDoesntHave') {
                return `<div class="move-item">Move ${move.moveNumber}: <strong>${getPlayerDisplayName(move.player)}</strong> doesn't have <strong>${move.card}</strong></div>`;
            } else if (move.type === 'clearStatus') {
                return `<div class="move-item">Move ${move.moveNumber}: <strong>${getPlayerDisplayName(move.player)}</strong>'s status for <strong>${move.card}</strong> cleared (reset to unknown)</div>`;
            }
            return `<div class="move-item">Move ${move.moveNumber}: ${JSON.stringify(move)}</div>`;
        }).join('');
    }
    
    // Reinitialize dropdowns in case players changed
    initializeDropdowns();
    
    // Apply player colors after UI update
    if (isGameSetup) {
        const allPlayers = ['You', ...game.players];
        allPlayers.forEach(player => {
            const playerColor = getPlayerColor(player);
            applyPlayerColor(player, playerColor);
        });
    }
}

// Show toast notification
function showToast(message, icon = '💾', duration = 2000) {
    const toast = document.getElementById('toastNotification');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');
    
    toastIcon.textContent = icon;
    toastMessage.textContent = message;
    
    // Remove fade-out class if it exists
    toast.classList.remove('fade-out');
    
    // Show toast
    toast.style.display = 'flex';
    
    // Start fade out slightly before hiding
    setTimeout(() => {
        toast.classList.add('fade-out');
    }, duration - 300); // Start fade 300ms before hiding
    
    // Hide after duration
    setTimeout(() => {
        toast.style.display = 'none';
        toast.classList.remove('fade-out');
    }, duration);
}

// Save game state to localStorage
function saveGameState() {
    console.log('[saveGameState] Saving game state');
    const gameState = {
        players: game.players,
        myCards: game.myCards,
        cardStatus: game.cardStatus,
        suggestions: game.suggestions,
        moves: game.moves,
        moveNumber: game.moveNumber,
        numPlayers: game.numPlayers,
        isGameSetup: isGameSetup,
        youDisplayName: youDisplayName
    };
    console.log('[saveGameState] Game state data:', {
        players: gameState.players.length,
        myCards: gameState.myCards.length,
        suggestions: gameState.suggestions.length,
        moves: gameState.moves.length,
        moveNumber: gameState.moveNumber
    });
    localStorage.setItem('clueGameState', JSON.stringify(gameState));
    console.log('[saveGameState] Game state saved to localStorage');
    showToast('Game state saved!', '💾');
}

// Load game state from localStorage
function loadGameState() {
    console.log('[loadGameState] Loading game state');
    const savedState = localStorage.getItem('clueGameState');
    if (!savedState) {
        console.log('[loadGameState] No saved game found');
        showToast('No saved game found.', '📂');
        return;
    }
    
    try {
        const gameState = JSON.parse(savedState);
        console.log('[loadGameState] Parsed game state:', {
            players: gameState.players?.length || 0,
            myCards: gameState.myCards?.length || 0,
            suggestions: gameState.suggestions?.length || 0,
            moves: gameState.moves?.length || 0,
            moveNumber: gameState.moveNumber || 0,
            isGameSetup: gameState.isGameSetup || false
        });
        game.players = gameState.players || [];
        game.myCards = gameState.myCards || [];
        game.cardStatus = gameState.cardStatus || {};
        game.suggestions = gameState.suggestions || [];
        game.moves = gameState.moves || [];
        game.moveNumber = gameState.moveNumber || 0;
        isGameSetup = gameState.isGameSetup || false;
        youDisplayName = gameState.youDisplayName || 'You';
        console.log('[loadGameState] Game state loaded, isGameSetup:', isGameSetup);
        
        if (isGameSetup) {
            document.getElementById('mainContent').style.display = 'grid';
        }
        
        updateUI();
        console.log('[loadGameState] UI updated');
        showToast('Game state loaded!', '📂');
    } catch (error) {
        console.error('[loadGameState] Error loading game state:', error);
        showToast('Error loading game state: ' + error.message, '⚠️', 3500);
    }
}

// Reset card status table (clear all card statuses)
function resetTable() {
    if (!isGameSetup) return;
    
    if (confirm('Are you sure you want to reset the card status table? This will clear all card markings but keep your cards and suggestions.')) {
        const allCards = [...game.characters, ...game.rooms, ...game.weapons];
        const allPlayers = ['You', ...game.players];
        
        // Clear all card statuses for all players
        allCards.forEach(card => {
            allPlayers.forEach(player => {
                game.clearCardStatus(player, card, false); // Don't track moves for bulk clear
            });
        });
        
        // Clear "myCards" as well since those are marked as "has"
        game.myCards = [];
        
        // Update deductions
        game.updateDeductions();
        
        // Update UI
        updateUI();
    }
}

// Reset game
function resetGame() {
    if (confirm('Are you sure you want to reset the game? This will clear all data.')) {
        game.players = [];
        game.myCards = [];
        game.cardStatus = {};
        game.suggestions = [];
        game.moves = [];
        game.moveNumber = 0;
        isGameSetup = false;
        
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('playerNames').innerHTML = '';
        document.getElementById('numPlayers').value = '3';
        
        localStorage.removeItem('clueGameState');
        updateUI();
    }
}

// Undo last move
function undoLastMove() {
    if (game.moves.length === 0) {
        alert('No moves to undo.');
        return;
    }
    
    if (confirm('Undo the last move? This will revert the game state.')) {
        // Remove the last move
        const lastMove = game.moves.pop();
        game.moveNumber = Math.max(0, game.moveNumber - 1);
        
        // Rebuild game state from remaining moves
        // This will properly restore all card statuses
        game.rebuildStateFromMoves();
        
        // Update UI to reflect the rebuilt state
        updateUI();
        alert('Last move undone.');
    }
}

// Add save/load/reset buttons to the UI
function addUtilityButtons() {
    const gameSetup = document.querySelector('.game-setup');
    if (!gameSetup) return;
    
    // Check if buttons already exist
    if (document.getElementById('saveGame')) return;
    
    const utilityDiv = document.createElement('div');
    utilityDiv.className = 'utility-buttons';
    utilityDiv.style.display = 'flex';
    utilityDiv.style.gap = '10px';
    utilityDiv.style.marginTop = '15px';
    utilityDiv.style.flexWrap = 'wrap';
    
    const saveBtn = document.createElement('button');
    saveBtn.id = 'saveGame';
    saveBtn.textContent = '💾 Save Game';
    saveBtn.className = 'utility-btn';
    saveBtn.addEventListener('click', saveGameState);
    
    const loadBtn = document.createElement('button');
    loadBtn.id = 'loadGame';
    loadBtn.textContent = '📂 Load Game';
    loadBtn.className = 'utility-btn';
    loadBtn.addEventListener('click', loadGameState);
    
    const resetBtn = document.createElement('button');
    resetBtn.id = 'resetGame';
    resetBtn.textContent = '🔄 Reset Game';
    resetBtn.className = 'utility-btn';
    resetBtn.addEventListener('click', resetGame);
    
    const undoBtn = document.createElement('button');
    undoBtn.id = 'undoMove';
    undoBtn.textContent = '↶ Undo Last Move';
    undoBtn.className = 'utility-btn';
    undoBtn.addEventListener('click', undoLastMove);
    
    utilityDiv.appendChild(saveBtn);
    utilityDiv.appendChild(loadBtn);
    utilityDiv.appendChild(undoBtn);
    utilityDiv.appendChild(resetBtn);
    
    gameSetup.appendChild(utilityDiv);
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('[Service Worker] Registered successfully:', registration.scope);
            })
            .catch((error) => {
                console.log('[Service Worker] Registration failed:', error);
            });
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DOMContentLoaded] Initializing application');
    initializeDropdowns();
    console.log('[DOMContentLoaded] Dropdowns initialized');
    addUtilityButtons();
    console.log('[DOMContentLoaded] Utility buttons added');
    
    // Load utility button settings after buttons are created
    setTimeout(() => {
        loadUtilityButtonSettings();
        console.log('[DOMContentLoaded] Utility button settings loaded');
    }, 100);
    
    // Automatically load saved game on startup if available
    const savedState = localStorage.getItem('clueGameState');
    console.log('[DOMContentLoaded] Checking for saved game state:', savedState ? 'Found' : 'Not found');
    if (savedState) {
        try {
            const gameState = JSON.parse(savedState);
            console.log('[DOMContentLoaded] Parsed game state:', gameState);
            game.players = gameState.players || [];
            game.myCards = gameState.myCards || [];
            game.cardStatus = gameState.cardStatus || {};
            game.suggestions = gameState.suggestions || [];
            game.moves = gameState.moves || [];
            game.moveNumber = gameState.moveNumber || 0;
            game.numPlayers = gameState.numPlayers || 0;
            isGameSetup = gameState.isGameSetup || false;
            console.log('[DOMContentLoaded] Game state loaded, isGameSetup:', isGameSetup, 'players:', game.players.length, 'myCards:', game.myCards.length);
            
            if (isGameSetup) {
                document.getElementById('mainContent').style.display = 'grid';
                updateUI();
            }
        } catch (error) {
            console.error('[DOMContentLoaded] Error loading saved game:', error);
            // If there's an error, just continue with a fresh game
        }
    }
    
    // Load saved theme color
    loadThemeColor();
    console.log('[DOMContentLoaded] Theme color loaded');
    
    // Load utility button colors after buttons are created
    setTimeout(() => {
        loadUtilityButtonColors();
        console.log('[DOMContentLoaded] Utility button colors loaded');
    }, 100);
    
    // Initialize settings modal
    initializeSettingsModal();
    console.log('[DOMContentLoaded] Settings modal initialized');
    
    // ——— Mobile Landscape Auto-Detect ———
    function updateOrientationClass() {
        if (window.matchMedia("(orientation: landscape)").matches) {
            document.body.classList.remove('portrait-lock');
        } else {
            document.body.classList.add('portrait-lock');
        }
    }

    // Run on load & rotate
    window.addEventListener('orientationchange', updateOrientationClass);
    window.addEventListener('resize', updateOrientationClass);
    updateOrientationClass(); // initial check
});

// Settings Modal Functionality
function loadThemeColor() {
    const savedColor = localStorage.getItem('themeColor');
    if (savedColor) {
        applyThemeColor(savedColor);
        const picker = document.getElementById('themeColorPicker');
        const text = document.getElementById('themeColorText');
        if (picker) picker.value = savedColor;
        if (text) text.value = savedColor;
    }
}

function loadUtilityButtonColors() {
    const saveColor = localStorage.getItem('saveGameColor') || '#667eea';
    const loadColor = localStorage.getItem('loadGameColor') || '#667eea';
    const undoColor = localStorage.getItem('undoMoveColor') || '#ffc107';
    const resetColor = localStorage.getItem('resetGameColor') || '#dc3545';
    
    applyUtilityButtonColor('saveGame', saveColor);
    applyUtilityButtonColor('loadGame', loadColor);
    applyUtilityButtonColor('undoMove', undoColor);
    applyUtilityButtonColor('resetGame', resetColor);
    
    // Update color pickers in settings
    const savePicker = document.getElementById('saveGameColor');
    const loadPicker = document.getElementById('loadGameColor');
    const undoPicker = document.getElementById('undoMoveColor');
    const resetPicker = document.getElementById('resetGameColor');
    const saveText = document.getElementById('saveGameColorText');
    const loadText = document.getElementById('loadGameColorText');
    const undoText = document.getElementById('undoMoveColorText');
    const resetText = document.getElementById('resetGameColorText');
    
    if (savePicker) savePicker.value = saveColor;
    if (loadPicker) loadPicker.value = loadColor;
    if (undoPicker) undoPicker.value = undoColor;
    if (resetPicker) resetPicker.value = resetColor;
    if (saveText) saveText.value = saveColor;
    if (loadText) loadText.value = loadColor;
    if (undoText) undoText.value = undoColor;
    if (resetText) resetText.value = resetColor;
}

function applyUtilityButtonColor(buttonId, color) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.style.background = color;
        // Adjust text color based on background brightness
        const textColor = getContrastColor(color);
        button.style.color = textColor;
    }
}

function getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark colors, black for light colors, grey for mid-tones
    if (luminance < 0.4) {
        return '#ffffff'; // White for dark backgrounds
    } else if (luminance > 0.6) {
        return '#000000'; // Black for light backgrounds
    } else {
        return '#333333'; // Dark grey for mid-tone backgrounds
    }
}

// Helper function to get display name for a player (returns custom name for "You")
function getPlayerDisplayName(player) {
    return player === 'You' ? youDisplayName : player;
}

function getPlayerColor(player) {
    const saved = localStorage.getItem(`playerColor_${player}`);
    if (saved) return saved;
    
    // Default colors for "You" - match "Your Cards" section
    if (player === 'You') {
        return '#d4edda'; // Light green, same as .card.has
    }
    
    // Default colors for other players
    const defaults = {
        'Player 1': '#e3f2fd',
        'Player 2': '#fce4ec',
        'Player 3': '#f3e5f5',
        'Player 4': '#e0f2f1',
        'Player 5': '#fff3e0'
    };
    return defaults[player] || '#f5f5f5';
}

function getPlayerTickColor(player) {
    const saved = localStorage.getItem(`playerTickColor_${player}`);
    if (saved) return saved;
    
    // Default: "You" uses same as "Your Cards" has color
    if (player === 'You') {
        return '#d4edda'; // Light green
    }
    return '#d4edda'; // Default green for all
}

function getPlayerXColor(player) {
    const saved = localStorage.getItem(`playerXColor_${player}`);
    if (saved) return saved;
    
    // Default: "You" uses same as "Your Cards" doesn't have color
    if (player === 'You') {
        return '#f8d7da'; // Light red/pink
    }
    return '#f8d7da'; // Default red for all
}

function populatePlayerColorSettings() {
    const playerColorsSection = document.getElementById('playerColorsSection');
    const playerColorsList = document.getElementById('playerColorsList');
    
    if (!playerColorsSection || !playerColorsList) return;
    
    // Only show if game is set up
    if (!isGameSetup || game.players.length === 0) {
        playerColorsSection.style.display = 'none';
        return;
    }
    
    playerColorsSection.style.display = 'block';
    playerColorsList.innerHTML = '';
    
    const allPlayers = ['You', ...game.players];
    
    allPlayers.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.style.border = '1px solid #ddd';
        playerDiv.style.borderRadius = '8px';
        playerDiv.style.padding = '15px';
        playerDiv.style.backgroundColor = '#f9f9f9';
        
        const playerName = document.createElement('h4');
        playerName.textContent = getPlayerDisplayName(player);
        playerName.style.margin = '0 0 12px 0';
        playerName.style.color = '#333';
        playerDiv.appendChild(playerName);
        
        // Player color
        const colorDiv = document.createElement('div');
        colorDiv.style.marginBottom = '12px';
        const colorLabel = document.createElement('label');
        colorLabel.textContent = 'Player Color:';
        colorLabel.style.display = 'block';
        colorLabel.style.marginBottom = '5px';
        colorLabel.style.fontSize = '0.9em';
        colorDiv.appendChild(colorLabel);
        
        const colorInputs = document.createElement('div');
        colorInputs.style.display = 'flex';
        colorInputs.style.alignItems = 'center';
        colorInputs.style.gap = '10px';
        
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.id = `playerColor_${player}`;
        colorPicker.value = getPlayerColor(player);
        colorPicker.style.width = '50px';
        colorPicker.style.height = '40px';
        colorPicker.style.border = '2px solid #ddd';
        colorPicker.style.borderRadius = '5px';
        colorPicker.style.cursor = 'pointer';
        
        const colorText = document.createElement('input');
        colorText.type = 'text';
        colorText.id = `playerColorText_${player}`;
        colorText.value = getPlayerColor(player);
        colorText.style.flex = '1';
        colorText.style.padding = '8px';
        colorText.style.border = '2px solid #ddd';
        colorText.style.borderRadius = '5px';
        colorText.style.fontFamily = 'monospace';
        colorText.style.fontSize = '12px';
        
        colorInputs.appendChild(colorPicker);
        colorInputs.appendChild(colorText);
        colorDiv.appendChild(colorInputs);
        
        // Sync color picker and text
        colorPicker.addEventListener('input', (e) => {
            colorText.value = e.target.value;
            applyPlayerColor(player, e.target.value);
        });
        
        colorText.addEventListener('input', (e) => {
            const color = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                colorPicker.value = color;
                applyPlayerColor(player, color);
            }
        });
        
        // Tick color
        const tickDiv = document.createElement('div');
        tickDiv.style.marginBottom = '12px';
        const tickLabel = document.createElement('label');
        tickLabel.textContent = '✓ (Has) Background:';
        tickLabel.style.display = 'block';
        tickLabel.style.marginBottom = '5px';
        tickLabel.style.fontSize = '0.9em';
        tickDiv.appendChild(tickLabel);
        
        const tickInputs = document.createElement('div');
        tickInputs.style.display = 'flex';
        tickInputs.style.alignItems = 'center';
        tickInputs.style.gap = '10px';
        
        const tickPicker = document.createElement('input');
        tickPicker.type = 'color';
        tickPicker.id = `playerTickColor_${player}`;
        tickPicker.value = getPlayerTickColor(player);
        tickPicker.style.width = '50px';
        tickPicker.style.height = '40px';
        tickPicker.style.border = '2px solid #ddd';
        tickPicker.style.borderRadius = '5px';
        tickPicker.style.cursor = 'pointer';
        
        const tickText = document.createElement('input');
        tickText.type = 'text';
        tickText.id = `playerTickColorText_${player}`;
        tickText.value = getPlayerTickColor(player);
        tickText.style.flex = '1';
        tickText.style.padding = '8px';
        tickText.style.border = '2px solid #ddd';
        tickText.style.borderRadius = '5px';
        tickText.style.fontFamily = 'monospace';
        tickText.style.fontSize = '12px';
        
        tickInputs.appendChild(tickPicker);
        tickInputs.appendChild(tickText);
        tickDiv.appendChild(tickInputs);
        
        // Sync tick color picker and text
        tickPicker.addEventListener('input', (e) => {
            tickText.value = e.target.value;
        });
        
        tickText.addEventListener('input', (e) => {
            const color = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                tickPicker.value = color;
            }
        });
        
        // X color
        const xDiv = document.createElement('div');
        const xLabel = document.createElement('label');
        xLabel.textContent = '✗ (Doesn\'t Have) Background:';
        xLabel.style.display = 'block';
        xLabel.style.marginBottom = '5px';
        xLabel.style.fontSize = '0.9em';
        xDiv.appendChild(xLabel);
        
        const xInputs = document.createElement('div');
        xInputs.style.display = 'flex';
        xInputs.style.alignItems = 'center';
        xInputs.style.gap = '10px';
        
        const xPicker = document.createElement('input');
        xPicker.type = 'color';
        xPicker.id = `playerXColor_${player}`;
        xPicker.value = getPlayerXColor(player);
        xPicker.style.width = '50px';
        xPicker.style.height = '40px';
        xPicker.style.border = '2px solid #ddd';
        xPicker.style.borderRadius = '5px';
        xPicker.style.cursor = 'pointer';
        
        const xText = document.createElement('input');
        xText.type = 'text';
        xText.id = `playerXColorText_${player}`;
        xText.value = getPlayerXColor(player);
        xText.style.flex = '1';
        xText.style.padding = '8px';
        xText.style.border = '2px solid #ddd';
        xText.style.borderRadius = '5px';
        xText.style.fontFamily = 'monospace';
        xText.style.fontSize = '12px';
        
        xInputs.appendChild(xPicker);
        xInputs.appendChild(xText);
        xDiv.appendChild(xInputs);
        
        // Sync X color picker and text
        xPicker.addEventListener('input', (e) => {
            xText.value = e.target.value;
        });
        
        xText.addEventListener('input', (e) => {
            const color = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                xPicker.value = color;
            }
        });
        
        playerDiv.appendChild(colorDiv);
        playerDiv.appendChild(tickDiv);
        playerDiv.appendChild(xDiv);
        playerColorsList.appendChild(playerDiv);
    });
}

function applyPlayerColor(player, color) {
    // Apply to all player headers
    const headers = document.querySelectorAll(`th[data-player="${player}"]`);
    headers.forEach(header => {
        header.style.background = color;
        header.style.color = getContrastColor(color);
    });
    
    // If "You", also apply to "Your Cards" section - use suggestions section background
    if (player === 'You') {
        const myCardsDiv = document.getElementById('myCards');
        if (myCardsDiv && myCardsDiv.parentElement) {
            const cardSection = myCardsDiv.parentElement;
            if (cardSection.classList.contains('card-section')) {
                // Match the suggestions section background instead of player color
                cardSection.style.backgroundColor = '#f8f9fa';
            }
        }
    }
}

function applyThemeColor(color) {
    document.documentElement.style.setProperty('--primary-color', color);
    // Calculate a darker shade for hover states
    const darkerColor = shadeColor(color, -20);
    document.documentElement.style.setProperty('--primary-color-dark', darkerColor);
    // Set automatic text contrast color
    const textColor = getContrastColor(color);
    document.documentElement.style.setProperty('--primary-text-color', textColor);
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function initializeSettingsModal() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const themeColorPicker = document.getElementById('themeColorPicker');
    const themeColorText = document.getElementById('themeColorText');
    const saveSettings = document.getElementById('saveSettings');
    const resetColor = document.getElementById('resetColor');
    
    if (!settingsBtn || !settingsModal) return;
    
    // Open settings modal
    // Reset table button
    const resetTableBtn = document.getElementById('resetTableBtn');
    if (resetTableBtn) {
        resetTableBtn.addEventListener('click', resetTable);
    }
    
    settingsBtn.addEventListener('click', () => {
        populatePlayerColorSettings();
        settingsModal.style.display = 'flex';
    });
    
    // Close settings modal
    if (closeSettings) {
        closeSettings.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    
    // Sync color picker and text input
    if (themeColorPicker && themeColorText) {
        themeColorPicker.addEventListener('input', (e) => {
            themeColorText.value = e.target.value;
            applyThemeColor(e.target.value);
        });
        
        themeColorText.addEventListener('input', (e) => {
            const color = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                themeColorPicker.value = color;
                applyThemeColor(color);
            }
        });
        
        themeColorText.addEventListener('change', (e) => {
            const color = e.target.value;
            if (!/^#[0-9A-F]{6}$/i.test(color)) {
                // Reset to current picker value if invalid
                e.target.value = themeColorPicker.value;
            }
        });
    }
    
    // Save settings
    if (saveSettings) {
        saveSettings.addEventListener('click', () => {
            // Save theme color
            const color = themeColorPicker.value;
            localStorage.setItem('themeColor', color);
            applyThemeColor(color);
            
            // Save utility button colors
            const saveColor = document.getElementById('saveGameColor').value;
            const loadColor = document.getElementById('loadGameColor').value;
            const undoColor = document.getElementById('undoMoveColor').value;
            const resetColor = document.getElementById('resetGameColor').value;
            
            localStorage.setItem('saveGameColor', saveColor);
            localStorage.setItem('loadGameColor', loadColor);
            localStorage.setItem('undoMoveColor', undoColor);
            localStorage.setItem('resetGameColor', resetColor);
            
            // Apply button colors
            applyUtilityButtonColor('saveGame', saveColor);
            applyUtilityButtonColor('loadGame', loadColor);
            applyUtilityButtonColor('undoMove', undoColor);
            applyUtilityButtonColor('resetGame', resetColor);
            
            // Save player colors
            if (isGameSetup) {
                const allPlayers = ['You', ...game.players];
                allPlayers.forEach(player => {
                    const playerColor = document.getElementById(`playerColor_${player}`);
                    const tickColor = document.getElementById(`playerTickColor_${player}`);
                    const xColor = document.getElementById(`playerXColor_${player}`);
                    
                    if (playerColor) {
                        localStorage.setItem(`playerColor_${player}`, playerColor.value);
                        applyPlayerColor(player, playerColor.value);
                    }
                    if (tickColor) {
                        localStorage.setItem(`playerTickColor_${player}`, tickColor.value);
                    }
                    if (xColor) {
                        localStorage.setItem(`playerXColor_${player}`, xColor.value);
                    }
                });
            }
            
            // Update UI to apply all color changes
            updateUI();
            
            settingsModal.style.display = 'none';
            alert('Settings saved!');
        });
    }
    
    // Reset to default color
    if (resetColor) {
        resetColor.addEventListener('click', () => {
            const defaultColor = '#667eea';
            themeColorPicker.value = defaultColor;
            themeColorText.value = defaultColor;
            applyThemeColor(defaultColor);
            localStorage.setItem('themeColor', defaultColor);
            
            // Reset utility button colors to defaults
            const defaultSave = '#667eea';
            const defaultLoad = '#667eea';
            const defaultUndo = '#ffc107';
            const defaultReset = '#dc3545';
            
            document.getElementById('saveGameColor').value = defaultSave;
            document.getElementById('saveGameColorText').value = defaultSave;
            document.getElementById('loadGameColor').value = defaultLoad;
            document.getElementById('loadGameColorText').value = defaultLoad;
            document.getElementById('undoMoveColor').value = defaultUndo;
            document.getElementById('undoMoveColorText').value = defaultUndo;
            document.getElementById('resetGameColor').value = defaultReset;
            document.getElementById('resetGameColorText').value = defaultReset;
            
            localStorage.setItem('saveGameColor', defaultSave);
            localStorage.setItem('loadGameColor', defaultLoad);
            localStorage.setItem('undoMoveColor', defaultUndo);
            localStorage.setItem('resetGameColor', defaultReset);
            
            // Apply default colors
            applyUtilityButtonColor('saveGame', defaultSave);
            applyUtilityButtonColor('loadGame', defaultLoad);
            applyUtilityButtonColor('undoMove', defaultUndo);
            applyUtilityButtonColor('resetGame', defaultReset);
            
            // Reset player colors if game is set up
            if (isGameSetup) {
                const allPlayers = ['You', ...game.players];
                allPlayers.forEach(player => {
                    // Reset to defaults
                    const defaultPlayerColor = player === 'You' ? '#d4edda' : '#f5f5f5';
                    const defaultTickColor = '#d4edda';
                    const defaultXColor = '#f8d7da';
                    
                    const playerColorEl = document.getElementById(`playerColor_${player}`);
                    const tickColorEl = document.getElementById(`playerTickColor_${player}`);
                    const xColorEl = document.getElementById(`playerXColor_${player}`);
                    
                    if (playerColorEl) {
                        playerColorEl.value = defaultPlayerColor;
                        document.getElementById(`playerColorText_${player}`).value = defaultPlayerColor;
                        localStorage.setItem(`playerColor_${player}`, defaultPlayerColor);
                        applyPlayerColor(player, defaultPlayerColor);
                    }
                    if (tickColorEl) {
                        tickColorEl.value = defaultTickColor;
                        document.getElementById(`playerTickColorText_${player}`).value = defaultTickColor;
                        localStorage.setItem(`playerTickColor_${player}`, defaultTickColor);
                    }
                    if (xColorEl) {
                        xColorEl.value = defaultXColor;
                        document.getElementById(`playerXColorText_${player}`).value = defaultXColor;
                        localStorage.setItem(`playerXColor_${player}`, defaultXColor);
                    }
                });
                updateUI();
            }
        });
    }
    
    // Sync utility button color pickers with text inputs
    const utilityButtons = [
        { picker: 'saveGameColor', text: 'saveGameColorText' },
        { picker: 'loadGameColor', text: 'loadGameColorText' },
        { picker: 'undoMoveColor', text: 'undoMoveColorText' },
        { picker: 'resetGameColor', text: 'resetGameColorText' }
    ];
    
    utilityButtons.forEach(({ picker, text }) => {
        const pickerEl = document.getElementById(picker);
        const textEl = document.getElementById(text);
        const buttonId = picker.replace('Color', '');
        
        if (pickerEl && textEl) {
            pickerEl.addEventListener('input', (e) => {
                textEl.value = e.target.value;
                applyUtilityButtonColor(buttonId, e.target.value);
            });
            
            textEl.addEventListener('input', (e) => {
                const color = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(color)) {
                    pickerEl.value = color;
                    applyUtilityButtonColor(buttonId, color);
                }
            });
            
            textEl.addEventListener('change', (e) => {
                const color = e.target.value;
                if (!/^#[0-9A-F]{6}$/i.test(color)) {
                    e.target.value = pickerEl.value;
                }
            });
        }
    });
}