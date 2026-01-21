/**
 * Simple Vector Embedding Engine
 * Creates and manages vector embeddings for semantic search
 * Uses TF-IDF-like approach without external dependencies
 */

const FAQEmbedding = require('../../models/FAQEmbedding');

/**
 * Generate a simple embedding vector from text
 * Uses word frequency and importance scoring
 */
function generateEmbedding(text, dimension = 100) {
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);

    const embedding = new Array(dimension).fill(0);

    // Simple hash-based embedding
    words.forEach((word, idx) => {
        const hash = simpleHash(word);
        const position = hash % dimension;
        embedding[position] += 1 / (idx + 1); // Weight earlier words more
    });

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
}

/**
 * Simple string hash function
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        mag1 += vec1[i] * vec1[i];
        mag2 += vec2[i] * vec2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (mag1 * mag2);
}

/**
 * Store FAQ with embedding
 */
async function storeFAQWithEmbedding(question, answer, category, keywords = []) {
    try {
        const embedding = generateEmbedding(question + ' ' + answer);

        const faq = new FAQEmbedding({
            question,
            answer,
            category,
            keywords,
            embedding
        });

        await faq.save();
        return faq;
    } catch (error) {
        console.error('Error storing FAQ:', error);
        throw error;
    }
}

/**
 * Search FAQs using semantic similarity
 */
async function searchFAQs(query, threshold = 0.3, limit = 3) {
    try {
        const queryEmbedding = generateEmbedding(query);
        const faqs = await FAQEmbedding.find({ isActive: true });

        const results = faqs.map(faq => {
            const similarity = cosineSimilarity(queryEmbedding, faq.embedding);
            return {
                faq,
                similarity,
                question: faq.question,
                answer: faq.answer,
                category: faq.category
            };
        });

        // Sort by similarity and filter by threshold
        return results
            .filter(r => r.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    } catch (error) {
        console.error('Error searching FAQs:', error);
        return [];
    }
}

/**
 * Update FAQ embedding when content changes
 */
async function updateFAQEmbedding(faqId, newQuestion, newAnswer) {
    try {
        const embedding = generateEmbedding(newQuestion + ' ' + newAnswer);
        await FAQEmbedding.findByIdAndUpdate(faqId, {
            question: newQuestion,
            answer: newAnswer,
            embedding,
            updatedAt: Date.now()
        });
    } catch (error) {
        console.error('Error updating FAQ embedding:', error);
        throw error;
    }
}

/**
 * Bulk generate embeddings for existing FAQs
 */
async function regenerateAllEmbeddings() {
    try {
        const faqs = await FAQEmbedding.find({});
        let updated = 0;

        for (const faq of faqs) {
            const embedding = generateEmbedding(faq.question + ' ' + faq.answer);
            faq.embedding = embedding;
            faq.updatedAt = Date.now();
            await faq.save();
            updated++;
        }

        return { success: true, updated };
    } catch (error) {
        console.error('Error regenerating embeddings:', error);
        throw error;
    }
}

module.exports = {
    generateEmbedding,
    cosineSimilarity,
    storeFAQWithEmbedding,
    searchFAQs,
    updateFAQEmbedding,
    regenerateAllEmbeddings
};
