const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { User, Card, Collection, Deck } = require('../../Backend/models');

dotenv.config();

// Données de cartes pour Riftbound
const cards = [
  // Cartes Fire
  {
    cardId: 'FIRE001',
    name: 'Flamme Destructrice',
    description: 'Inflige 3 dégâts à une cible.',
    type: 'Spell',
    rarity: 'Common',
    cost: 2,
    faction: 'Fire',
    keywords: ['Direct Damage'],
    imageUrl: '/images/cards/fire001.png'
  },
  {
    cardId: 'FIRE002',
    name: 'Dragon Infernal',
    description: 'Quand cette unité attaque, inflige 1 dégât à tous les ennemis.',
    type: 'Unit',
    rarity: 'Legendary',
    cost: 7,
    attack: 6,
    health: 6,
    faction: 'Fire',
    abilities: [{
      name: 'Souffle de Feu',
      description: 'Inflige 1 dégât à tous les ennemis quand cette unité attaque',
      type: 'Triggered'
    }],
    keywords: ['Flying', 'Dragon'],
    imageUrl: '/images/cards/fire002.png'
  },
  {
    cardId: 'FIRE003',
    name: 'Phénix Renaissant',
    description: 'Quand cette unité meurt, elle revient avec 1 PV.',
    type: 'Unit',
    rarity: 'Epic',
    cost: 5,
    attack: 3,
    health: 3,
    faction: 'Fire',
    abilities: [{
      name: 'Renaissance',
      description: 'Revient à la vie avec 1 PV',
      type: 'Triggered'
    }],
    keywords: ['Flying', 'Rebirth'],
    imageUrl: '/images/cards/fire003.png'
  },
  
  // Cartes Water
  {
    cardId: 'WATER001',
    name: 'Vague Guérisseuse',
    description: 'Restaure 4 points de vie.',
    type: 'Spell',
    rarity: 'Common',
    cost: 1,
    faction: 'Water',
    keywords: ['Healing'],
    imageUrl: '/images/cards/water001.png'
  },
  {
    cardId: 'WATER002',
    name: 'Léviathan des Profondeurs',
    description: 'Ne peut pas être attaqué par des unités de coût 3 ou moins.',
    type: 'Unit',
    rarity: 'Epic',
    cost: 6,
    attack: 5,
    health: 8,
    faction: 'Water',
    abilities: [{
      name: 'Submersion',
      description: 'Ne peut pas être ciblé par des sorts de coût 2 ou moins',
      type: 'Passive'
    }],
    keywords: ['Beast', 'Aquatic'],
    imageUrl: '/images/cards/water002.png'
  },
  {
    cardId: 'WATER003',
    name: 'Sirène Enchanteresse',
    description: 'Au début de votre tour, piochez une carte.',
    type: 'Unit',
    rarity: 'Rare',
    cost: 3,
    attack: 2,
    health: 3,
    faction: 'Water',
    abilities: [{
      name: 'Chant Mystique',
      description: 'Piochez une carte au début de votre tour',
      type: 'Triggered'
    }],
    keywords: ['Mermaid'],
    imageUrl: '/images/cards/water003.png'
  },
  
  // Cartes Earth
  {
    cardId: 'EARTH001',
    name: 'Mur de Pierre',
    description: 'Invoque une barrière 0/5 avec Défenseur.',
    type: 'Spell',
    rarity: 'Uncommon',
    cost: 2,
    faction: 'Earth',
    keywords: ['Summon', 'Defense'],
    imageUrl: '/images/cards/earth001.png'
  },
  {
    cardId: 'EARTH002',
    name: 'Golem de Granit',
    description: 'Reçoit -1 dégât de toutes les sources.',
    type: 'Unit',
    rarity: 'Rare',
    cost: 4,
    attack: 3,
    health: 5,
    faction: 'Earth',
    abilities: [{
      name: 'Peau de Pierre',
      description: 'Réduit tous les dégâts reçus de 1',
      type: 'Passive'
    }],
    keywords: ['Golem', 'Tank'],
    imageUrl: '/images/cards/earth002.png'
  },
  
  // Cartes Air
  {
    cardId: 'AIR001',
    name: 'Rafale Élémentaire',
    description: 'Renvoie une unité ennemie dans la main de son propriétaire.',
    type: 'Spell',
    rarity: 'Common',
    cost: 3,
    faction: 'Air',
    keywords: ['Bounce'],
    imageUrl: '/images/cards/air001.png'
  },
  {
    cardId: 'AIR002',
    name: 'Griffon Céleste',
    description: 'Vol. Quand cette unité attaque, renvoyez un sort de votre cimetière dans votre main.',
    type: 'Unit',
    rarity: 'Epic',
    cost: 5,
    attack: 3,
    health: 4,
    faction: 'Air',
    abilities: [{
      name: 'Recyclage Mystique',
      description: 'Récupère un sort du cimetière après attaque',
      type: 'Triggered'
    }],
    keywords: ['Flying', 'Griffon'],
    imageUrl: '/images/cards/air002.png'
  },
  
  // Cartes Light
  {
    cardId: 'LIGHT001',
    name: 'Ange Gardien',
    description: 'Quand une unité alliée devrait mourir, sacrifiez cet ange pour la sauver.',
    type: 'Unit',
    rarity: 'Rare',
    cost: 4,
    attack: 2,
    health: 4,
    faction: 'Light',
    abilities: [{
      name: 'Protection Divine',
      description: 'Sacrifice : Empêche la mort d\'une unité alliée',
      type: 'Triggered'
    }],
    keywords: ['Angel', 'Flying', 'Sacrifice'],
    imageUrl: '/images/cards/light001.png'
  },
  {
    cardId: 'LIGHT002',
    name: 'Paladin Vertueux',
    description: 'Toutes vos autres unités gagnent +1/+1.',
    type: 'Unit',
    rarity: 'Epic',
    cost: 4,
    attack: 3,
    health: 3,
    faction: 'Light',
    abilities: [{
      name: 'Aura de Vertu',
      description: 'Les autres unités alliées gagnent +1/+1',
      type: 'Passive'
    }],
    keywords: ['Paladin', 'Buff'],
    imageUrl: '/images/cards/light002.png'
  },
  
  // Cartes Dark
  {
    cardId: 'DARK001',
    name: 'Drain de Vie',
    description: 'Inflige 2 dégâts et restaure 2 points de vie.',
    type: 'Spell',
    rarity: 'Common',
    cost: 3,
    faction: 'Dark',
    keywords: ['Lifesteal', 'Direct Damage'],
    imageUrl: '/images/cards/dark001.png'
  },
  {
    cardId: 'DARK002',
    name: 'Nécromancien Noir',
    description: 'Quand une unité meurt, gagnez +1/+1.',
    type: 'Unit',
    rarity: 'Rare',
    cost: 3,
    attack: 2,
    health: 2,
    faction: 'Dark',
    abilities: [{
      name: 'Âmes Dévorées',
      description: 'Gagne +1/+1 quand une unité meurt',
      type: 'Triggered'
    }],
    keywords: ['Necromancer'],
    imageUrl: '/images/cards/dark002.png'
  },
  
  // Cartes Neutral
  {
    cardId: 'NEUTRAL001',
    name: 'Mercenaire Vétéran',
    description: 'Une unité polyvalente sans faction.',
    type: 'Unit',
    rarity: 'Common',
    cost: 3,
    attack: 3,
    health: 3,
    faction: 'Neutral',
    keywords: ['Mercenary'],
    imageUrl: '/images/cards/neutral001.png'
  },
  {
    cardId: 'NEUTRAL002',
    name: 'Artefact Ancien',
    description: 'Au début de votre tour, gagnez 1 mana supplémentaire.',
    type: 'Artifact',
    rarity: 'Legendary',
    cost: 3,
    faction: 'Neutral',
    abilities: [{
      name: 'Résonance Mystique',
      description: 'Gagnez 1 mana au début de votre tour',
      type: 'Triggered'
    }],
    keywords: ['Artifact', 'Ramp'],
    imageUrl: '/images/cards/neutral002.png'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Démarrage du seed...\n');
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');
    
    // Nettoyer les collections existantes
    console.log('🗑️  Nettoyage des collections...');
    await Card.deleteMany({});
    await User.deleteMany({});
    await Collection.deleteMany({});
    await Deck.deleteMany({});
    console.log('✅ Collections nettoyées\n');
    
    // Insérer les cartes
    console.log('📇 Insertion des cartes...');
    await Card.insertMany(cards);
    console.log(`✅ ${cards.length} cartes insérées\n`);
    
    // Créer des utilisateurs de test
    console.log('👤 Création des utilisateurs...');
    
    const user1 = new User({
      username: 'testplayer',
      email: 'test@riftbound.com',
      password: 'password123',
      displayName: 'Joueur Test',
      level: 5,
      coins: 5000,
      gems: 100
    });
    await user1.save();
    console.log('✅ Utilisateur: testplayer (password123)');
    
    const user2 = new User({
      username: 'admin',
      email: 'admin@riftbound.com',
      password: 'admin123',
      displayName: 'Admin',
      role: 'admin',
      level: 10,
      coins: 10000,
      gems: 500
    });
    await user2.save();
    console.log('✅ Utilisateur admin (admin123)\n');
    
    // Créer des collections
    console.log('📚 Création des collections...');
    
    const collection1 = new Collection({
      userId: user1._id,
      cards: [
        { cardId: 'FIRE001', quantity: 3, acquiredFrom: 'Pack' },
        { cardId: 'FIRE002', quantity: 1, acquiredFrom: 'Pack' },
        { cardId: 'WATER001', quantity: 2, acquiredFrom: 'Craft' },
        { cardId: 'EARTH001', quantity: 2, acquiredFrom: 'Pack' },
        { cardId: 'LIGHT001', quantity: 1, acquiredFrom: 'Reward' },
        { cardId: 'NEUTRAL001', quantity: 4, acquiredFrom: 'Pack' },
        { cardId: 'AIR001', quantity: 2, acquiredFrom: 'Pack' }
      ]
    });
    collection1.updateStats();
    await collection1.save();
    console.log('✅ Collection de testplayer créée');
    
    const collection2 = new Collection({
      userId: user2._id,
      cards: cards.map(card => ({
        cardId: card.cardId,
        quantity: 3,
        acquiredFrom: 'Admin'
      }))
    });
    collection2.updateStats();
    await collection2.save();
    console.log('✅ Collection d\'admin créée (toutes les cartes)\n');
    
    // Créer des decks
    console.log('🃏 Création des decks...');
    
    const deck1 = new Deck({
      userId: user1._id,
      name: 'Deck Feu Agressif',
      description: 'Un deck agressif utilisant la faction Feu',
      mainFaction: 'Fire',
      format: 'Standard',
      cards: [
        { cardId: 'FIRE001', quantity: 3 },
        { cardId: 'FIRE002', quantity: 1 },
        { cardId: 'FIRE003', quantity: 2 },
        { cardId: 'NEUTRAL001', quantity: 3 },
        { cardId: 'LIGHT001', quantity: 1 }
      ],
      tags: ['aggro', 'fire', 'beginner']
    });
    deck1.updateStats();
    await deck1.save();
    console.log('✅ Deck "Feu Agressif" créé');
    
    const deck2 = new Deck({
      userId: user1._id,
      name: 'Contrôle Eau',
      description: 'Deck de contrôle avec la faction Eau',
      mainFaction: 'Water',
      format: 'Standard',
      cards: [
        { cardId: 'WATER001', quantity: 2 },
        { cardId: 'WATER002', quantity: 1 },
        { cardId: 'WATER003', quantity: 2 },
        { cardId: 'EARTH001', quantity: 2 },
        { cardId: 'NEUTRAL001', quantity: 3 }
      ],
      isPublic: true,
      tags: ['control', 'water']
    });
    deck2.updateStats();
    await deck2.save();
    console.log('✅ Deck "Contrôle Eau" créé\n');
    
    // Afficher le résumé
    console.log('═══════════════════════════════════════');
    console.log('🎉 Base de données initialisée!');
    console.log('═══════════════════════════════════════');
    console.log(`📇 Cartes: ${cards.length}`);
    console.log(`👤 Utilisateurs: 2`);
    console.log(`   - testplayer / password123`);
    console.log(`   - admin / admin123 (admin)`);
    console.log(`📚 Collections: 2`);
    console.log(`🃏 Decks: 2`);
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Connexion fermée');
    process.exit(0);
  }
}

// Exécuter le seed
seedDatabase();
