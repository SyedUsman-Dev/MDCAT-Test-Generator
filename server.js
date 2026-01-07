// server.js - MDCAT Past Paper Generator with FIXED Topic/Subject Generation
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Polyfill fetch for Node < 18
let fetchFn = global.fetch;
if (typeof fetchFn !== 'function') {
  fetchFn = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}
const fetch = fetchFn;

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Validate required environment variables
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is required but not found in environment variables');
    if (process.env.NODE_ENV !== 'test') process.exit(1);
}

// Constants for MDCAT 2025 Official Syllabus - EXACT TOPICS FROM PM&DC CURRICULUM
const MDCAT_SYLLABUS = {
  biology: { 
    percentage: 0.45, 
    topics: [
      'Acellular Life (Viruses, AIDS and HIV)',
      'Bioenergetics (Respiration)',
      'Biological Molecules (Carbohydrates, Proteins, Lipids, DNA, RNA)',
      'Cell Structure & Function (Prokaryotic vs Eukaryotic, Organelles, Chromosomes)',
      'Coordination & Control (Receptors, Neurons, Brain, Nervous System)',
      'Enzymes (Enzyme Action, Factors Affecting Enzymes, Inhibitors)',
      'Evolution (Lamarckism, Darwinism, Natural Selection)',
      'Reproduction (Human Reproductive System, Menstrual Cycle, STDs)',
      'Support & Movement (Human Skeleton, Muscles, Joints, Arthritis)',
      'Inheritance (Mendel\'s Laws, Gene Linkage, X-linked Inheritance, Hemophilia)',
      'Circulation (Human Heart, Cardiac Cycle, Blood Vessels, Lymphatic System)',
      'Immunity (Specific Defense Mechanisms)',
      'Respiration (Human Respiratory System, Mechanism of Breathing)',
      'Homeostasis (Osmoregulation, Excretion, Kidney Structure & Function)',
      'Ecosystems (Food Chains, Energy Flow, Carbon and Nitrogen Cycles)'
    ]
  },
  chemistry: { 
    percentage: 0.25, 
    topics: [
      'Atomic Structure (Electron Configuration, Quantum Numbers)',
      'Chemical Bonding (Ionic, Covalent, Metallic Bonds)',
      'Electrochemistry (Electrolysis, Faraday\'s Laws)',
      'Chemical Equilibria (Le Chatelier\'s Principle, Equilibrium Constants)',
      'Reaction Kinetics (Rate Laws, Activation Energy, Catalysts)',
      'Acids & Bases (pH, Buffer Solutions, Neutralization)',
      'Periodic Table & Periodicity (Groups, Periods, Trends)',
      'Organic Chemistry (Functional Groups, Reactions, IUPAC Nomenclature)',
      'States of Matter (Gas Laws, Intermolecular Forces)',
      'Solutions (Solubility, Concentration, Colligative Properties)',
      'Thermochemistry (Enthalpy, Entropy, Free Energy)',
      'Nuclear Chemistry (Radioactivity, Half-Life, Nuclear Reactions)',
      'Analytical Chemistry (Chromatography, Spectroscopy)',
      'Transition Elements (Properties, Complex Compounds)',
      'Hydrocarbons (Alkanes, Alkenes, Alkynes)'
    ]
  },
  physics: { 
    percentage: 0.20, 
    topics: [
      'Kinematics (Displacement, Velocity, Acceleration, Equations of Motion)',
      'Dynamics (Newton\'s Laws, Forces, Friction)',
      'Work, Energy & Power (Conservation of Energy, Work-Energy Theorem)',
      'Circular Motion & Gravitation (Centripetal Force, Kepler\'s Laws)',
      'Waves (Types, Properties, Standing Waves, Doppler Effect)',
      'Optics (Reflection, Refraction, Lenses, Optical Instruments)',
      'Thermodynamics (Laws, Heat Transfer, Thermal Properties)',
      'Electrostatics (Coulomb\'s Law, Electric Field, Potential)',
      'Current Electricity (Ohm\'s Law, Circuits, Resistance)',
      'Magnetism (Magnetic Fields, Electromagnetism, Faraday\'s Law)',
      'Modern Physics (Quantum Theory, Photoelectric Effect)',
      'Nuclear Physics (Nuclear Stability, Radioactive Decay)',
      'Electronics (Semiconductors, Logic Gates, Digital Systems)',
      'Fluid Mechanics (Pressure, Buoyancy, Bernoulli\'s Principle)',
      'Electromagnetic Waves (Spectrum, Properties, Applications)'
    ]
  },
  english: { 
    percentage: 0.05, 
    topics: [
      'Parts of Speech (Nouns, Pronouns, Verbs, Adjectives)',
      'Tenses (Past, Present, Future Forms)',
      'Conditionals (Zero, First, Second, Third)',
      'Articles (Definite, Indefinite)',
      'Infinitives and Infinitive Phrases',
      'Gerunds and Gerund Phrases',
      'Adverbs (Position and Types)',
      'Prepositions (Position, Time, Movement, Direction)',
      'Punctuation Marks',
      'Sentence Structure and Clauses',
      'Active and Passive Voice',
      'Direct and Indirect Speech',
      'Subject-Verb Agreement',
      'Sentence Errors and Corrections'
    ]
  },
  logical: { 
    percentage: 0.05, 
    topics: [
      'Critical Thinking (Logical Arguments, Truth vs Falsehood)',
      'Letter and Symbols Series (Arithmetical, Geometrical Progressions)',
      'Logical Deductions (Structured Thinking, Relations)',
      'Logical Problems (Puzzles, Deductive Reasoning)',
      'Course of Action (Administrative Decisions, Problem Solving)',
      'Cause and Effect (Relationships, Reasoning)'
    ]
  }
};

const UNIVERSITIES = ['UHS', 'KMU', 'DUHS', 'BUMHS', 'NUMS'];

// Updated Gemini API URL for 2.5-flash model
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// -------------------- Utility Functions (Define First) --------------------

// Calculate subject distribution based on question count
function calculateDistribution(total) {
  const biology = Math.floor(total * MDCAT_SYLLABUS.biology.percentage);
  const chemistry = Math.floor(total * MDCAT_SYLLABUS.chemistry.percentage);
  const physics = Math.floor(total * MDCAT_SYLLABUS.physics.percentage);
  const english = Math.floor(total * MDCAT_SYLLABUS.english.percentage);
  const logical = Math.floor(total * MDCAT_SYLLABUS.logical.percentage);
  
  const currentSum = biology + chemistry + physics + english + logical;
  const remaining = total - currentSum;
  
  let result = { biology, chemistry, physics, english, logical };
  
  if (remaining > 0) {
    const priorities = ['biology', 'chemistry', 'physics', 'english', 'logical'];
    for (let i = 0; i < remaining; i++) {
      result[priorities[i % priorities.length]]++;
    }
  }
  
  console.log(`📊 Distribution for ${total} questions:`, result);
  console.log(`📊 Total distributed: ${Object.values(result).reduce((a, b) => a + b, 0)}`);
  
  return result;
}

// Add IDs to questions for tracking
function addIds(questions) {
  return questions.map((q, i) => ({ ...q, id: i + 1 }));
}

// Check if topic is in official syllabus
function isTopicInOfficialSyllabus(topic) {
  if (!topic) return false;
  const lcTopic = topic.toLowerCase();
  for (const subj of Object.values(MDCAT_SYLLABUS)) {
    for (const t of subj.topics) {
      if (t.toLowerCase().includes(lcTopic) || lcTopic.includes(t.toLowerCase())) {
        return true;
      }
    }
  }
  return false;
}

// Find which subject a topic belongs to
function findTopicSubject(topic) {
  if (!topic) return null;
  const lcTopic = topic.toLowerCase();
  
  for (const [subjectKey, subjectInfo] of Object.entries(MDCAT_SYLLABUS)) {
    for (const t of subjectInfo.topics) {
      if (t.toLowerCase().includes(lcTopic) || lcTopic.includes(t.toLowerCase())) {
        // Return proper subject name
        return subjectKey.charAt(0).toUpperCase() + subjectKey.slice(1);
      }
    }
  }
  return null;
}

// Normalize year range
function normalizeYearRange(yearRange) {
  if (!yearRange || yearRange === 'all') return null;
  
  if (yearRange === 'recent') {
    return { start: 2020, end: 2025 };
  }
  
  if (yearRange === '2010s') {
    return { start: 2010, end: 2019 };
  }
  
  if (yearRange === '2020s') {
    return { start: 2020, end: 2025 };
  }
  
  if (typeof yearRange === 'object' && yearRange.start && yearRange.end) {
    return { start: Number(yearRange.start), end: Number(yearRange.end) };
  }
  
  return { start: 2020, end: 2025 };
}

// Get random year within range
function getRandomYear(yearRange) {
  const yrs = normalizeYearRange(yearRange);
  if (!yrs) {
    // Return random year between 2018-2025 for variety
    return Math.floor(Math.random() * (2025 - 2018 + 1)) + 2018;
  }
  return Math.floor(Math.random() * (yrs.end - yrs.start + 1)) + yrs.start;
}

// Enhanced validation with better error messages
function validateAndFilterQuestions(questions, requestedCount) {
  if (!Array.isArray(questions)) {
    console.error('❌ Questions is not an array:', typeof questions);
    return [];
  }

  if (questions.length === 0) {
    console.error('❌ No questions provided');
    return [];
  }

  console.log(`🔍 Validating ${questions.length} questions (requested: ${requestedCount})`);

  const validQuestions = questions.filter((q, index) => {
    try {
      if (!q || typeof q !== 'object') {
        console.error(`❌ Question ${index + 1}: Not an object`);
        return false;
      }

      const requiredFields = ['question', 'options', 'answer', 'subject'];
      for (const field of requiredFields) {
        if (!q.hasOwnProperty(field)) {
          console.error(`❌ Question ${index + 1}: Missing ${field}`);
          return false;
        }
      }

      if (typeof q.question !== 'string' || q.question.length < 10) {
        console.error(`❌ Question ${index + 1}: Invalid question text`);
        return false;
      }

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        console.error(`❌ Question ${index + 1}: Invalid options array`);
        return false;
      }

      for (let i = 0; i < q.options.length; i++) {
        if (typeof q.options[i] !== 'string' || q.options[i].length === 0) {
          console.error(`❌ Question ${index + 1}: Invalid option ${i + 1}`);
          return false;
        }
      }

      if (!['A', 'B', 'C', 'D'].includes(q.answer)) {
        console.error(`❌ Question ${index + 1}: Invalid answer "${q.answer}"`);
        return false;
      }

      if (typeof q.subject !== 'string') {
        console.error(`❌ Question ${index + 1}: Invalid subject`);
        return false;
      }

      return true;
    } catch (validationError) {
      console.error(`❌ Question ${index + 1} validation error:`, validationError.message);
      return false;
    }
  });

  console.log(`✅ Validated ${validQuestions.length}/${questions.length} questions`);
  return validQuestions;
}

// -------------------- FIXED: Prompt Building Function --------------------

function buildPrompt({ testFormat, selectedSubject, topic, questionCount, source, yearRange, difficulty }) {
  const yrs = normalizeYearRange(yearRange);
  const yearText = yrs ? `Questions should simulate papers from ${yrs.start}-${yrs.end} period.` : 
                        'Include variety from different years (2018-2025) for authenticity.';

  let difficultyText = '';
  if (difficulty === 'mixed') {
    difficultyText = 'Use difficulty distribution: 15% easy, 70% moderate, 15% difficult.';
  } else if (difficulty === 'easy') {
    difficultyText = 'Generate EASY level questions only - basic concepts and definitions.';
  } else if (difficulty === 'moderate') {
    difficultyText = 'Generate MODERATE level questions only - application of concepts.';
  } else if (difficulty === 'difficult') {
    difficultyText = 'Generate DIFFICULT level questions only - complex analysis and synthesis.';
  }

  let topicsBlock = '';
  let scopeText = '';

  // FIXED: Better logic for different test formats
  if (testFormat === 'full-test') {
    scopeText = 'Generate a COMPLETE MDCAT test with exact subject distribution:';
    const distribution = calculateDistribution(questionCount);
    
    topicsBlock = `
Subject Distribution (MUST generate EXACTLY these numbers - total must equal ${questionCount}):
- Biology: EXACTLY ${distribution.biology} questions
- Chemistry: EXACTLY ${distribution.chemistry} questions  
- Physics: EXACTLY ${distribution.physics} questions
- English: EXACTLY ${distribution.english} questions
- Logical Reasoning: EXACTLY ${distribution.logical} questions

CRITICAL ORDERING: Generate questions in this SEQUENTIAL ORDER:
1. ALL Biology questions first (${distribution.biology} questions)
2. ALL Chemistry questions second (${distribution.chemistry} questions)
3. ALL Physics questions third (${distribution.physics} questions)
4. ALL English questions fourth (${distribution.english} questions)
5. ALL Logical Reasoning questions last (${distribution.logical} questions)`;

  } else if (testFormat === 'topic-test' && topic) {
    // FIXED: Topic-specific generation
    const relatedSubject = findTopicSubject(topic);
    const subjectForTopic = relatedSubject || selectedSubject || 'Biology';
    
    scopeText = `Generate questions EXCLUSIVELY for the SPECIFIC TOPIC: "${topic}"`;
    topicsBlock = `
TOPIC FOCUS INSTRUCTIONS:
- Generate ALL ${questionCount} questions about: "${topic}"
- Subject context: ${subjectForTopic}
- NO other topics allowed
- ALL questions must be directly related to: "${topic}"
- Use only concepts, terms, and examples from: "${topic}"
- Question variety: definitions, applications, comparisons, analysis within "${topic}"`;

  } else if (testFormat === 'subject-test' && selectedSubject) {
    // FIXED: Subject-specific generation  
    const subjectInfo = MDCAT_SYLLABUS[selectedSubject.toLowerCase()];
    if (!subjectInfo) {
      throw new Error(`Invalid subject: ${selectedSubject}`);
    }
    
    scopeText = `Generate questions for ${selectedSubject} subject ONLY. ALL ${questionCount} questions must be ${selectedSubject}.`;
    topicsBlock = `
SUBJECT FOCUS INSTRUCTIONS:
- Generate ALL ${questionCount} questions from ${selectedSubject} ONLY
- NO questions from other subjects
- Distribute questions across these ${selectedSubject} topics: ${subjectInfo.topics.join(', ')}
- Ensure variety within ${selectedSubject} topics
- ALL questions must have subject: "${selectedSubject}"`;
    
  } else {
    // Default fallback
    scopeText = `Generate mixed MDCAT questions covering various subjects.`;
    topicsBlock = `Cover topics from Biology, Chemistry, Physics, English, and Logical Reasoning.`;
  }

  const uniText = source && source !== 'all' ? `Style questions similar to ${source} past papers.` : 
                                              'Use authentic MDCAT past paper style questions.';

  const schema = `
RESPONSE FORMAT: Return ONLY a valid JSON array. No markdown, no explanations, no code blocks.

Required JSON Structure:
[
  {
    "question": "Complete question text with all necessary details",
    "options": ["First option text", "Second option text", "Third option text", "Fourth option text"],
    "answer": "A",
    "explanation": "Detailed explanation of correct answer and why others are incorrect",
    "subject": "Biology|Chemistry|Physics|English|Logical Reasoning",
    "topic": "Specific topic from official PM&DC syllabus",
    "difficulty": "easy|moderate|difficult",
    "year": 2024,
    "source": "${source || 'MDCAT'}"
  }
]

STRICT VALIDATION REQUIREMENTS:
- Generate EXACTLY ${questionCount} questions (no more, no less)
- Each question must have exactly 4 options (no A), B), C), D) prefixes in options array)
- Answer must be exactly one of: "A", "B", "C", "D"
- All fields are mandatory except "topic" which can be general
- Questions must be medically/scientifically accurate and current
- English questions: Grammar/syntax only (no literature/comprehension)
- Use proper JSON escaping for quotes and special characters
- ${testFormat === 'topic-test' ? `ALL questions must be about topic: "${topic}"` : ''}
- ${testFormat === 'subject-test' ? `ALL questions must be from subject: "${selectedSubject}"` : ''}`;

  return `
You are an expert MDCAT Past Paper Generator. Create exactly ${questionCount} authentic multiple-choice questions.

${scopeText}
${topicsBlock}

GENERATION REQUIREMENTS:
1. Generate EXACTLY ${questionCount} questions in valid JSON array format
2. Each question must have 4 options and 1 correct answer
3. Include detailed explanations for every answer
4. Questions must be from official PM&DC 2025 syllabus topics
5. Ensure medical/scientific accuracy and currency
6. For full tests: Follow strict sequential subject ordering
7. For topic tests: ALL questions must be about the specified topic ONLY
8. For subject tests: ALL questions must be from the specified subject ONLY
9. Maintain authentic MDCAT difficulty and style

${difficultyText}
${yearText}
${uniText}

${schema}

Generate the questions now:`;
}

// -------------------- API Functions --------------------

// Enhanced Gemini API call with better error handling
async function callGeminiAPI(prompt) {
  try {
    if (process.env.NODE_ENV === 'test') {
      console.log('🧪 Test mode: Returning mock questions');
      return [
        {
          question: "Which of the following is the powerhouse of the cell?",
          options: ["Nucleus", "Mitochondria", "Ribosome", "Endoplasmic reticulum"],
          answer: "B",
          explanation: "Mitochondria are called the powerhouse of the cell because they produce ATP through cellular respiration.",
          subject: "Biology",
          topic: "Cell Structure & Function",
          difficulty: "moderate",
          year: 2024,
          source: "test"
        }
      ];
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required but not configured');
    }

    console.log('🤖 Calling Gemini 2.5-flash API...');
    
    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1, // Lower for more consistent topic/subject adherence
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json'
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ]
    };

    const apiUrl = `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API request failed with status ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error && errorData.error.message) {
          errorMessage = `Gemini API error: ${errorData.error.message}`;
        }
      } catch (e) {
        errorMessage = `Gemini API error: ${errorText.substring(0, 200)}`;
      }
      
      console.error(`❌ API Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts?.[0]?.text || '';
    if (!generatedText) {
      throw new Error('Empty response from Gemini API');
    }

    // Enhanced JSON parsing
    try {
      const parsed = JSON.parse(generatedText);
      const result = Array.isArray(parsed) ? parsed : [];
      
      // Add random years for variety if not present
      return result.map(q => ({
        ...q,
        year: q.year || getRandomYear(null),
        topic: q.topic || 'General',
        difficulty: q.difficulty || 'moderate'
      }));
    } catch (parseError) {
      console.error('❌ JSON Parse error:', parseError.message);
      console.error('🔍 Response preview:', generatedText.substring(0, 300));
      
      // Try to extract JSON array using regex
      const jsonArrayMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonArrayMatch) {
        try {
          const cleanedJson = jsonArrayMatch[0];
          const parsed = JSON.parse(cleanedJson);
          return Array.isArray(parsed) ? parsed.map(q => ({
            ...q,
            year: q.year || getRandomYear(null),
            topic: q.topic || 'General',
            difficulty: q.difficulty || 'moderate'
          })) : [];
        } catch (subParseError) {
          console.error('❌ JSON Sub-Parse error:', subParseError.message);
        }
      }
      
      throw new Error('Failed to parse JSON response from Gemini API');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('API request timeout after 45 seconds');
    }
    console.error('❌ callGeminiAPI error:', error);
    throw error;
  }
}

// Add retry logic with exponential backoff
async function callGeminiAPIWithRetry(prompt, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 API call attempt ${attempt}/${maxRetries}...`);
      
      const result = await callGeminiAPI(prompt);
      
      if (Array.isArray(result) && result.length > 0) {
        console.log(`✅ Successfully generated ${result.length} questions`);
        return result;
      } else if (attempt === maxRetries) {
        throw new Error('No valid questions generated after all attempts');
      } else {
        console.log(`⚠️ Empty result on attempt ${attempt}, retrying...`);
        continue;
      }
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) break;
      
      const waitTime = Math.min(Math.pow(2, attempt) * 1000, 10000); // Max 10 seconds
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

// FIXED: Sequential Full Test Generation
async function generateSequentialFullTest(params) {
  const { questionCount } = params;
  const distribution = calculateDistribution(questionCount);
  
  console.log(`🎯 Generating sequential full test with distribution:`, distribution);

  const subjects = [
    { name: 'Biology', key: 'biology', count: distribution.biology },
    { name: 'Chemistry', key: 'chemistry', count: distribution.chemistry },
    { name: 'Physics', key: 'physics', count: distribution.physics },
    { name: 'English', key: 'english', count: distribution.english },
    { name: 'Logical Reasoning', key: 'logical', count: distribution.logical }
  ];

  const allQuestions = [];

  for (const subject of subjects) {
    if (subject.count <= 0) continue;

    console.log(`📚 Generating ${subject.count} ${subject.name} questions...`);

    const subjectParams = {
      ...params,
      testFormat: 'subject-test',
      selectedSubject: subject.name,
      questionCount: subject.count,
      topic: null // Clear any topic for subject generation
    };

    try {
      const subjectQuestions = await callGeminiAPIWithRetry(buildPrompt(subjectParams), 2);
      
      if (subjectQuestions && subjectQuestions.length > 0) {
        const cleanedQuestions = subjectQuestions
          .slice(0, subject.count)
          .map(q => ({
            ...q,
            subject: subject.name,
            year: q.year || getRandomYear(params.yearRange)
          }));
        
        allQuestions.push(...cleanedQuestions);
        console.log(`✅ Added ${cleanedQuestions.length} ${subject.name} questions`);
      }
    } catch (error) {
      console.error(`❌ Failed to generate ${subject.name} questions:`, error.message);
      // Continue with other subjects instead of failing completely
    }

    // Small delay between subjects to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`🎉 Generated ${allQuestions.length}/${questionCount} total questions`);
  return allQuestions;
}

// FIXED: Enhanced batching with proper topic/subject handling
async function generateQuestionsWithBatching(params) {
  const { questionCount, testFormat, topic, selectedSubject } = params;
  console.log(`🎯 Generating ${questionCount} questions for ${testFormat}...`);
  console.log(`🎯 Parameters: Subject=${selectedSubject}, Topic=${topic}`);

  // For topic-specific tests, always use single call to maintain topic coherence
  if (testFormat === 'topic-test' && topic) {
    console.log(`📍 Topic-specific generation for: ${topic}`);
    return await callGeminiAPIWithRetry(buildPrompt(params));
  }

  // For subject-specific tests with small counts, use single call
  if (testFormat === 'subject-test' && selectedSubject && questionCount <= 35) {
    console.log(`📚 Subject-specific generation for: ${selectedSubject}`);
    return await callGeminiAPIWithRetry(buildPrompt(params));
  }

  // For full tests with more than 30 questions, use sequential generation
  if (testFormat === 'full-test' && questionCount > 30) {
    return await generateSequentialFullTest(params);
  }

  // For smaller counts, use direct generation
  if (questionCount <= 35) {
    return await callGeminiAPIWithRetry(buildPrompt(params));
  }

  // For large single-subject tests, use batching
  const batchSize = Math.min(30, Math.ceil(questionCount / 3));
  const numBatches = Math.ceil(questionCount / batchSize);
  
  console.log(`📦 Using ${numBatches} batches of ~${batchSize} questions each`);

  const results = [];
  for (let i = 0; i < numBatches; i++) {
    const currentBatchSize = Math.min(batchSize, questionCount - results.length);
    if (currentBatchSize <= 0) break;

    console.log(`📋 Processing batch ${i + 1}/${numBatches} (${currentBatchSize} questions)...`);

    try {
      const batchParams = { ...params, questionCount: currentBatchSize };
      const batchResult = await callGeminiAPIWithRetry(buildPrompt(batchParams), 2);
      
      if (batchResult && batchResult.length > 0) {
        results.push(...batchResult);
        console.log(`✅ Batch ${i + 1} completed: ${batchResult.length} questions`);
      }
    } catch (error) {
      console.error(`❌ Batch ${i + 1} failed:`, error.message);
      // Continue with remaining batches
    }

    if (results.length >= questionCount) break;
    
    // Delay between batches
    if (i < numBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results.slice(0, questionCount);
}

// -------------------- Routes --------------------

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
  const syllabusStats = Object.fromEntries(
    Object.entries(MDCAT_SYLLABUS).map(([k, v]) => [k, { topics: v.topics.length, percentage: v.percentage }])
  );

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.GEMINI_API_KEY,
    environment: process.env.NODE_ENV || 'development',
    version: '3.1.0',
    syllabusStats,
    universities: UNIVERSITIES
  });
});

// FIXED: Main question generation endpoint with better parameter handling
app.post('/api/generate-questions', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('📥 Received request:', JSON.stringify(req.body, null, 2));
    
    const { 
      count, 
      testFormat, 
      source, 
      yearRange, 
      difficulty, 
      selectedSubject, 
      subject, // Alternative parameter name
      topic 
    } = req.body || {};

    // Enhanced validation
    if (!count || typeof count !== 'number' || count < 1 || count > 180) {
      return res.status(400).json({ 
        success: false, 
        error: 'Question count must be a number between 1 and 180' 
      });
    }

    // FIXED: Handle both selectedSubject and subject parameters
    const finalSubject = selectedSubject || subject;

    // FIXED: Better parameter mapping with validation
    const params = {
      testFormat: testFormat || 'full-test',
      selectedSubject: finalSubject,
      topic: topic,
      questionCount: count,
      source: source || 'all',
      yearRange: yearRange || 'all',
      difficulty: difficulty || 'mixed'
    };

    // FIXED: Additional validation for topic and subject tests
    if (params.testFormat === 'topic-test') {
      if (!params.topic || params.topic.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Topic is required for topic-test format'
        });
      }
      params.topic = params.topic.trim();
      console.log(`🎯 Topic test requested for: "${params.topic}"`);
    }

    if (params.testFormat === 'subject-test') {
      if (!params.selectedSubject) {
        return res.status(400).json({
          success: false,
          error: 'Subject is required for subject-test format'
        });
      }
      
      // Validate subject exists in syllabus
      const validSubjects = ['biology', 'chemistry', 'physics', 'english', 'logical'];
      if (!validSubjects.includes(params.selectedSubject.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: `Invalid subject. Must be one of: ${validSubjects.join(', ')}`
        });
      }
      console.log(`📚 Subject test requested for: ${params.selectedSubject}`);
    }

    console.log('🔧 Final generation parameters:', JSON.stringify(params, null, 2));

    // Generate questions
    let questions;
    try {
      questions = await generateQuestionsWithBatching(params);
    } catch (generationError) {
      console.error('❌ Question generation failed:', generationError.message);
      
      if (generationError.message.includes('timeout')) {
        return res.status(408).json({ 
          success: false, 
          error: 'Generation timeout. Please try with fewer questions or try again later.' 
        });
      }
      
      if (generationError.message.includes('API')) {
        return res.status(503).json({ 
          success: false, 
          error: 'AI service temporarily unavailable. Please try again in a few minutes.' 
        });
      }
      
      throw generationError;
    }

    const validQuestions = validateAndFilterQuestions(questions, count);

    if (validQuestions.length === 0) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to generate valid questions. Please try again with different parameters.' 
      });
    }

    // FIXED: Additional validation for topic/subject consistency
    if (params.testFormat === 'topic-test' && params.topic) {
      const topicQuestions = validQuestions.filter(q => 
        q.topic && q.topic.toLowerCase().includes(params.topic.toLowerCase())
      );
      
      if (topicQuestions.length < validQuestions.length * 0.8) {
        console.log(`⚠️ Warning: Only ${topicQuestions.length}/${validQuestions.length} questions match topic "${params.topic}"`);
      }
    }

    if (params.testFormat === 'subject-test' && params.selectedSubject) {
      const subjectQuestions = validQuestions.filter(q => 
        q.subject && q.subject.toLowerCase() === params.selectedSubject.toLowerCase()
      );
      
      if (subjectQuestions.length < validQuestions.length * 0.9) {
        console.log(`⚠️ Warning: Only ${subjectQuestions.length}/${validQuestions.length} questions match subject "${params.selectedSubject}"`);
      }
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ Generated ${validQuestions.length} questions in ${responseTime}ms`);

    res.json({
      success: true,
      questions: addIds(validQuestions),
      metadata: {
        generated: validQuestions.length,
        requested: count,
        testFormat: params.testFormat,
        selectedSubject: params.selectedSubject,
        topic: params.topic,
        source: params.source,
        difficulty: params.difficulty,
        yearRange: params.yearRange,
        responseTime: responseTime,
        subjectDistribution: getSubjectDistribution(validQuestions)
      }
    });
    
  } catch (err) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ /api/generate-questions error after ${responseTime}ms:`, err);
    
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ 
      success: false, 
      error: isDev ? err.message : 'Internal server error. Please try again.',
      responseTime: responseTime
    });
  }
});

// Helper function to get subject distribution from questions
function getSubjectDistribution(questions) {
  const distribution = {};
  questions.forEach(q => {
    distribution[q.subject] = (distribution[q.subject] || 0) + 1;
  });
  return distribution;
}

// 404 handler for unknown API endpoints
app.use('/api', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'API endpoint not found',
    availableEndpoints: ['/api/generate-questions']
  });
});

// JSON parsing error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ 
      success: false, 
      error: 'Malformed JSON in request body' 
    });
  }
  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  
  if (err.message && err.message.includes('Gemini API')) {
    return res.status(500).json({ 
      success: false, 
      error: 'AI service temporarily unavailable. Please try again.' 
    });
  }
  
  if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
    return res.status(408).json({ 
      success: false, 
      error: 'Request timeout. Please try with fewer questions.' 
    });
  }
  
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({ 
    success: false, 
    error: isDev ? err.message : 'Internal server error' 
  });
});

// Start server
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`✅ MDCAT Past Paper Generator Server v3.1.0`);
    console.log(`🌐 Running on: http://localhost:${PORT}`);
    console.log(`🔐 API Key: ${process.env.GEMINI_API_KEY ? '✅ CONFIGURED' : '❌ MISSING'}`);
    console.log(`🌟 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 Syllabus coverage: ${Object.keys(MDCAT_SYLLABUS).length} subjects`);
    console.log(`🎯 Ready to generate questions!`);
    console.log(`🔧 Fixed: Topic-wise and Subject-wise generation!`);
  });
} else {
  server = app.listen(0, () => {
    console.log('🧪 Test server started on random port');
  });
}

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('❌ Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Export for testing
app.server = server;

module.exports = app;
module.exports.app = app;
module.exports.server = server;
module.exports.MDCAT_SYLLABUS = MDCAT_SYLLABUS;
module.exports.UNIVERSITIES = UNIVERSITIES;
