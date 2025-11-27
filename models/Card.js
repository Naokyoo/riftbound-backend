const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  cardId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    default: ''
  },

  type: {
    type: String,
    enum: ['Unit', 'Spell', 'Artifact', 'Champion'],
    required: true
  },

  rarity: {
    type: String,
    enum: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Showcase'],
    required: true
  },

  cost: {
    type: Number,
    required: true,
    min: 0
  },

  // Stats pour les unités
  attack: {
    type: Number,
    default: null
  },

  health: {
    type: Number,
    default: null
  },

  // Faction
  faction: {
    type: String,
    enum: ['Fire', 'Water', 'Earth', 'Air', 'Dark', 'Light', 'Neutral'],
    required: true
  },

  // Capacités
  abilities: [{
    name: String,
    description: String,
    type: {
      type: String,
      enum: ['Passive', 'Active', 'Triggered']
    }
  }],

  keywords: [{
    type: String,
    trim: true
  }],

  // Visuels
  imageUrl: {
    type: String,
    default: ''
  },

  // Meta-données
  set: {
    type: String,
    default: 'Base'
  },

  flavor: {
    type: String,
    default: ''
  },

  isPlayable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour les recherches
cardSchema.index({ name: 'text', description: 'text' });
cardSchema.index({ rarity: 1, faction: 1 });
cardSchema.index({ type: 1, cost: 1 });

module.exports = mongoose.model('Card', cardSchema);
