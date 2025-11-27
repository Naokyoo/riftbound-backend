const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, Collection } = require('../models');
const { auth } = require('../middleware/auth');

// Fonction pour générer un token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// POST /api/auth/register - Inscription
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide username, email and password'
      });
    }
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }
    
    // Créer l'utilisateur
    const user = new User({
      username,
      email,
      password
    });
    
    await user.save();
    
    // Créer une collection vide pour l'utilisateur
    const collection = new Collection({
      userId: user._id,
      cards: []
    });
    
    await collection.save();
    
    // Générer le token
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toPublicProfile()
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error registering user'
    });
  }
});

// POST /api/auth/login - Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }
    
    // Trouver l'utilisateur (avec le password)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is disabled'
      });
    }
    
    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();
    
    // Générer le token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toPublicProfile()
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error logging in'
    });
  }
});

// GET /api/auth/me - Obtenir le profil de l'utilisateur connecté
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching user profile'
    });
  }
});

// PUT /api/auth/update-profile - Mettre à jour le profil
router.put('/update-profile', auth, async (req, res) => {
  try {
    const allowedUpdates = ['displayName', 'avatar', 'preferences'];
    const updates = Object.keys(req.body);
    
    updates.forEach(update => {
      if (allowedUpdates.includes(update)) {
        if (update === 'preferences' && typeof req.body[update] === 'object') {
          req.user.preferences = { ...req.user.preferences, ...req.body[update] };
        } else {
          req.user[update] = req.body[update];
        }
      }
    });
    
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: req.user.toPublicProfile()
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error updating profile'
    });
  }
});

// PUT /api/auth/change-password - Changer le mot de passe
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide current and new password'
      });
    }
    
    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findById(req.userId).select('+password');
    
    // Vérifier le mot de passe actuel
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error changing password'
    });
  }
});

module.exports = router;
