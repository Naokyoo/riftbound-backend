const mongoose = require('mongoose');

const deckCardSchema = new mongoose.Schema({
  cardId: {
    type: String,
    required: true,
    ref: 'Card'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 3 // Max 3 copies par carte
  }
}, { _id: false });

const deckSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },

  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },

  description: {
    type: String,
    default: '',
    maxlength: 500
  },

  cards: [deckCardSchema],

  mainFaction: {
    type: String,
    enum: ['Fire', 'Water', 'Earth', 'Air', 'Dark', 'Light', 'Neutral', 'Multi'],
    required: true
  },

  legendId: {
    type: String,
    required: true
  },

  format: {
    type: String,
    enum: ['Standard', 'Extended', 'Unlimited'],
    default: 'Standard'
  },

  stats: {
    totalCards: { type: Number, default: 0 },
    averageCost: { type: Number, default: 0 }
  },

  isValid: {
    type: Boolean,
    default: false
  },

  isPublic: {
    type: Boolean,
    default: false
  },

  isFavorite: {
    type: Boolean,
    default: false
  },

  gameStats: {
    timesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 }
  },

  coverCard: {
    type: String,
    default: null
  },

  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Index
deckSchema.index({ userId: 1, name: 1 });
deckSchema.index({ mainFaction: 1, isPublic: 1 });



// Méthode pour ajouter une carte
deckSchema.methods.addCard = function (cardId, quantity = 1) {
  const existingCard = this.cards.find(c => c.cardId === cardId);

  if (existingCard) {
    existingCard.quantity = Math.min(existingCard.quantity + quantity, 3);
  } else {
    this.cards.push({ cardId, quantity: Math.min(quantity, 3) });
  }

  this.updateStats();
  return this;
};

// Méthode pour retirer une carte
deckSchema.methods.removeCard = function (cardId, quantity = 1) {
  const card = this.cards.find(c => c.cardId === cardId);

  if (!card) {
    throw new Error('Card not found in deck');
  }

  if (card.quantity <= quantity) {
    this.cards = this.cards.filter(c => c.cardId !== cardId);
  } else {
    card.quantity -= quantity;
  }

  this.updateStats();
  return this;
};

// Méthode pour mettre à jour les stats
deckSchema.methods.updateStats = function () {
  this.stats.totalCards = this.cards.reduce((sum, card) => sum + card.quantity, 0);
  this.validateDeck();
};

// Méthode pour valider le deck
deckSchema.methods.validateDeck = function () {
  const totalCards = this.stats.totalCards;
  this.isValid = totalCards >= 30 && totalCards <= 60;
  return this.isValid;
};

// Calculer le winrate
deckSchema.methods.updateWinRate = function () {
  const totalGames = this.gameStats.wins + this.gameStats.losses;
  if (totalGames > 0) {
    this.gameStats.winRate = Math.round((this.gameStats.wins / totalGames) * 100);
  }
};

module.exports = mongoose.model('Deck', deckSchema);
