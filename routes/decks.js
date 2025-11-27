const express = require('express');
const router = express.Router();
const { Deck, Collection, Card } = require('../models');
const { auth } = require('../middleware/auth');

// GET /api/decks - Mes decks
router.get('/', auth, async (req, res) => {
  try {
    const decks = await Deck.find({ userId: req.userId })
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: decks.length,
      data: decks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/decks/:id - Obtenir un deck spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    const deck = await Deck.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found'
      });
    }

    res.json({
      success: true,
      data: deck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/decks/:id/detailed - Deck avec les détails des cartes
router.get('/:id/detailed', auth, async (req, res) => {
  try {
    const deck = await Deck.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found'
      });
    }

    // Récupérer les détails de chaque carte
    const cardIds = deck.cards.map(c => c.cardId);
    const cardDetails = await Card.find({ cardId: { $in: cardIds } });

    // Créer une map des cartes
    const cardMap = {};
    cardDetails.forEach(card => {
      cardMap[card.cardId] = card;
    });

    // Enrichir les cartes du deck
    const enrichedCards = deck.cards.map(deckCard => ({
      ...deckCard.toObject(),
      details: cardMap[deckCard.cardId] || null
    }));

    res.json({
      success: true,
      data: {
        ...deck.toObject(),
        cards: enrichedCards
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/decks - Créer un nouveau deck
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, mainFaction, cards, format, legendId } = req.body;

    // Validation de base
    if (!name || !mainFaction || !legendId) {
      return res.status(400).json({
        success: false,
        error: 'Name, mainFaction and legendId are required'
      });
    }

    // Créer le deck
    const deck = new Deck({
      userId: req.userId,
      name,
      description: description || '',
      mainFaction,
      legendId,
      cards: cards || [],
      format: format || 'Standard'
    });

    // Mettre à jour les stats
    deck.updateStats();

    await deck.save();

    res.status(201).json({
      success: true,
      message: 'Deck created successfully',
      data: deck
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/decks/:id - Modifier un deck
router.put('/:id', auth, async (req, res) => {
  try {
    const deck = await Deck.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found'
      });
    }

    // Champs modifiables
    const allowedUpdates = ['name', 'description', 'mainFaction', 'cards', 'format',
      'isPublic', 'isFavorite', 'coverCard', 'tags', 'legendId'];

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        deck[key] = req.body[key];
      }
    });

    // Mettre à jour les stats
    deck.updateStats();

    await deck.save();

    res.json({
      success: true,
      message: 'Deck updated successfully',
      data: deck
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/decks/:id - Supprimer un deck
router.delete('/:id', auth, async (req, res) => {
  try {
    const deck = await Deck.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found'
      });
    }

    res.json({
      success: true,
      message: 'Deck deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/decks/:id/cards - Ajouter une carte au deck
router.post('/:id/cards', auth, async (req, res) => {
  try {
    const { cardId, quantity = 1 } = req.body;

    // Vérifier que la carte existe
    const card = await Card.findOne({ cardId: cardId.toUpperCase() });
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }

    // Vérifier que l'utilisateur possède la carte
    // DÉSACTIVÉ : Permet d'ajouter n'importe quelle carte au deck pour la construction
    // const collection = await Collection.findOne({ userId: req.userId });
    // if (!collection || !collection.hasCard(cardId.toUpperCase(), quantity)) {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'You do not own enough copies of this card'
    //   });
    // }

    // Récupérer le deck
    const deck = await Deck.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found'
      });
    }

    // Ajouter la carte
    deck.addCard(cardId.toUpperCase(), quantity);
    await deck.save();

    res.json({
      success: true,
      message: `Added ${quantity}x ${card.name} to deck`,
      data: deck
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/decks/:id/cards/:cardId - Retirer une carte du deck
router.delete('/:id/cards/:cardId', auth, async (req, res) => {
  try {
    const { quantity = 1 } = req.body;
    const cardId = req.params.cardId.toUpperCase();

    const deck = await Deck.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found'
      });
    }

    // Retirer la carte
    deck.removeCard(cardId, quantity);
    await deck.save();

    res.json({
      success: true,
      message: `Removed ${quantity}x card from deck`,
      data: deck
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/decks/:id/validate - Valider un deck
router.post('/:id/validate', auth, async (req, res) => {
  try {
    const deck = await Deck.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found'
      });
    }

    deck.validateDeck();
    await deck.save();

    res.json({
      success: true,
      isValid: deck.isValid,
      message: deck.isValid ? 'Deck is valid' : 'Deck must contain between 30 and 60 cards',
      data: deck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/decks/public/search - Rechercher des decks publics
router.get('/public/search', async (req, res) => {
  try {
    const { faction, search, sort } = req.query;

    let filter = { isPublic: true };
    if (faction) filter.mainFaction = faction;
    if (search) filter.name = { $regex: search, $options: 'i' };

    let sortOption = {};
    if (sort === 'winrate') sortOption = { 'gameStats.winRate': -1 };
    else if (sort === 'popular') sortOption = { 'gameStats.timesPlayed': -1 };
    else sortOption = { updatedAt: -1 };

    const decks = await Deck.find(filter)
      .sort(sortOption)
      .limit(50)
      .select('-cards'); // Ne pas renvoyer les cartes dans la recherche

    res.json({
      success: true,
      count: decks.length,
      data: decks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/decks/:id/game-result - Enregistrer un résultat de partie
router.post('/:id/game-result', auth, async (req, res) => {
  try {
    const { won } = req.body;

    const deck = await Deck.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!deck) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found'
      });
    }

    // Mettre à jour les stats de jeu
    deck.gameStats.timesPlayed += 1;
    if (won) {
      deck.gameStats.wins += 1;
    } else {
      deck.gameStats.losses += 1;
    }
    deck.updateWinRate();

    await deck.save();

    res.json({
      success: true,
      message: 'Game result recorded',
      data: deck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
