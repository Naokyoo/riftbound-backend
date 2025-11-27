const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { Card } = require('./models');

dotenv.config();

// Mapping des domaines frontend vers les factions backend
const domainToFactionMap = {
    'fury': 'Fire',
    'mind': 'Water',
    'body': 'Earth',
    'calm': 'Air',
    'chaos': 'Dark',
    'soul': 'Light'
};

// Mapping des types de cartes
const cardTypeMap = {
    'unit': 'Unit',
    'spell': 'Spell',
    'artifact': 'Artifact',
    'champion': 'Champion',
    'legend': 'Champion',
    'rune': 'Artifact',
    'battlefield': 'Artifact'
};

async function importCards() {
    try {
        console.log('🌱 Démarrage de l\'import des cartes...\n');

        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB\n');

        // Lire le fichier cards.json du frontend
        const cardsPath = path.join(__dirname, '../riftboundmanager/src/data/cards.json');
        console.log(`📖 Lecture du fichier: ${cardsPath}`);

        const rawData = fs.readFileSync(cardsPath, 'utf8');
        const cardsData = JSON.parse(rawData);
        console.log(`✅ ${cardsData.length} cartes trouvées\n`);

        // Nettoyer la collection existante
        console.log('🗑️  Nettoyage de la collection cards...');
        await Card.deleteMany({});
        console.log('✅ Collection nettoyée\n');

        // Transformer et insérer les cartes
        console.log('📇 Transformation et insertion des cartes...');
        let successCount = 0;
        let errorCount = 0;

        for (const card of cardsData) {
            try {
                // Déterminer la faction
                let faction = 'Neutral';
                if (card.domains && card.domains.length > 0) {
                    const domainId = card.domains[0].id.toLowerCase();
                    faction = domainToFactionMap[domainId] || 'Neutral';
                }

                // Déterminer le type
                let type = 'Unit';
                if (card.cardType && card.cardType.length > 0) {
                    const cardTypeId = card.cardType[0].id.toLowerCase();
                    type = cardTypeMap[cardTypeId] || 'Unit';
                }

                // Déterminer la rareté
                let rarity = 'Common';
                if (card.rarity && card.rarity.label) {
                    rarity = card.rarity.label;
                }

                // Créer l'objet carte pour MongoDB
                const mongoCard = {
                    cardId: card.id.toUpperCase(),
                    name: card.name,
                    description: card.text || '',
                    type: type,
                    rarity: rarity,
                    cost: card.energy || 0,
                    attack: card.power || null,
                    health: card.defense || null,
                    faction: faction,
                    imageUrl: card.cardImage?.url || '',
                    set: card.set || 'Base',
                    keywords: card.keywords || [],
                    isPlayable: true
                };

                await Card.create(mongoCard);
                successCount++;

                if (successCount % 500 === 0) {
                    console.log(`   Importé: ${successCount} cartes...`);
                }
            } catch (error) {
                errorCount++;
                if (errorCount <= 5) {
                    console.error(`   ❌ Erreur pour la carte ${card.name}:`, error.message);
                }
            }
        }

        console.log(`\n✅ Import terminé!`);
        console.log(`   Succès: ${successCount} cartes`);
        console.log(`   Erreurs: ${errorCount} cartes\n`);

        // Afficher quelques exemples
        console.log('📋 Exemples de cartes importées:');
        const samples = await Card.find().limit(5);
        samples.forEach(card => {
            console.log(`   - ${card.name} (${card.cardId}) - ${card.faction} ${card.type}`);
        });

        console.log('\n🎉 Import des cartes terminé avec succès!\n');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Connexion fermée');
        process.exit(0);
    }
}

// Exécuter l'import
importCards();
