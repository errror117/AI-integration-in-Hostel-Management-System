/**
 * Smart NLP Intent Classifier with Fuzzy Matching & Synonym Recognition
 * Understands natural language variations and typos
 */

const natural = require('natural');
const compromise = require('compromise');

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const metaphone = natural.Metaphone;
const levenshtein = natural.LevenshteinDistance;

// Synonym dictionary - maps various ways of saying things to canonical form
const SYNONYMS = {
    // Complaint-related
    'register': ['submit', 'file', 'create', 'make', 'lodge', 'raise', 'report', 'add', 'new'],
    'complaint': ['issue', 'problem', 'grievance', 'concern', 'trouble', 'complain', 'complaining'],
    'view': ['show', 'see', 'display', 'check', 'get', 'list', 'find', 'tell', 'give', 'what'],
    'my': ['mine', 'i have', 'i got', 'personal'],

    // Status-related
    'pending': ['waiting', 'not done', 'incomplete', 'unresolved', 'open'],
    'resolved': ['done', 'complete', 'fixed', 'solved', 'closed'],

    // Mess-related
    'menu': ['food', 'meals', 'dishes', 'eating', 'breakfast', 'lunch', 'dinner', 'khana'],
    'mess': ['canteen', 'cafeteria', 'dining', 'food hall'],

    // Invoice-related
    'invoice': ['bill', 'payment', 'fee', 'dues', 'charges', 'amount', 'money'],
    'pay': ['paying', 'paid', 'settle', 'clear'],

    // Suggestion-related
    'suggestion': ['recommend', 'recommend', 'idea', 'proposal', 'feedback', 'input'],
    'suggest': ['recommend', 'propose', 'want', 'need', 'should', 'could', 'would be nice'],

    // Common verbs
    'want': ['wanna', 'need', 'require', 'wish', 'like to', 'looking for', 'interested'],
    'help': ['assist', 'support', 'guide', 'aid', 'how to', 'explain'],

    // Greetings
    'hello': ['hi', 'hey', 'hola', 'namaste', 'yo', 'sup', 'hii', 'hiii', 'helo'],
    'bye': ['goodbye', 'see you', 'later', 'tata', 'bye bye', 'cya']
};

// Common spelling mistakes dictionary - maps misspellings to correct words
const SPELL_CORRECTIONS = {
    // Complaint variations
    'complain': 'complaint', 'compaint': 'complaint', 'compliant': 'complaint', 'compalint': 'complaint',
    'complait': 'complaint', 'comlaint': 'complaint', 'complaintt': 'complaint', 'compplaint': 'complaint',
    'cmplaint': 'complaint', 'complaiant': 'complaint', 'complent': 'complaint', 'complant': 'complaint',

    // Register variations
    'registar': 'register', 'regster': 'register', 'regsiter': 'register', 'registor': 'register',
    'rejister': 'register', 'rigister': 'register', 'regisster': 'register', 'registr': 'register',

    // Suggestion variations
    'sugestion': 'suggestion', 'suggeston': 'suggestion', 'suggesion': 'suggestion', 'sugestin': 'suggestion',
    'suggesstion': 'suggestion', 'sugesttion': 'suggestion', 'sugesstion': 'suggestion',

    // Invoice variations
    'invioce': 'invoice', 'invoce': 'invoice', 'invoise': 'invoice', 'invocie': 'invoice',
    'invioice': 'invoice', 'invoicce': 'invoice', 'incoive': 'invoice',

    // Bill variations
    'bil': 'bill', 'bll': 'bill', 'bils': 'bills', 'billls': 'bills',

    // Payment variations
    'payent': 'payment', 'paymnt': 'payment', 'payement': 'payment', 'paymment': 'payment',
    'pyment': 'payment', 'pament': 'payment',

    // Menu variations
    'manu': 'menu', 'menue': 'menu', 'menuu': 'menu', 'mneu': 'menu', 'meun': 'menu',

    // Mess variations
    'mes': 'mess', 'mees': 'mess', 'messs': 'mess',

    // Show variations
    'sho': 'show', 'shwo': 'show', 'shw': 'show', 'shpw': 'show',

    // Hello variations
    'helo': 'hello', 'hllo': 'hello', 'helllo': 'hello', 'hellow': 'hello', 'helloo': 'hello',
    'hii': 'hi', 'hiii': 'hi', 'hiiii': 'hi', 'hy': 'hi', 'hai': 'hi',

    // Help variations
    'hlp': 'help', 'hepl': 'help', 'halp': 'help', 'hep': 'help',

    // Want variations
    'wnat': 'want', 'watn': 'want', 'wan': 'want', 'wannt': 'want', 'wantt': 'want',

    // Attendance variations
    'attendence': 'attendance', 'attandance': 'attendance', 'attendace': 'attendance',
    'attendane': 'attendance', 'atendance': 'attendance', 'attendnce': 'attendance',

    // Emergency variations
    'emergancy': 'emergency', 'emergeny': 'emergency', 'emrgency': 'emergency',
    'emergensy': 'emergency', 'emeregncy': 'emergency',

    // WiFi variations
    'wify': 'wifi', 'wifii': 'wifi', 'wi-fi': 'wifi', 'wiffi': 'wifi',

    // Problem variations
    'problm': 'problem', 'probem': 'problem', 'probelm': 'problem', 'porblem': 'problem',

    // Issue variations
    'isue': 'issue', 'isseu': 'issue', 'isssue': 'issue', 'isuue': 'issue',

    // Today variations
    'tody': 'today', 'todya': 'today', 'toady': 'today', 'todday': 'today',

    // Food variations
    'fod': 'food', 'fodd': 'food', 'foof': 'food', 'foood': 'food',

    // Fee variations
    'fes': 'fee', 'fees': 'fee', 'feee': 'fee',

    // Dues variations
    'due': 'dues', 'duess': 'dues', 'duues': 'dues'
};

// Smart phrase patterns - understands natural sentences
const SMART_PATTERNS = {
    REGISTER_COMPLAINT: [
        /i (want|wanna|need|would like) to (register|file|submit|make|lodge|raise|report) (a |an |my )?(complaint|issue|problem|grievance)/i,
        /(register|file|submit|make|lodge|raise|report) (a |an |my )?(new )?(complaint|issue|problem)/i,
        /there (is|s) (a |an )?(problem|issue) (with|in)/i,
        /(something|my|the) .+ (is |are )?(not working|broken|damaged|faulty)/i,
        /can (i|you) (report|file|submit) (a |an )?(complaint|issue|problem)/i,
        /i have (a |an )?(complaint|issue|problem|grievance)/i,
        /how (do i|can i|to) (file|register|submit|make) (a )?(complaint|issue)/i
    ],
    MY_COMPLAINTS: [
        /(show|see|view|check|get|list|display|tell) (me )?(my |all )?(complaints?|issues?|problems?)/i,
        /what (are |is )(my )?(complaints?|issues?|problems?)/i,
        /(my|all) (complaints?|issues?|problems?)( status| list)?/i,
        /i (want|wanna|need) to (see|view|check) (my )?(complaints?|issues?)/i,
        /(complaints?|issues?) (i have |i made |i filed |i submitted )/i,
        /track (my )?(complaint|issue)/i
    ],
    SUBMIT_SUGGESTION: [
        /i (want|wanna|have|got) (to |a )?(suggestion|recommend|idea|proposal)/i,
        /(make|submit|give|provide) (a |an |my )?(suggestion|recommendation|idea)/i,
        /can (i|you) (suggest|recommend)/i,
        /(it would be|would be) (nice|good|great|better) (if|to)/i,
        /you (should|could|must) (add|have|provide|give)/i,
        /i (think|feel|believe) (you should|we need|there should be)/i
    ],
    VIEW_SUGGESTIONS: [
        /(show|see|view|check|get|list) (my |all )?(suggestions?|ideas?|recommendations?)/i,
        /my suggestions?/i
    ],
    MESS_INFO: [
        /(what|whats|what's) (is |are )?(the )?(mess |today's? |today )?(menu|food|meal)/i,
        /(today|todays|today's) (menu|food|meal|mess)/i,
        /what (to|can i) eat/i,
        /(show|tell|give) (me )?(the )?(menu|food|meal)/i,
        /(breakfast|lunch|dinner) (menu|today|timing)/i,
        /mess (menu|food|timing|schedule)/i,
        /food (menu|today)/i
    ],
    MY_INVOICES: [
        /(show|see|view|check|get|my) (my |all )?(invoice|bill|dues|payment|fee)/i,
        /(what|how much) (are |is )?(my )?(dues|pending|fee|payment|bill)/i,
        /i (want|need) to (pay|see|check) (my )?(bill|dues|fee)/i,
        /(pending|unpaid) (payment|bill|invoice|fee|amount)/i,
        /hostel fee/i
    ],
    GREETING: [
        /^(hi+|hello+|hey+|namaste|hola|yo|sup|good (morning|afternoon|evening))$/i,
        /^(hi+|hello+|hey+).{0,10}$/i
    ],
    HELP: [
        /(what can you do|help me|guide|assist|how does this work|features|commands)/i,
        /^help$/i,
        /show (me )?(help|options|menu|commands)/i
    ],
    WIFI_INFO: [
        /wifi (password|info|problem|not working|slow)/i,
        /internet (not working|slow|password|problem)/i,
        /network (issue|problem|password)/i,
        /(what is|whats) (the )?(wifi |internet )password/i
    ],
    EMERGENCY: [
        /(emergency|urgent|help me|danger|fire|ambulance|doctor|hospital|police)/i,
        /i need (help|doctor|ambulance) (urgently|now|immediately)/i
    ],
    ATTENDANCE: [
        /(my |show |check )?(attendance|present|absent)/i,
        /(how many|what) (days|times) (was i |am i )?(present|absent)/i
    ],
    MESS_OFF: [
        /mess off/i,
        /(skip|leave|no) (mess|food|meal)/i,
        /not eating (today|tomorrow|this week)/i,
        /going (home|out)/i
    ],
    GYM_INFO: [
        /gym (timing|hours|open|info|facilities)/i,
        /(workout|exercise|fitness) (room|center|facilities)/i
    ],
    LAUNDRY_INFO: [
        /laundry (service|timing|room|machine)/i,
        /(wash|washing) (clothes|machine)/i
    ],
    VISITOR_POLICY: [
        /(visitor|guest|parents|friend) (policy|rules|timing|allowed|entry)/i,
        /visiting (hours|rules|policy)/i,
        /can (i|my) (bring|have) (guests|visitors|friends|parents)/i
    ],
    CONTACT_STAFF: [
        /(warden|admin|staff|office|reception|security) (number|contact|phone)/i,
        /(call|contact|reach) (the )?(warden|admin|staff)/i,
        /who (to|do i) (call|contact)/i
    ],
    BYE: [
        /^(bye+|goodbye|see you|later|thanks bye|thank you bye|cya|tata)$/i
    ],
    THANKS: [
        /^(thanks?|thank you|thx|ty|appreciated|great|awesome|perfect)$/i,
        /thanks (a lot|so much)/i
    ]
};

// Expanded Intents with keywords
const INTENTS = {
    GREETING: {
        keywords: ['hi', 'hello', 'hey', 'namaste', 'hola', 'good morning', 'good evening', 'sup', 'yo', 'start'],
        weight: 1.0
    },
    BYE: {
        keywords: ['bye', 'goodbye', 'see you', 'cya', 'later', 'take care', 'quit', 'exit'],
        weight: 1.0
    },
    THANKS: {
        keywords: ['thanks', 'thank you', 'thx', 'ty', 'appreciated'],
        weight: 1.0
    },
    HELP: {
        keywords: ['help', 'features', 'what can you do', 'guide', 'assist', 'support', 'commands', 'menu', 'options'],
        weight: 1.0
    },
    MY_ROOM: {
        keywords: ['my room', 'room details', 'room info', 'where do i live', 'my accommodation', 'room number'],
        weight: 1.2
    },
    VACANCY: {
        keywords: ['vacancy', 'empty rooms', 'available rooms', 'book room', 'free rooms', 'check availability'],
        weight: 1.2
    },
    MESS_INFO: {
        keywords: ['mess', 'menu', 'food', 'breakfast', 'lunch', 'dinner', 'eating', 'meal', 'today menu', 'what to eat', 'khana'],
        weight: 1.0
    },
    REGISTER_COMPLAINT: {
        keywords: ['register complaint', 'file complaint', 'submit complaint', 'make complaint', 'lodge complaint',
            'new complaint', 'complain', 'not working', 'broken', 'issue', 'problem', 'fault', 'dirty',
            'leak', 'fix', 'repair', 'damaged', 'i have a complaint', 'i want to complain'],
        weight: 1.3
    },
    MY_COMPLAINTS: {
        keywords: ['my complaints', 'show complaints', 'view complaints', 'track complaint', 'complaint status',
            'see complaints', 'list complaints', 'check complaints', 'complaints i filed', 'complaints i made'],
        weight: 1.5
    },
    MY_INVOICES: {
        keywords: ['invoice', 'bill', 'payment', 'fee', 'dues', 'pending payment', 'my invoice', 'hostel fee',
            'my bill', 'my dues', 'how much due', 'pending amount'],
        weight: 1.2
    },
    LATE_NIGHT_PERMISSION: {
        keywords: ['late night', 'gate pass', 'permission', 'going out', 'outing', 'leave hostel', 'night out'],
        weight: 1.2
    },
    LEAVE_REQUEST: {
        keywords: ['leave', 'going home', 'vacation', 'weekend leave', 'long leave', 'absence', 'leave request'],
        weight: 1.2
    },
    MESS_OFF: {
        keywords: ['mess off', 'skip mess', 'not eating', 'mess absence', 'food leave', 'no food'],
        weight: 1.2
    },
    WIFI_INFO: {
        keywords: ['wifi', 'internet', 'slow net', 'wifi password', 'connection', 'network', 'net not working'],
        weight: 1.1
    },
    LAUNDRY_INFO: {
        keywords: ['laundry', 'washing', 'clothes', 'wash', 'dry cleaning', 'washer', 'washing machine'],
        weight: 1.1
    },
    GYM_INFO: {
        keywords: ['gym', 'workout', 'fitness', 'sports', 'exercise', 'treadmill', 'weights', 'gym timing'],
        weight: 1.1
    },
    CLEANING_REQUEST: {
        keywords: ['clean room', 'housekeeping', 'dustbin', 'sweeping', 'mop', 'trash', 'garbage', 'room cleaning'],
        weight: 1.3
    },
    VISITOR_POLICY: {
        keywords: ['visitor', 'guest', 'parents', 'friend', 'allowed', 'entry', 'visiting hour', 'can i bring'],
        weight: 1.1
    },
    EMERGENCY: {
        keywords: ['emergency', 'ambulance', 'doctor', 'hospital', 'fire', 'police', 'help me', 'danger', 'urgent'],
        weight: 2.0
    },
    FEEDBACK: {
        keywords: ['feedback', 'rating', 'review', 'comment'],
        weight: 1.1
    },
    SUBMIT_SUGGESTION: {
        keywords: ['suggestion', 'suggest', 'improve', 'request', 'want', 'need', 'should have', 'would be nice',
            'i have a suggestion', 'my suggestion', 'idea', 'recommend'],
        weight: 1.3
    },
    VIEW_SUGGESTIONS: {
        keywords: ['my suggestions', 'show suggestions', 'view suggestions', 'see suggestions'],
        weight: 1.4
    },
    ATTENDANCE: {
        keywords: ['my attendance', 'show attendance', 'attendance record', 'present days', 'absent days'],
        weight: 1.2
    },
    CONTACT_STAFF: {
        keywords: ['warden', 'contact', 'number', 'call', 'admin', 'office', 'reception', 'security', 'warden number'],
        weight: 1.1
    },
    PROFANITY: {
        keywords: ['stupid', 'idiot', 'useless', 'dumb', 'worst', 'terrible', 'rubbish', 'crap', 'fuck', 'shit'],
        weight: 2.0
    },
    YES: { keywords: ['yes', 'yeah', 'sure', 'yep', 'okay', 'correct', 'yup', 'ya', 'haan', 'ok'], weight: 1.0 },
    NO: { keywords: ['no', 'nope', 'cancel', 'nah', 'incorrect', 'na', 'nahi'], weight: 1.0 }
};

/**
 * Correct spelling mistakes in query
 */
function correctSpelling(query) {
    const tokens = query.toLowerCase().split(/\s+/);
    const correctedTokens = tokens.map(token => {
        // First check direct spelling corrections
        if (SPELL_CORRECTIONS[token]) {
            return SPELL_CORRECTIONS[token];
        }

        // Then check for fuzzy matches against common words
        const importantWords = Object.keys(SPELL_CORRECTIONS);
        for (const word of importantWords) {
            if (token.length > 2 && levenshtein(token, word) <= 2) {
                return SPELL_CORRECTIONS[word] || word;
            }
        }

        // Also check against target words
        const targetWords = ['complaint', 'invoice', 'suggestion', 'menu', 'mess', 'help',
            'payment', 'register', 'show', 'attendance', 'emergency', 'wifi'];
        for (const target of targetWords) {
            if (token.length > 2 && levenshtein(token, target) <= 2) {
                return target;
            }
        }

        return token;
    });

    return correctedTokens.join(' ');
}

/**
 * Expand query with synonyms to improve matching
 */
function expandWithSynonyms(query) {
    // First correct spelling
    let corrected = correctSpelling(query);
    let expanded = corrected.toLowerCase();

    for (const [canonical, synonyms] of Object.entries(SYNONYMS)) {
        for (const syn of synonyms) {
            if (expanded.includes(syn)) {
                expanded += ` ${canonical}`;
            }
        }
    }

    return expanded;
}

/**
 * Fuzzy match - find similar words (handles typos)
 */
function fuzzyMatch(word, target, threshold = 2) {
    if (word.length < 3 || target.length < 3) return word === target;

    // Use Levenshtein distance for typo tolerance
    const distance = levenshtein(word, target);
    const maxLen = Math.max(word.length, target.length);

    // Allow typos based on word length
    const allowedDistance = Math.floor(maxLen / 4) + 1;
    return distance <= Math.min(threshold, allowedDistance);
}

/**
 * Check if query matches any smart pattern
 */
function matchSmartPatterns(query) {
    for (const [intent, patterns] of Object.entries(SMART_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(query)) {
                return { intent, confidence: 0.95, matchType: 'smart_pattern' };
            }
        }
    }
    return null;
}

/**
 * Smart Intent Classification
 */
function classifyIntent(query) {
    const originalQuery = query;
    const lowerQuery = query.toLowerCase().trim();

    // Apply spell correction first
    const correctedQuery = correctSpelling(lowerQuery);
    const tokens = tokenizer.tokenize(correctedQuery);

    if (!tokens || tokens.length === 0) {
        return { intent: 'UNKNOWN', confidence: 0, matchType: 'none' };
    }

    // Check profanity first
    if (INTENTS.PROFANITY.keywords.some(word => correctedQuery.includes(word))) {
        return { intent: 'PROFANITY', confidence: 1.0, matchType: 'profanity' };
    }

    // Try smart pattern matching with corrected query (highest accuracy)
    const patternMatch = matchSmartPatterns(correctedQuery);
    if (patternMatch) {
        return { ...patternMatch, correctedQuery: correctedQuery !== lowerQuery ? correctedQuery : undefined };
    }

    // Expand query with synonyms (also applies spell correction internally)
    const expandedQuery = expandWithSynonyms(correctedQuery);

    const scores = {};

    for (const [intent, config] of Object.entries(INTENTS)) {
        if (intent === 'PROFANITY') continue;
        if (!config.keywords) continue;

        let score = 0;

        // Exact keyword matching
        const exactMatches = config.keywords.filter(keyword =>
            expandedQuery.includes(keyword.toLowerCase())
        ).length;
        score += exactMatches * 2 * config.weight;

        // Fuzzy keyword matching (typo tolerance)
        for (const keyword of config.keywords) {
            const keywordTokens = tokenizer.tokenize(keyword.toLowerCase());
            for (const token of tokens) {
                for (const kwToken of keywordTokens) {
                    if (fuzzyMatch(token, kwToken)) {
                        score += 0.5 * config.weight;
                    }
                }
            }
        }

        // Phonetic matching (sounds similar)
        const queryPhonetic = metaphone.process(lowerQuery);
        for (const keyword of config.keywords) {
            const keywordPhonetic = metaphone.process(keyword);
            if (queryPhonetic.includes(keywordPhonetic) || keywordPhonetic.includes(queryPhonetic)) {
                score += 0.3 * config.weight;
            }
        }

        if (score > 0) {
            scores[intent] = score;
        }
    }

    let bestIntent = 'UNKNOWN';
    let maxScore = 0;

    for (const [intent, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestIntent = intent;
        }
    }

    let confidence = 0;
    if (maxScore > 0) {
        const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
        confidence = Math.min(0.9, maxScore / (totalScore + 0.1));
    }

    return {
        intent: bestIntent,
        confidence,
        matchType: maxScore > 0 ? 'keyword_fuzzy' : 'none',
        expandedQuery: expandedQuery !== lowerQuery ? expandedQuery : undefined
    };
}

/**
 * Enhanced entity extraction
 */
function extractEntities(text, intent) {
    const lowerQuery = text.toLowerCase();
    const entities = {};
    const doc = compromise(text);

    // Date extraction
    try {
        const dateMatches = doc.match('#Date+').out('array');
        if (dateMatches.length > 0) entities.date = dateMatches[0];
        else {
            if (lowerQuery.includes('today')) entities.date = 'today';
            else if (lowerQuery.includes('tomorrow')) entities.date = 'tomorrow';
            else if (lowerQuery.includes('yesterday')) entities.date = 'yesterday';
        }
    } catch (e) { }

    // Number extraction
    const numbers = doc.numbers().out('array');
    if (numbers.length > 0) entities.numbers = numbers;

    // Complaint type detection
    if (intent === 'REGISTER_COMPLAINT' || intent === 'CLEANING_REQUEST') {
        const typeMap = {
            'wifi': 'Electric', 'internet': 'Electric', 'network': 'Electric',
            'electric': 'Electric', 'light': 'Electric', 'fan': 'Electric', 'ac': 'Electric',
            'food': 'Others', 'mess': 'Others', 'meal': 'Others',
            'clean': 'Cleaning', 'dirty': 'Cleaning', 'garbage': 'Cleaning', 'dust': 'Cleaning',
            'plumb': 'Others', 'water': 'Others', 'leak': 'Others', 'tap': 'Others',
            'furniture': 'Furniture', 'chair': 'Furniture', 'table': 'Furniture', 'bed': 'Furniture', 'cupboard': 'Furniture'
        };

        for (const [keyword, type] of Object.entries(typeMap)) {
            if (lowerQuery.includes(keyword)) {
                entities.type = type;
                entities.specificType = keyword;
                break;
            }
        }

        if (lowerQuery.includes('urgent') || lowerQuery.includes('emergency') || lowerQuery.includes('fire')) {
            entities.isUrgent = true;
        }
    }

    return entities;
}

/**
 * Simple Sentiment Analysis
 */
function analyzeSentiment(query) {
    const positive = ['good', 'great', 'thanks', 'happy', 'cool', 'nice', 'excellent', 'awesome', 'perfect', 'love'];
    const negative = ['bad', 'worst', 'broken', 'slow', 'hate', 'terrible', 'awful', 'horrible', 'frustrated', 'angry'];

    let score = 0;
    query.toLowerCase().split(' ').forEach(w => {
        if (positive.includes(w)) score++;
        if (negative.includes(w)) score--;
    });

    return {
        sentiment: score > 0 ? 'positive' : (score < 0 ? 'negative' : 'neutral'),
        score
    };
}

/**
 * Calculate complaint priority
 */
function calculateComplaintPriority(desc, sentiment, entities) {
    let score = 50;
    if (sentiment.sentiment === 'negative') score += 20;
    if (entities.isUrgent) score += 30;
    if (desc.toLowerCase().includes('fire') || desc.toLowerCase().includes('flood')) score += 40;
    return {
        aiPriorityScore: Math.min(100, score),
        urgencyLevel: score > 70 ? 'high' : (score > 50 ? 'medium' : 'low')
    };
}

/**
 * Get similar suggestions if intent is unknown
 */
function getSuggestions(query) {
    const suggestions = [];
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('complaint') || lowerQuery.includes('issue') || lowerQuery.includes('problem')) {
        suggestions.push('To register a complaint, say: "I want to register a complaint"');
        suggestions.push('To view your complaints, say: "Show my complaints"');
    }
    if (lowerQuery.includes('suggest') || lowerQuery.includes('idea')) {
        suggestions.push('To submit a suggestion, say: "I have a suggestion"');
    }
    if (lowerQuery.includes('pay') || lowerQuery.includes('fee') || lowerQuery.includes('bill')) {
        suggestions.push('To view invoices, say: "Show my invoices"');
    }

    return suggestions;
}

module.exports = {
    classifyIntent,
    extractEntities,
    analyzeSentiment,
    calculateComplaintPriority,
    getSuggestions,
    INTENTS,
    SMART_PATTERNS
};
