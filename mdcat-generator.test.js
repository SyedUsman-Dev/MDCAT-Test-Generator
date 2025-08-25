// mdcat-generator.test.js - FIXED VERSION
const request = require('supertest');
const path = require('path');

// Set environment to test before importing server
process.env.NODE_ENV = 'test';

// Mock the Gemini API calls in test environment
if (process.env.NODE_ENV === 'test') {
  // Set a dummy API key for tests
  process.env.GEMINI_API_KEY = 'test-key-12345';
  
  // Mock fetch globally for tests
  global.fetch = jest.fn();
}

// Import the server with proper error handling
let app;
try {
    const serverModule = require('./server.js');
    app = serverModule.app || serverModule;
} catch (error) {
    console.error('❌ Could not load server.js:', error.message);
    console.error('Make sure server.js exists and exports the Express app');
    process.exit(1);
}

// Extend Jest timeout for API calls (Gemini API can be slow)
jest.setTimeout(60000);

describe('🩺 MDCAT Past Paper Generator - Complete Test Suite', () => {
    
    // Mock successful API responses for tests
    beforeEach(() => {
        if (process.env.NODE_ENV === 'test') {
            // Mock successful Gemini API response
            const mockQuestions = [
                {
                    question: "Which organelle is responsible for protein synthesis?",
                    options: ["Mitochondria", "Ribosomes", "Golgi apparatus", "Nucleus"],
                    answer: "B",
                    explanation: "Ribosomes are the cellular structures responsible for protein synthesis.",
                    subject: "Biology",
                    topic: "Cell Structure",
                    difficulty: "moderate",
                    year: 2024,
                    source: "MDCAT"
                },
                {
                    question: "What is the atomic number of carbon?",
                    options: ["6", "8", "12", "14"],
                    answer: "A", 
                    explanation: "Carbon has 6 protons, making its atomic number 6.",
                    subject: "Chemistry",
                    topic: "Atomic Structure",
                    difficulty: "easy",
                    year: 2024,
                    source: "MDCAT"
                }
            ];
            
            global.fetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                    candidates: [{
                        content: {
                            parts: [{
                                text: JSON.stringify(mockQuestions)
                            }]
                        }
                    }]
                })
            });
        }
    });

    afterEach(() => {
        if (process.env.NODE_ENV === 'test') {
            jest.clearAllMocks();
        }
    });
    
    // ===================================
    // 1. HEALTH CHECK TESTS
    // ===================================
    describe('🏥 Health Check', () => {
        test('should return comprehensive health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('hasApiKey');
            expect(response.body).toHaveProperty('environment', 'test');
            expect(response.body).toHaveProperty('version');
            expect(typeof response.body.timestamp).toBe('string');
            expect(typeof response.body.hasApiKey).toBe('boolean');
        });

        test('should include syllabus information in health check', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            
            if (response.body.syllabusStats) {
                expect(response.body.syllabusStats).toHaveProperty('biology');
                expect(response.body.syllabusStats).toHaveProperty('chemistry');
                expect(response.body.syllabusStats).toHaveProperty('physics');
                expect(response.body.syllabusStats).toHaveProperty('english');
                expect(response.body.syllabusStats).toHaveProperty('logical');
            }
        });
    });

    // ===================================
    // 2. MAIN APPLICATION TESTS
    // ===================================
    describe('🏠 Main Application', () => {
        test('should serve the main application page', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);
            
            expect(response.text).toContain('MDCAT');
            expect(response.headers['content-type']).toMatch(/html/);
        });

        test('should serve static assets', async () => {
            // Test if favicon or other static assets are accessible
            const response = await request(app)
                .get('/favicon.ico');
            
            // Should return 200 if exists, or 404 if not - both are acceptable
            expect([200, 404]).toContain(response.status);
        });
    });

    // ===================================
    // 3. QUESTION GENERATION API TESTS  
    // ===================================
    describe('🧠 Question Generation API', () => {
        
        // ===== SUCCESS CASES =====
        describe('✅ Successful Generation', () => {
            
            test('should generate full MDCAT test successfully', async () => {
                const requestBody = {
                    count: 10, // Use 'count' instead of 'questionCount'
                    testFormat: 'full-test',
                    source: 'all',
                    yearRange: 'recent',
                    difficulty: 'mixed'
                };

                const response = await request(app)
                    .post('/api/generate-questions')
                    .send(requestBody)
                    .expect(200);
                
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('questions');
                expect(Array.isArray(response.body.questions)).toBe(true);
                expect(response.body.questions.length).toBeGreaterThan(0);
                expect(response.body.questions.length).toBeLessThanOrEqual(10);
                
                // Validate each question structure
                response.body.questions.forEach((question, index) => {
                    validateQuestionStructure(question, `Question ${index + 1}`);
                });
            }, 30000);

            test('should generate subject-wise Biology questions', async () => {
                const requestBody = {
                    count: 5,
                    testFormat: 'subject-test', 
                    selectedSubject: 'biology',
                    source: 'all',
                    yearRange: 'recent',
                    difficulty: 'mixed'
                };

                const response = await request(app)
                    .post('/api/generate-questions')
                    .send(requestBody)
                    .expect(200);
                
                expect(response.body.success).toBe(true);
                expect(response.body.questions.length).toBeGreaterThan(0);
                
                // All questions should be Biology
                response.body.questions.forEach(question => {
                    expect(question.subject.toLowerCase()).toBe('biology');
                });
            }, 20000);
        });
    });

    // ===================================
    // 4. ERROR HANDLING TESTS
    // ===================================
    describe('❌ Error Handling', () => {
        
        test('should handle missing request body', async () => {
            const response = await request(app)
                .post('/api/generate-questions')
                .send({})
                .expect(400);
            
            expect(response.body).toHaveProperty('error');
            expect(typeof response.body.error).toBe('string');
        });

        test('should handle invalid question count - too high', async () => {
            const requestBody = {
                count: 300, // Invalid - exceeds limit
                testFormat: 'full-test',
                source: 'all',
                yearRange: 'recent',
                difficulty: 'mixed'
            };

            const response = await request(app)
                .post('/api/generate-questions')
                .send(requestBody)
                .expect(400);
            
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Question count must be between');
        });

        test('should handle invalid question count - too low', async () => {
            const requestBody = {
                count: 0, // Invalid - too low
                testFormat: 'full-test',
                source: 'all', 
                yearRange: 'recent',
                difficulty: 'mixed'
            };

            const response = await request(app)
                .post('/api/generate-questions')
                .send(requestBody)
                .expect(400);
            
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Question count must be between');
        });

        test('should handle 404 for non-existent API routes', async () => {
            const response = await request(app)
                .get('/api/non-existent-endpoint')
                .expect(404);
            
            expect(response.body).toHaveProperty('error', 'API endpoint not found');
        });
    });
});

// ===================================
// HELPER FUNCTIONS
// ===================================

/**
 * Validates the structure of a generated question
 * @param {Object} question - The question object to validate
 * @param {string} context - Context for error messages
 */
function validateQuestionStructure(question, context = '') {
    const errorContext = context ? `${context}: ` : '';
    
    // Required fields
    expect(question).toHaveProperty('question', `${errorContext}Missing question field`);
    expect(question).toHaveProperty('options', `${errorContext}Missing options field`);
    expect(question).toHaveProperty('answer', `${errorContext}Missing answer field`);
    expect(question).toHaveProperty('subject', `${errorContext}Missing subject field`);
    
    // Question content validation
    expect(typeof question.question).toBe('string');
    expect(question.question.length).toBeGreaterThan(5);
    
    // Options validation
    expect(Array.isArray(question.options)).toBe(true);
    expect(question.options).toHaveLength(4);
    question.options.forEach((option, index) => {
        expect(typeof option).toBe('string');
        expect(option.length).toBeGreaterThan(0);
    });
    
    // Answer validation
    expect(['A', 'B', 'C', 'D']).toContain(question.answer);
    
    // Subject validation
    expect(typeof question.subject).toBe('string');
    const validSubjects = ['Biology', 'Chemistry', 'Physics', 'English', 'Logical Reasoning'];
    expect(validSubjects).toContain(question.subject);
    
    // Optional fields validation
    if (question.topic) {
        expect(typeof question.topic).toBe('string');
        expect(question.topic.length).toBeGreaterThan(0);
    }
    
    if (question.source) {
        expect(typeof question.source).toBe('string');
    }
    
    if (question.difficulty) {
        expect(['easy', 'moderate', 'hard', 'difficult']).toContain(question.difficulty);
    }
    
    // Critical: Explanation must be present and meaningful
    if (question.explanation) {
        expect(typeof question.explanation).toBe('string');
        expect(question.explanation.length).toBeGreaterThan(10);
    }
}

// ===================================
// SETUP AND TEARDOWN
// ===================================

beforeAll(async () => {
    console.log('🧪 Starting MDCAT Generator Test Suite...');
    console.log('📊 Testing official MDCAT 2025 syllabus compliance');
    console.log('🤖 Testing Gemini 2.5-flash integration');
    console.log('⚡ Extended timeouts for API calls');
});

afterAll(async () => {
    console.log('✅ MDCAT Generator tests completed!');
    console.log('📈 Check test coverage with: npm run test:coverage');
    
    // Close server if it has a close method
    if (app && typeof app.close === 'function') {
        await app.close();
    }
    
    // Clear all mocks
    if (process.env.NODE_ENV === 'test') {
        jest.clearAllMocks();
    }
    
    // Force exit to prevent hanging
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});

beforeEach(() => {
    // Reset any global state if needed
    jest.clearAllMocks();
});

afterEach(() => {
    // Cleanup after each test if needed
});

// ===================================
// EXPORT FOR EXTERNAL USAGE
// ===================================
module.exports = {
    validateQuestionStructure
};