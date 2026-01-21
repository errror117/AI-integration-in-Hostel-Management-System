/**
 * Retrieval Augmented Generation (RAG) Engine
 * Answers queries using FAQ database and optional LLM integration
 */

const { searchFAQs } = require('./embeddingEngine');
const axios = require('axios');

/**
 * Answer query using RAG approach
 * @param {string} query - User question
 * @param {object} options - Configuration options
 * @returns {object} - Answer with source and confidence
 */
async function answerWithRAG(query, options = {}) {
    const {
        useLLM = false,
        llmApiKey = null,
        llmModel = 'gpt-3.5-turbo',
        similarityThreshold = 0.3,
        maxResults = 3
    } = options;

    try {
        // Step 1: Search FAQ database
        const faqResults = await searchFAQs(query, similarityThreshold, maxResults);

        if (faqResults.length === 0) {
            return {
                answer: null,
                confidence: 0,
                source: 'none'
            };
        }

        // Step 2: Get best match
        const bestMatch = faqResults[0];

        // If confidence is very high, return direct answer
        if (bestMatch.similarity > 0.7) {
            // Update view count
            await updateFAQStats(bestMatch.faq._id, 'view');

            return {
                answer: bestMatch.answer,
                confidence: bestMatch.similarity,
                source: 'faq',
                sourceId: bestMatch.faq._id,
                question: bestMatch.question,
                category: bestMatch.category
            };
        }

        // Step 3: Use LLM to refine answer if enabled and available
        if (useLLM && llmApiKey) {
            const llmAnswer = await generateLLMAnswer(query, faqResults, llmApiKey, llmModel);
            if (llmAnswer) {
                return {
                    answer: llmAnswer,
                    confidence: 0.8,
                    source: 'llm_rag',
                    context: faqResults.map(r => r.question)
                };
            }
        }

        // Step 4: Return best FAQ match if LLM not used
        await updateFAQStats(bestMatch.faq._id, 'view');
        return {
            answer: bestMatch.answer,
            confidence: bestMatch.similarity,
            source: 'faq',
            sourceId: bestMatch.faq._id,
            question: bestMatch.question
        };

    } catch (error) {
        console.error('RAG Error:', error);
        return {
            answer: null,
            confidence: 0,
            source: 'error',
            error: error.message
        };
    }
}

/**
 * Generate answer using LLM with context from FAQs
 */
async function generateLLMAnswer(query, faqContext, apiKey, model = 'gpt-3.5-turbo') {
    try {
        const contextText = faqContext
            .map(r => `Q: ${r.question}\nA: ${r.answer}`)
            .join('\n\n');

        const prompt = `You are a helpful hostel management assistant. Use the following FAQ context to answer the user's question. If the context doesn't contain relevant information, say you don't know.

Context:
${contextText}

User Question: ${query}

Answer concisely and helpfully:`;

        // OpenAI API call
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model,
                messages: [
                    { role: 'system', content: 'You are a helpful hostel management assistant.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 150,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('LLM Generation Error:', error.message);
        return null;
    }
}

/**
 * Alternative: Use Google Gemini for LLM
 */
async function generateGeminiAnswer(query, faqContext, apiKey) {
    try {
        const contextText = faqContext
            .map(r => `Q: ${r.question}\nA: ${r.answer}`)
            .join('\n\n');

        const prompt = `Based on this hostel FAQ context:\n\n${contextText}\n\nAnswer: ${query}`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    maxOutputTokens: 150,
                    temperature: 0.7
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            }
        );

        return response.data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error('Gemini Generation Error:', error.message);
        return null;
    }
}

/**
 * Update FAQ usage statistics
 */
async function updateFAQStats(faqId, action = 'view') {
    const FAQEmbedding = require('../../models/FAQEmbedding');

    try {
        const update = action === 'view'
            ? { $inc: { viewCount: 1 } }
            : action === 'helpful'
                ? { $inc: { helpfulCount: 1 } }
                : { $inc: { notHelpfulCount: 1 } };

        await FAQEmbedding.findByIdAndUpdate(faqId, update);
    } catch (error) {
        console.error('Error updating FAQ stats:', error);
    }
}

/**
 * Batch answer multiple queries (for testing)
 */
async function batchAnswerQueries(queries, options = {}) {
    const results = [];
    for (const query of queries) {
        const answer = await answerWithRAG(query, options);
        results.push({ query, ...answer });
    }
    return results;
}

module.exports = {
    answerWithRAG,
    generateLLMAnswer,
    generateGeminiAnswer,
    updateFAQStats,
    batchAnswerQueries
};
