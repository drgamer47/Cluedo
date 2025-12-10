// Clue/Cluedo Game Logic

class ClueGame {
    constructor() {
        this.characters = [
            'Miss Scarlett', 'Colonel Mustard', 'Mrs. Orchid',
            'Mr. Green', 'Mrs. Peacock', 'Professor Plum'
        ];
        
        this.rooms = [
            'Kitchen', 'Ballroom', 'Conservatory',
            'Dining Room', 'Billiard Room', 'Library',
            'Lounge', 'Hall', 'Study'
        ];
        
        this.weapons = [
            'Candlestick', 'Dagger', 'Lead Pipe',
            'Revolver', 'Rope', 'Wrench'
        ];
        
        this.players = [];
        this.myCards = [];
        this.cardStatus = {};
        this.suggestions = [];
        this.moves = [];
        this.currentPlayer = null;
        this.moveNumber = 0;
        this.numPlayers = 0;
    }

    setupGame(numPlayers, playerNames) {
        // playerNames should have "You" first, then other players in order (each to the left)
        // Filter out "You" from the players array (You is handled separately)
        // numPlayers includes "You", so we exclude "You" from this.players
        this.players = playerNames.filter(name => name !== 'You');
        this.numPlayers = numPlayers; // Store for card count calculations
        
        if (this.players.length > 0) {
            this.currentPlayer = this.players[0];
        }
        
        // Initialize card status
        const allCards = [...this.characters, ...this.rooms, ...this.weapons];
        allCards.forEach(card => {
            this.cardStatus[card] = {
                has: [],
                doesntHave: [],
                hasOneOf: [], // [{player, cards: [card1, card2, card3]}]
                envelope: false
            };
        });
        
        this.suggestions = [];
        this.moves = [];
        this.moveNumber = 0;
    }

    addMyCard(card) {
        if (!this.myCards.includes(card)) {
            this.myCards.push(card);
            // markCardHas already marks all other players as "doesn't have" and tracks them
            // No need to call markCardDoesntHave separately - that would interfere with tracking
            this.markCardHas('You', card);
            this.updateYouCardStatuses();
        }
    }

    removeMyCard(card) {
        const index = this.myCards.indexOf(card);
        if (index > -1) {
            this.myCards.splice(index, 1);
            // Don't clear other players' statuses here - let markCardDoesntHave handle it
            // with proper tracking of which players were auto-set vs manually set
            // Just clear "You" status - the markCardDoesntHave call will handle others
            this.clearCardStatus('You', card, true);
            this.updateYouCardStatuses();
        }
    }

    updateYouCardStatuses() {
        const allCards = [...this.characters, ...this.rooms, ...this.weapons];
        allCards.forEach(card => {
            if (!this.cardStatus[card]) {
                this.cardStatus[card] = { has: [], doesntHave: [], hasOneOf: [], envelope: false };
            }
            if (this.myCards.includes(card)) {
                this.markCardHas('You', card, false);
            } else {
                this.markCardDoesntHave('You', card, false);
            }
        });
        this.updateDeductions();
    }

    markCardHas(player, card, trackMove = false) {
        if (!this.cardStatus[card]) {
            this.cardStatus[card] = { has: [], doesntHave: [], hasOneOf: [], envelope: false };
        }
        
        if (!this.cardStatus[card].has.includes(player)) {
            this.cardStatus[card].has.push(player);
            
            // Track move only if explicitly requested (user action, not automatic deduction)
            if (trackMove) {
                this.addMove('markHas', { player, card });
            }
        }
        
        // Remove from doesn't have if present
        const doesntHaveIndex = this.cardStatus[card].doesntHave.indexOf(player);
        if (doesntHaveIndex > -1) {
            this.cardStatus[card].doesntHave.splice(doesntHaveIndex, 1);
        }
        
        // If a player has it, mark all other players as not having it
        // Track which players were automatically set (for later cleanup if needed)
        const allPlayersList = [...this.players, 'You'];
        const autoSetDoesntHave = [];
        
        // Track which player caused each "doesn't have" status
        // This allows us to only clear players that were set by THIS player, not by other players
        if (!this.cardStatus[card].doesntHaveSource) {
            this.cardStatus[card].doesntHaveSource = {}; // { player: sourcePlayer }
        }
        
        allPlayersList.forEach(otherPlayer => {
            if (otherPlayer !== player) {
                // Remove from has if present
                const otherHasIndex = this.cardStatus[card].has.indexOf(otherPlayer);
                if (otherHasIndex > -1) {
                    this.cardStatus[card].has.splice(otherHasIndex, 1);
                }
                
                // Track if this player was already in "doesn't have" before we mark them
                const wasAlreadyDoesntHave = this.cardStatus[card].doesntHave.includes(otherPlayer);
                
                // Add to doesn't have if not already there
                if (!wasAlreadyDoesntHave) {
                    this.cardStatus[card].doesntHave.push(otherPlayer);
                    // Track that THIS player being "has" caused otherPlayer to be "doesn't have"
                    this.cardStatus[card].doesntHaveSource[otherPlayer] = player;
                    autoSetDoesntHave.push(otherPlayer);
                } else {
                    // Player was already "doesn't have" - check if they were set by another player being "has"
                    // If so, update the source to this player (since this player now has it)
                    // If they were manually set (no source), don't change the source
                    if (this.cardStatus[card].doesntHaveSource[otherPlayer]) {
                        // Update source to this player (they were auto-set by another player, now by this one)
                        this.cardStatus[card].doesntHaveSource[otherPlayer] = player;
                        autoSetDoesntHave.push(otherPlayer);
                    }
                    // If no source exists, it means they were manually set - don't track or change
                }
            }
        });
        
        // Store which players were automatically set as "doesn't have" by this markCardHas call
        // This allows us to only clear those when unmarking, not manually set ones
        if (!this.cardStatus[card].autoSetDoesntHave) {
            this.cardStatus[card].autoSetDoesntHave = [];
        }
        // Store a reference to the player who has it, and which players they auto-set
        this.cardStatus[card].autoSetDoesntHave[player] = autoSetDoesntHave;
        
        // If a player has it, it can't be in the envelope
        this.cardStatus[card].envelope = false;
        
        this.updateDeductions();
    }

    markCardDoesntHave(player, card, trackMove = false) {
        if (!this.cardStatus[card]) {
            this.cardStatus[card] = { has: [], doesntHave: [], hasOneOf: [], envelope: false };
        }
        
        if (!this.cardStatus[card].doesntHave.includes(player)) {
            this.cardStatus[card].doesntHave.push(player);
            
            // Track move only if explicitly requested (user action, not automatic deduction)
            if (trackMove) {
                this.addMove('markDoesntHave', { player, card });
                
                // Track that this was manually set (not auto-set by another player being "has")
                // This prevents it from being cleared when other players are unmarked
                if (!this.cardStatus[card].doesntHaveSource) {
                    this.cardStatus[card].doesntHaveSource = {};
                }
                // Mark as manually set (use null or special marker to indicate manual)
                // We'll use null to indicate manual, or a player name to indicate auto-set
                // Actually, let's not set it at all if it's manual - that way we can distinguish
                // If doesnHaveSource[player] exists, it was auto-set by that player
                // If it doesn't exist, it was manually set
            }
        }
        
        // Check if this player was previously marked as "has" (before we remove them)
        const wasMarkedAsHas = this.cardStatus[card].has.includes(player);
        
        // Remove from has if present
        const hasIndex = this.cardStatus[card].has.indexOf(player);
        if (hasIndex > -1) {
            this.cardStatus[card].has.splice(hasIndex, 1);
        }
        
        // If this was a manual action (trackMove = true) and the player was previously marked as "has",
        // clear the "doesn't have" status of other players that were automatically set by markCardHas
        // This prevents cascading "doesn't have" statuses from manual clicks
        // BUT: Only clear players that were automatically set by THIS player being "has", not manually set ones
        if (trackMove && wasMarkedAsHas) {
            // Get the list of players that should be cleared when this player is unmarked
            const autoSetList = this.cardStatus[card].autoSetDoesntHave && 
                               this.cardStatus[card].autoSetDoesntHave[player] || [];
            
            // Clear players that were set by THIS player being "has"
            // Use the source tracking to only clear players that were set by this player
            // BUT: Only clear if no other player is currently "has" (otherwise they should stay "doesn't have")
            autoSetList.forEach(otherPlayer => {
                // Only clear if this player was the source of the "doesn't have" status
                if (this.cardStatus[card].doesntHaveSource && 
                    this.cardStatus[card].doesntHaveSource[otherPlayer] === player) {
                    // Check if any other player is currently "has" - if so, don't clear
                    // (because that other player would have set them as "doesn't have")
                    const hasAnyOtherPlayer = this.cardStatus[card].has.length > 0;
                    
                    if (!hasAnyOtherPlayer) {
                        // No one else has it, so clear this player's "doesn't have" status
                        const doesntHaveIndex = this.cardStatus[card].doesntHave.indexOf(otherPlayer);
                        if (doesntHaveIndex > -1) {
                            this.cardStatus[card].doesntHave.splice(doesntHaveIndex, 1);
                        }
                        // Remove the source tracking
                        delete this.cardStatus[card].doesntHaveSource[otherPlayer];
                    } else {
                        // Another player has it, so this player should stay "doesn't have"
                        // But we need to update the source to that other player
                        const otherPlayerWhoHas = this.cardStatus[card].has[0];
                        this.cardStatus[card].doesntHaveSource[otherPlayer] = otherPlayerWhoHas;
                    }
                }
            });
            
            // Clean up the tracking data for this player
            if (this.cardStatus[card].autoSetDoesntHave) {
                delete this.cardStatus[card].autoSetDoesntHave[player];
            }
        }
        
        this.updateDeductions();
    }

    clearCardStatus(player, card, trackMove = false) {
        // Clear both has and doesn't have status (set back to unknown)
        if (!this.cardStatus[card]) {
            this.cardStatus[card] = { has: [], doesntHave: [], hasOneOf: [], envelope: false };
        }
        
        // Remove from has
        const hasIndex = this.cardStatus[card].has.indexOf(player);
        if (hasIndex > -1) {
            this.cardStatus[card].has.splice(hasIndex, 1);
        }
        
        // Remove from doesn't have
        const doesntHaveIndex = this.cardStatus[card].doesntHave.indexOf(player);
        if (doesntHaveIndex > -1) {
            this.cardStatus[card].doesntHave.splice(doesntHaveIndex, 1);
        }
        
        // Track move if requested
        if (trackMove) {
            this.addMove('clearStatus', { player, card });
        }
        
        this.updateDeductions();
    }

    addSuggestion(player, character, room, weapon, shownBy, shownToMe, cardShown) {
        this.moveNumber++;
        const suggestion = {
            moveNumber: this.moveNumber,
            player,
            character,
            room,
            weapon,
            shownBy: shownBy || null,
            shownToMe: shownToMe || false,
            cardShown: cardShown || null,
            timestamp: Date.now()
        };
        
        this.suggestions.push(suggestion);
        
        // Add to moves history
        const move = {
            moveNumber: this.moveNumber,
            type: 'suggestion',
            player: player,
            character: character,
            room: room,
            weapon: weapon,
            shownBy: shownBy || null,
            shownToMe: shownToMe || false,
            cardShown: cardShown || null,
            timestamp: Date.now()
        };
        this.moves.push(move);
        
        // Process suggestion for deductions
        this.processSuggestion(suggestion);
        this.updateDeductions();
        
        return move;
    }

    processSuggestion(suggestion) {
        const { player, character, room, weapon, shownBy, shownToMe, cardShown } = suggestion;
        const suggestionCards = [character, room, weapon];
        
        if (shownToMe && cardShown) {
            // If a card was shown to me, I know exactly which card it is
            // Mark that the player who showed it has this specific card
            // shownBy should be set when shownToMe is true, but if not, we can't determine who showed it
            if (!shownBy) {
                console.warn('shownToMe is true but shownBy is not set');
                return; // Can't process without knowing who showed the card
            }
            const showingPlayer = shownBy;
            this.markCardHas(showingPlayer, cardShown);
            
            // Only mark the suggester as "doesn't have" if "You" made the suggestion
            // (because "You" saw the card, so "You" don't have any of them)
            // If another player made the suggestion, we can't infer they don't have the cards
            if (player === 'You') {
                // The suggesting player ("You") doesn't have any of these cards
                this.markCardDoesntHave(player, character);
                this.markCardDoesntHave(player, room);
                this.markCardDoesntHave(player, weapon);
            }
            
            // Players between suggester and shower (in turn order) don't have any of these
            // Turn order: You, Player 1, Player 2, etc. (each to the left)
            const allPlayersInOrder = ['You', ...this.players];
            const playerIndex = allPlayersInOrder.indexOf(player);
            const showingPlayerIndex = allPlayersInOrder.indexOf(showingPlayer);
            
            if (playerIndex !== -1 && showingPlayerIndex !== -1 && playerIndex !== showingPlayerIndex) {
                // Players in between don't have any of these cards
                for (let i = (playerIndex + 1) % allPlayersInOrder.length; 
                     i !== showingPlayerIndex; 
                     i = (i + 1) % allPlayersInOrder.length) {
                    const p = allPlayersInOrder[i];
                    // Don't mark the showing player as doesn't have (they have one!)
                    // But do mark "You" if "You" is between the suggester and shower
                    if (p !== showingPlayer) {
                        this.markCardDoesntHave(p, character);
                        this.markCardDoesntHave(p, room);
                        this.markCardDoesntHave(p, weapon);
                    }
                }
            }
        } else if (shownBy) {
            // If someone showed a card to someone else, that player has at least one of these cards
            // If we know which specific card was shown, mark that card as "has"
            // We DON'T mark the other cards as "doesn't have" because they might have more than one
            // Otherwise, mark as "has one of" the three cards
            if (cardShown && suggestionCards.includes(cardShown)) {
                // We know the specific card that was shown
                this.markCardHas(shownBy, cardShown);
                // Don't mark the other cards - we don't know if they have them or not
            } else {
                // We only know they have one of the three cards
                this.markPlayerHasOneOf(shownBy, suggestionCards);
            }
            
            // We DON'T mark the suggester as "doesn't have" because:
            // - They might have one of the cards (players can suggest cards they have)
            // - We only know the showing player has one of them
            // - We can't infer anything about the suggester's cards from this
            
            // Players between suggester and shower (in turn order) don't have any of these
            // Turn order: You, Player 1, Player 2, etc. (each to the left)
            const allPlayersInOrder = ['You', ...this.players];
            const playerIndex = allPlayersInOrder.indexOf(player);
            const shownByIndex = allPlayersInOrder.indexOf(shownBy);
            
            if (playerIndex !== -1 && shownByIndex !== -1 && playerIndex !== shownByIndex) {
                // Players between suggester and shower (in turn order) don't have any of these cards
                // Example: If "You" suggests and Player 2 shows, then Player 1 (between them) doesn't have any
                // Loop through players from the one after the suggester up to (but not including) the shower
                for (let i = (playerIndex + 1) % allPlayersInOrder.length; 
                     i !== shownByIndex; 
                     i = (i + 1) % allPlayersInOrder.length) {
                    const p = allPlayersInOrder[i];
                    // Don't mark the showing player as doesn't have (they have one!)
                    // But do mark all other players between the suggester and shower
                    if (p !== shownBy) {
                        this.markCardDoesntHave(p, character);
                        this.markCardDoesntHave(p, room);
                        this.markCardDoesntHave(p, weapon);
                    }
                }
            }
        } else {
            // If no one showed a card, all OTHER players don't have any of these
            // But we DON'T mark the suggester as "doesn't have" because:
            // - Players can suggest cards they have
            // - Just because no one showed a card doesn't mean the suggester doesn't have them
            const allPlayersList = ['You', ...this.players];
            allPlayersList.forEach(p => {
                // Mark all players EXCEPT the suggester as "doesn't have"
                if (p !== player) {
                    this.markCardDoesntHave(p, character);
                    this.markCardDoesntHave(p, room);
                    this.markCardDoesntHave(p, weapon);
                }
            });
            
            // Special case: If "You" made the suggestion and no one showed a card,
            // and "You" doesn't have any of these cards, mark them as in the envelope
            if (player === 'You') {
                const suggestionCards = [character, room, weapon];
                suggestionCards.forEach(card => {
                    if (!this.myCards.includes(card)) {
                        // "You" doesn't have this card, and no one showed it
                        // Since all other players are marked as "doesn't have", it must be in the envelope
                        if (!this.cardStatus[card]) {
                            this.cardStatus[card] = { has: [], doesntHave: [], hasOneOf: [], envelope: false };
                        }
                        // Mark "You" as doesn't have (for envelope detection)
                        if (!this.cardStatus[card].doesntHave.includes('You')) {
                            this.cardStatus[card].doesntHave.push('You');
                        }
                        // Mark as envelope (all players including "You" don't have it)
                        this.cardStatus[card].envelope = true;
                        this.cardStatus[card].has = [];
                    }
                });
            }
        }
    }
    
    markPlayerHasOneOf(player, cards) {
        // Mark that a player has one of the given cards
        // First, remove this player from "doesn't have" for all these cards
        // (since they have one of them, they can't be marked as doesn't have any)
        cards.forEach(card => {
            if (this.cardStatus[card]) {
                const doesntHaveIndex = this.cardStatus[card].doesntHave.indexOf(player);
                if (doesntHaveIndex > -1) {
                    this.cardStatus[card].doesntHave.splice(doesntHaveIndex, 1);
                }
            }
        });
        
        // Now mark that they have one of these cards
        cards.forEach(card => {
            if (!this.cardStatus[card]) {
                this.cardStatus[card] = {
                    has: [],
                    doesntHave: [],
                    hasOneOf: [],
                    envelope: false
                };
            }
            
            // Check if we already have a "hasOneOf" entry for this player with these cards
            const existingEntry = this.cardStatus[card].hasOneOf.find(
                entry => entry.player === player
            );
            
            if (existingEntry) {
                // Merge the cards
                cards.forEach(c => {
                    if (!existingEntry.cards.includes(c)) {
                        existingEntry.cards.push(c);
                    }
                });
            } else {
                // Create new entry for each card
                cards.forEach(c => {
                    if (!this.cardStatus[c]) {
                        this.cardStatus[c] = {
                            has: [],
                            doesntHave: [],
                            hasOneOf: [],
                            envelope: false
                        };
                    }
                    this.cardStatus[c].hasOneOf.push({
                        player: player,
                        cards: [...cards]
                    });
                });
            }
        });
    }

    updateDeductions() {
        const allCards = [...this.characters, ...this.rooms, ...this.weapons];
        const totalPlayers = this.players.length + 1; // +1 for "You"
        
        allCards.forEach(card => {
            const status = this.cardStatus[card];
            if (!status) return;
            
            // Skip if already in envelope
            if (status.envelope) return;
            
            // Deduction 1: If one player has it, others don't (already handled in markCardHas)
            
            // Deduction 2: Process "hasOneOf" entries - if a player has one of [A, B, C] 
            // and we know they don't have A and B, they must have C
            status.hasOneOf.forEach(entry => {
                const { player, cards } = entry;
                const cardsPlayerDoesntHave = cards.filter(c => 
                    this.cardStatus[c] && this.cardStatus[c].doesntHave.includes(player)
                );
                
                // If player doesn't have all but one of the cards, they must have the remaining one
                if (cardsPlayerDoesntHave.length === cards.length - 1) {
                    const remainingCard = cards.find(c => !cardsPlayerDoesntHave.includes(c));
                    if (remainingCard && !this.cardStatus[remainingCard].has.includes(player)) {
                        this.markCardHas(player, remainingCard);
                    }
                }
            });
            
            // Deduction 3: If all players don't have it, it's in the envelope
            const allOtherPlayersDontHave = this.players.every(player => 
                status.doesntHave.includes(player)
            );
            
            // Check if I don't have it
            // If "You" is explicitly marked as doesn't have, or if I have some cards but this isn't one of them
            const iDontHave = status.doesntHave.includes('You') || 
                             (this.myCards.length > 0 && !this.myCards.includes(card));
            
            // Check if there are any suggestions involving this card (for evidence-based deductions)
            const hasSuggestionEvidence = this.suggestions.some(sug => 
                sug.character === card || sug.room === card || sug.weapon === card
            );
            
            // If all players (including me) don't have it, it must be in the envelope
            // Only auto-mark if we have suggestion evidence
            if (allOtherPlayersDontHave && iDontHave && status.has.length === 0 && hasSuggestionEvidence) {
                status.envelope = true;
                // Clear any conflicting data
                status.has = [];
            }
            
            // Deduction 4: If we know all players except one don't have it, that one must have it
            // BUT: Only auto-deduce if we have suggestion evidence, not just manual clicks
            // This prevents the cascade where clicking one player triggers auto-marking others
            // EXCEPTION: Don't mark the suggester as "has" if no one showed a card for this card
            // (in that case, the cards are more likely in the envelope)
            if (!status.envelope && status.has.length === 0 && hasSuggestionEvidence) {
                const playersWithoutCard = status.doesntHave.length;
                
                // If all but one player doesn't have it, the remaining one must have it
                if (playersWithoutCard === totalPlayers - 1) {
                    // Find the player who doesn't have "doesn't have" marked
                    const allPlayersList = [...this.players, 'You'];
                    const playerWhoHas = allPlayersList.find(player => 
                        !status.doesntHave.includes(player)
                    );
                    
                    // Check if this player was the suggester in a "no one showed" suggestion for this card
                    const wasSuggesterWithNoShow = this.suggestions.some(sug => {
                        const suggestionCards = [sug.character, sug.room, sug.weapon];
                        return suggestionCards.includes(card) && 
                               sug.player === playerWhoHas && 
                               !sug.shownBy;
                    });
                    
                    // Don't mark as "has" if they were the suggester and no one showed
                    // (the cards are more likely in the envelope - Deduction 3 should handle this)
                    if (!wasSuggesterWithNoShow) {
                        if (playerWhoHas && playerWhoHas !== 'You') {
                            this.markCardHas(playerWhoHas, card);
                        } else if (playerWhoHas === 'You' && !this.myCards.includes(card)) {
                            // It's either mine or in envelope - can't determine yet
                        }
                    }
                }
            }
        });
    }

    getCardStatus(card) {
        return this.cardStatus[card] || { 
            has: [], 
            doesntHave: [], 
            hasOneOf: [],
            envelope: false 
        };
    }

    getAllCardStatuses() {
        return {
            characters: this.characters.map(c => ({
                name: c,
                status: this.getCardStatus(c)
            })),
            rooms: this.rooms.map(r => ({
                name: r,
                status: this.getCardStatus(r)
            })),
            weapons: this.weapons.map(w => ({
                name: w,
                status: this.getCardStatus(w)
            }))
        };
    }

    getDeductions() {
        const deductions = [];
        const allCards = [...this.characters, ...this.rooms, ...this.weapons];
        
        allCards.forEach(card => {
            const status = this.getCardStatus(card);
            
            if (status.envelope) {
                deductions.push({
                    type: 'envelope',
                    card: card,
                    message: `${card} is in the envelope!`
                });
            } else if (status.has.length > 0) {
                status.has.forEach(player => {
                    const playerText = player === 'You' ? 'You have' : `${player} has`;
                    deductions.push({
                        type: 'has',
                        card: card,
                        player: player,
                        message: `${playerText} ${card}`
                    });
                });
            }
            
            // Show "has one of" information
            if (status.hasOneOf && status.hasOneOf.length > 0) {
                status.hasOneOf.forEach(entry => {
                    const playerText = entry.player === 'You' ? 'You have' : `${entry.player} has`;
                    const otherCards = entry.cards.filter(c => c !== card);
                    if (otherCards.length > 0) {
                        deductions.push({
                            type: 'hasOneOf',
                            card: card,
                            player: entry.player,
                            cards: entry.cards,
                            message: `${playerText} one of: ${entry.cards.join(', ')}`
                        });
                    }
                });
            }
        });
        
        return deductions;
    }
    
    getMoves() {
        return this.moves;
    }
    
    addMove(type, data) {
        this.moveNumber++;
        const move = {
            moveNumber: this.moveNumber,
            type: type,
            ...data,
            timestamp: Date.now()
        };
        this.moves.push(move);
        return move;
    }
    
    rebuildStateFromMoves() {
        // Save myCards (user input, not from moves)
        const savedMyCards = [...this.myCards];
        
        // Save moves to replay
        const savedMoves = [...this.moves];
        
        // Reset card status to initial state
        const allCards = [...this.characters, ...this.rooms, ...this.weapons];
        allCards.forEach(card => {
            this.cardStatus[card] = {
                has: [],
                doesntHave: [],
                hasOneOf: [],
                envelope: false
            };
        });
        
        // Clear suggestions and moves arrays
        this.suggestions = [];
        this.moves = [];
        this.moveNumber = 0;
        
        // Restore myCards and mark them (without tracking moves)
        this.myCards = [];
        savedMyCards.forEach(card => {
            if (!this.myCards.includes(card)) {
                this.myCards.push(card);
                this.markCardHas('You', card);
                this.players.forEach(player => {
                    if (player !== 'You') {
                        this.markCardDoesntHave(player, card);
                    }
                });
            }
        });
        
        // Replay all moves in order
        savedMoves.forEach(move => {
            if (move.type === 'suggestion') {
                // addSuggestion will increment moveNumber and add to moves array
                // Set moveNumber to one less than the target so it increments correctly
                this.moveNumber = move.moveNumber - 1;
                this.addSuggestion(
                    move.player,
                    move.character,
                    move.room,
                    move.weapon,
                    move.shownBy || null,
                    move.shownToMe || false,
                    move.cardShown || null
                );
            } else if (move.type === 'markHas') {
                // Replay without tracking move (already in moves array, will be restored)
                if (move.player === 'You') {
                    if (!this.myCards.includes(move.card)) {
                        this.myCards.push(move.card);
                        this.markCardHas('You', move.card);
                    }
                } else {
                    this.markCardHas(move.player, move.card);
                }
                // Manually add the move back since markCardHas doesn't track it
                this.moves.push(move);
            } else if (move.type === 'markDoesntHave') {
                // Replay without tracking move (already in moves array, will be restored)
                if (move.player === 'You') {
                    const index = this.myCards.indexOf(move.card);
                    if (index > -1) {
                        this.myCards.splice(index, 1);
                    }
                }
                this.markCardDoesntHave(move.player, move.card);
                // Manually add the move back since markCardDoesntHave doesn't track it
                this.moves.push(move);
            } else if (move.type === 'clearStatus') {
                // Replay without tracking move (already in moves array, will be restored)
                this.clearCardStatus(move.player, move.card);
                // Manually add the move back since clearCardStatus doesn't track it
                this.moves.push(move);
            }
        });
        
        // Restore moveNumber to the highest move number
        if (savedMoves.length > 0) {
            this.moveNumber = Math.max(...savedMoves.map(m => m.moveNumber));
        }
        
        // Update deductions after rebuilding
        this.updateDeductions();
    }

    getBestSuggestions() {
        const suggestions = [];
        const allCards = [...this.characters, ...this.rooms, ...this.weapons];
        
        // Find cards that are unknown (not in my hand, not known to be with others, not in envelope)
        const unknownCards = {
            characters: [],
            rooms: [],
            weapons: []
        };
        
        this.characters.forEach(char => {
            const status = this.getCardStatus(char);
            if (!this.myCards.includes(char) && 
                !status.envelope && 
                status.has.length === 0) {
                unknownCards.characters.push(char);
            }
        });
        
        this.rooms.forEach(room => {
            const status = this.getCardStatus(room);
            if (!this.myCards.includes(room) && 
                !status.envelope && 
                status.has.length === 0) {
                unknownCards.rooms.push(room);
            }
        });
        
        this.weapons.forEach(weapon => {
            const status = this.getCardStatus(weapon);
            if (!this.myCards.includes(weapon) && 
                !status.envelope && 
                status.has.length === 0) {
                unknownCards.weapons.push(weapon);
            }
        });
        
        // Determine who is to the left of "You" in turn order
        // "You" is first, so the person to your left is the first player in the array
        const playerToYourLeft = this.players.length > 0 ? this.players[0] : null;
        
        // Helper function to check if a player doesn't have a card
        const playerDoesntHave = (player, card) => {
            if (!player) return true;
            const status = this.getCardStatus(card);
            return status.doesntHave.includes(player) || 
                   (!status.has.includes(player) && !status.hasOneOf?.some(e => e.player === player));
        };
        
        // Helper function to check if a player doesn't have any of the three cards
        const playerDoesntHaveAny = (player, char, room, weapon) => {
            return playerDoesntHave(player, char) && 
                   playerDoesntHave(player, room) && 
                   playerDoesntHave(player, weapon);
        };
        
        // Generate suggestions that maximize unknown cards
        // Try to suggest combinations where we know the least
        const bestCombos = [];
        
        // Helper function to check if a card is truly unknown
        const isUnknown = (card) => {
            const status = this.getCardStatus(card);
            return !this.myCards.includes(card) && 
                   !status.envelope && 
                   status.has.length === 0;
        };
        
        // Generate suggestions for "You" to make (where player to your left doesn't have the cards)
        unknownCards.characters.forEach(char => {
            unknownCards.rooms.forEach(room => {
                unknownCards.weapons.forEach(weapon => {
                    // Count how many cards in this suggestion are truly unknown
                    let unknownCount = 0;
                    if (isUnknown(char)) unknownCount++;
                    if (isUnknown(room)) unknownCount++;
                    if (isUnknown(weapon)) unknownCount++;
                    
                    // Only add if at least one card is unknown
                    if (unknownCount > 0) {
                        // Check if player to your left doesn't have any of these cards
                        // This is strategic: if left player doesn't have them, suggestion passes to next player
                        const leftPlayerDoesntHave = playerToYourLeft ? 
                            playerDoesntHaveAny(playerToYourLeft, char, room, weapon) : true;
                        
                        // Calculate score: give small bonus for strategic suggestions, but keep it mixed
                        // This way we still see both types of suggestions
                        let strategicScore = unknownCount;
                        if (leftPlayerDoesntHave) {
                            strategicScore += 2; // Small bonus for strategic suggestions (keeps them mixed)
                        }
                        
                        bestCombos.push({
                            player: 'You',
                            character: char,
                            room: room,
                            weapon: weapon,
                            unknownCount: unknownCount,
                            strategicScore: strategicScore,
                            leftPlayerDoesntHave: leftPlayerDoesntHave
                        });
                    }
                });
            });
        });
        
        // Also generate suggestions for other players to make (for learning about cards)
        this.players.forEach(player => {
            // Generate all possible combinations from unknown cards
            unknownCards.characters.forEach(char => {
                unknownCards.rooms.forEach(room => {
                    unknownCards.weapons.forEach(weapon => {
                        // Count how many cards in this suggestion are truly unknown
                        let unknownCount = 0;
                        if (isUnknown(char)) unknownCount++;
                        if (isUnknown(room)) unknownCount++;
                        if (isUnknown(weapon)) unknownCount++;
                        
                        // Only add if at least one card is unknown
                        if (unknownCount > 0) {
                            bestCombos.push({
                                player: player,
                                character: char,
                                room: room,
                                weapon: weapon,
                                unknownCount: unknownCount,
                                strategicScore: unknownCount,
                                leftPlayerDoesntHave: false
                            });
                        }
                    });
                });
            });
        });
        
        // Sort by strategic score (descending), then by unknown count
        // This gives slight preference to strategic suggestions but keeps them mixed
        bestCombos.sort((a, b) => {
            if (b.strategicScore !== a.strategicScore) {
                return b.strategicScore - a.strategicScore;
            }
            return b.unknownCount - a.unknownCount;
        });
        
        // Mix the results: alternate between strategic and non-strategic suggestions
        // This ensures you see both types
        const strategic = [];
        const nonStrategic = [];
        bestCombos.forEach(combo => {
            if (combo.leftPlayerDoesntHave) {
                strategic.push(combo);
            } else {
                nonStrategic.push(combo);
            }
        });
        
        // Interleave strategic and non-strategic suggestions
        const mixed = [];
        const maxLength = Math.max(strategic.length, nonStrategic.length);
        for (let i = 0; i < maxLength; i++) {
            if (i < strategic.length) mixed.push(strategic[i]);
            if (i < nonStrategic.length) mixed.push(nonStrategic[i]);
        }
        
        // Use mixed array for final results
        const finalCombos = mixed.length > 0 ? mixed : bestCombos;
        
        // Shuffle the final combos to randomize order (so it doesn't always start with Scarlett/Kitchen)
        // Fisher-Yates shuffle
        for (let i = finalCombos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [finalCombos[i], finalCombos[j]] = [finalCombos[j], finalCombos[i]];
        }
        
        // Remove duplicates and return top 5
        const uniqueCombos = [];
        const seen = new Set();
        for (const combo of finalCombos) {
            const key = `${combo.player}-${combo.character}-${combo.room}-${combo.weapon}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueCombos.push(combo);
                if (uniqueCombos.length >= 5) break;
            }
        }
        
        return uniqueCombos.map(combo => {
            let message;
            if (combo.player === 'You') {
                message = `You suggest: ${combo.character} in the ${combo.room} with the ${combo.weapon} (${combo.unknownCount} unknown cards)`;
                if (combo.leftPlayerDoesntHave && playerToYourLeft) {
                    message += ` ⭐ Strategic: ${playerToYourLeft} doesn't have these cards, so suggestion will pass to next player`;
                }
            } else {
                message = `Suggest to ${combo.player}: ${combo.character} in the ${combo.room} with the ${combo.weapon} (${combo.unknownCount} unknown cards)`;
            }
            return {
                player: combo.player,
                character: combo.character,
                room: combo.room,
                weapon: combo.weapon,
                suggestion: `${combo.character} in the ${combo.room} with the ${combo.weapon}`,
                unknownCount: combo.unknownCount,
                message: message
            };
        });
    }

    getUnknownCardsCount() {
        const allCards = [...this.characters, ...this.rooms, ...this.weapons];
        let unknownCount = 0;
        
        allCards.forEach(card => {
            const status = this.getCardStatus(card);
            if (!this.myCards.includes(card) && 
                !status.envelope && 
                status.has.length === 0) {
                unknownCount++;
            }
        });
        
        return unknownCount;
    }

    getCardCounts() {
        if (this.numPlayers === 0) return {};
        
        // Calculate how many cards each player should have
        const totalCards = this.characters.length + this.rooms.length + this.weapons.length; // 21 cards
        const envelopeCards = 3; // 1 character, 1 room, 1 weapon
        const totalPlayers = this.numPlayers; // Use stored number
        const cardsToDistribute = totalCards - envelopeCards; // 18 cards
        const cardsPerPlayer = Math.floor(cardsToDistribute / totalPlayers);
        const remainder = cardsToDistribute % totalPlayers;
        
        const counts = {};
        const allPlayersList = [...this.players, 'You'];
        
        allPlayersList.forEach((player, index) => {
            const expectedCount = cardsPerPlayer + (index < remainder ? 1 : 0);
            const actualCount = this.getPlayerCardCount(player);
            counts[player] = {
                expected: expectedCount,
                actual: actualCount,
                difference: actualCount - expectedCount
            };
        });
        
        return counts;
    }

    getPlayerCardCount(player) {
        const allCards = [...this.characters, ...this.rooms, ...this.weapons];
        let count = 0;
        
        allCards.forEach(card => {
            const status = this.getCardStatus(card);
            if (player === 'You') {
                if (this.myCards.includes(card)) {
                    count++;
                }
            } else {
                if (status.has.includes(player)) {
                    count++;
                }
            }
        });
        
        return count;
    }

    getCardProbabilities() {
        const allCards = [...this.characters, ...this.rooms, ...this.weapons];
        const totalCards = allCards.length; // 21
        const envelopeCards = 3; // 1 of each type
        const totalPlayers = this.players.length + 1; // +1 for "You"
        const cardsToDistribute = totalCards - envelopeCards; // 18
        
        const probabilities = {};
        
        // Count cards by category
        const charactersInPlay = this.characters.filter(c => {
            const status = this.getCardStatus(c);
            return !status.envelope && status.has.length === 0 && !this.myCards.includes(c);
        }).length;
        
        const roomsInPlay = this.rooms.filter(r => {
            const status = this.getCardStatus(r);
            return !status.envelope && status.has.length === 0 && !this.myCards.includes(r);
        }).length;
        
        const weaponsInPlay = this.weapons.filter(w => {
            const status = this.getCardStatus(w);
            return !status.envelope && status.has.length === 0 && !this.myCards.includes(w);
        }).length;
        
        // Calculate probabilities
        allCards.forEach(card => {
            const status = this.getCardStatus(card);
            
            // If already known, probability is 0 or 100%
            if (status.envelope) {
                probabilities[card] = { probability: 100, category: this.getCardCategory(card) };
            } else if (status.has.length > 0 || this.myCards.includes(card)) {
                probabilities[card] = { probability: 0, category: this.getCardCategory(card) };
            } else {
                // Calculate probability based on remaining cards in category
                let cardsInCategory;
                if (this.characters.includes(card)) {
                    cardsInCategory = charactersInPlay;
                } else if (this.rooms.includes(card)) {
                    cardsInCategory = roomsInPlay;
                } else {
                    cardsInCategory = weaponsInPlay;
                }
                
                // Probability = 1 / remaining cards in category (simplified)
                // More accurate: consider all unknown cards and players
                const probability = cardsInCategory > 0 ? (1 / cardsInCategory) * 100 : 0;
                probabilities[card] = { 
                    probability: Math.round(probability * 10) / 10, 
                    category: this.getCardCategory(card) 
                };
            }
        });
        
        return probabilities;
    }

    getCardCategory(card) {
        if (this.characters.includes(card)) return 'character';
        if (this.rooms.includes(card)) return 'room';
        if (this.weapons.includes(card)) return 'weapon';
        return 'unknown';
    }
}