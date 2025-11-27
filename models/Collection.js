const mongoose = require('mongoose');

const collectionItemSchema = new mongoose.Schema({
  cardId: {
    type: String,
    required: true,
    ref: 'Card'
  },
  quantity: {
    type: Number,
    default: 1,
    min: 0
  },
  acquiredDate: {
    type: Date,
    default: Date.now
  },
  acquiredFrom: {
    type: String,
    enum: ['Pack', 'Craft', 'Trade', 'Reward', 'Purchase', 'Gift'],
    default: 'Pack'
  },
  isFavorite: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const collectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    unique: true
  },
  
  cards: [collectionItemSchema],
  
  stats: {
    totalCards: { type: Number, default: 0 },
    uniqueCards: { type: Number, default: 0 },
    byRarity: {
      common: { type: Number, default: 0 },
      uncommon: { type: Number, default: 0 },
      rare: { type: Number, default: 0 },
      epic: { type: Number, default: 0 },
      legendary: { type: Number, default: 0 }
    },
    byFaction: {
      fire: { type: Number, default: 0 },
      water: { type: Number, default: 0 },
      earth: { type: Number, default: 0 },
      air: { type: Number, default: 0 },
      dark: { type: Number, default: 0 },
      light: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

// Index
collectionSchema.index({ userId: 1 });
collectionSchema.index({ 'cards.cardId': 1 });

// Méthode pour ajouter une carte
collectionSchema.methods.addCard = function(cardId, quantity = 1, source = 'Pack') {
  const existingCard = this.cards.find(c => c.cardId === cardId);
  
  if (existingCard) {
    existingCard.quantity += quantity;
  } else {
    this.cards.push({
      cardId,
      quantity,
      acquiredFrom: source
    });
  }
  
  this.updateStats();
  return this;
};

// Méthode pour retirer une carte
collectionSchema.methods.removeCard = function(cardId, quantity = 1) {
  const card = this.cards.find(c => c.cardId === cardId);
  
  if (!card) {
    throw new Error('Card not found in collection');
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
collectionSchema.methods.updateStats = function() {
  this.stats.totalCards = this.cards.reduce((sum, card) => sum + card.quantity, 0);
  this.stats.uniqueCards = this.cards.length;
};

// Méthode pour vérifier si possède une carte
collectionSchema.methods.hasCard = function(cardId, requiredQuantity = 1) {
  const card = this.cards.find(c => c.cardId === cardId);
  return card && card.quantity >= requiredQuantity;
};

module.exports = mongoose.model('Collection', collectionSchema);
