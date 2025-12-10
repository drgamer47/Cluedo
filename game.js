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
            this.markCardHas('You', card);
            this.players.forEach(player => {
                if (player !== 'You') {
                    this.markCardDoesntHave(player, card);
                }
            });
            this.updateYouCardStatuses();
        }
    }

    removeMyCard(card) {
        const index = this.myCards.indexOf(card);
        if (index > -1) {
            this.myCards.splice(index, 1);
            this.clearCardStatus('You', card, true);
            if (this.cardStatus[card]) {
                this.players.forEach(player => {
                    if (player !== 'You') {
                        this.clearCardStatus(player, card);
                    }
                });
            }
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
        const allPlayersList = [...this.players, 'You'];
        allPlayersList.forEach(otherPlayer => {
            if (otherPlayer !== player) {
                // Remove from has if present
                const otherHasIndex = this.cardStatus[card].has.indexOf(otherPlayer);
                if (otherHasIndex > -1) {
                    this.cardStatus[card].has.splice(otherHasIndex, 1);
                }
                
                // Add to doesn't have if not already there
                if (!this.cardStatus[card].doesntHave.includes(otherPlayer)) {
                    this.cardStatus[card].doesntHave.push(otherPlayer);
                }
            }
        });
        
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
            }
        }
        
        // Remove from has if present
        const hasIndex = this.cardStatus[card].has.indexOf(player);
        if (hasIndex > -1) {
            this.cardStatus[card].has.splice(hasIndex, 1);
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
            
            // The suggesting player doesn't have any of these cards
            this.markCardDoesntHave(player, character);
            this.markCardDoesntHave(player, room);
            this.markCardDoesntHave(player, weapon);
            
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
            this.players.forEach(p => {
                if (p !== player && p !== 'You') {
                    this.markCardDoesntHave(p, character);
                    this.markCardDoesntHave(p, room);
                    this.markCardDoesntHave(p, weapon);
                }
            });
            
            // Special case: If "You" made the suggestion and no one showed a card,
            // and "You" doesn't have any of these cards, mark "You" as doesn't have
            // (updateDeductions will then mark them as in the envelope)
            if (player === 'You') {
                if (!this.myCards.includes(character)) {
                    this.markCardDoesntHave('You', character);
                }
                if (!this.myCards.includes(room)) {
                    this.markCardDoesntHave('You', room);
                }
                if (!this.myCards.includes(weapon)) {
                    this.markCardDoesntHave('You', weapon);
                }
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
            
            // If all players (including me) don't have it, it must be in the envelope
            if (allOtherPlayersDontHave && iDontHave && status.has.length === 0) {
                status.envelope = true;
                // Clear any conflicting data
                status.has = [];
            }
            
            // Deduction 4: If we know all players except one don't have it, that one must have it
            if (!status.envelope && status.has.length === 0) {
                const playersWithoutCard = status.doesntHave.length;
                
                // If all but one player doesn't have it, the remaining one must have it
                if (playersWithoutCard === totalPlayers - 1) {
                    // Find the player who doesn't have "doesn't have" marked
                    const allPlayersList = [...this.players, 'You'];
                    const playerWhoHas = allPlayersList.find(player => 
                        !status.doesntHave.includes(player)
                    );
                    
                    if (playerWhoHas && playerWhoHas !== 'You') {
                        this.markCardHas(playerWhoHas, card);
                    } else if (playerWhoHas === 'You' && !this.myCards.includes(card)) {
                        // It's either mine or in envelope - can't determine yet
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

