const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username must be less than 30 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Ne pas inclure le password par défaut dans les requêtes
  },
  
  // Profil
  displayName: {
    type: String,
    default: function() { return this.username; }
  },
  
  avatar: {
    type: String,
    default: ''
  },
  
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Monnaies
  coins: {
    type: Number,
    default: 1000,
    min: 0
  },
  
  gems: {
    type: Number,
    default: 50,
    min: 0
  },
  
  // Stats
  stats: {
    totalGamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    totalCardsCollected: { type: Number, default: 0 }
  },
  
  // Préférences
  preferences: {
    favoriteFaction: {
      type: String,
      enum: ['Fire', 'Water', 'Earth', 'Air', 'Dark', 'Light', 'Neutral', null],
      default: null
    },
    notifications: { type: Boolean, default: true }
  },
  
  // Sécurité
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash le mot de passe avant de sauvegarder
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour obtenir le profil public
userSchema.methods.toPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    displayName: this.displayName,
    avatar: this.avatar,
    level: this.level,
    experience: this.experience,
    coins: this.coins,
    gems: this.gems,
    stats: this.stats,
    preferences: this.preferences,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
