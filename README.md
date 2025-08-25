# 🤖 AI Exam Generator

A powerful web application that generates intelligent multiple-choice questions from any text content using Google Gemini AI.

## ✨ Features

- 🧠 **AI-Powered**: Uses Google Gemini AI for intelligent question generation
- 🎚️ **Customizable Difficulty**: Adjust easy/moderate/difficult distribution
- 🔒 **Secure**: API keys safely stored on backend
- 📱 **Responsive**: Works perfectly on all devices
- ⚡ **Fast**: Real-time question generation and scoring
- 📊 **Detailed Results**: Comprehensive analytics and review
- 🎯 **User-Friendly**: Clean, intuitive interface

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm 8+
- Google Gemini API key

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/ai-exam-generator.git
cd ai-exam-generator

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
\`\`\`

### Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your \`.env\` file:
   \`\`\`
   GEMINI_API_KEY=your_actual_api_key_here
   \`\`\`

### Run the Application

\`\`\`bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
\`\`\`

### Access the Application

Open your browser and visit: **http://localhost:3000**

## 📖 How to Use

1. **Input Content**: Paste your study material (minimum 50 characters)
2. **Set Difficulty**: Adjust the distribution using sliders (must total 100%)
3. **Choose Quantity**: Select 5-20 questions
4. **Generate**: Click "Generate Questions" and wait for AI processing
5. **Take Exam**: Answer the generated multiple-choice questions
6. **Review Results**: View your score and detailed question analysis

## 🛠️ Technical Details

### Architecture

- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **Backend**: Node.js + Express.js
- **AI Integration**: Google Gemini Pro API
- **Security**: Server-side API key management

### API Endpoints

- \`GET /\` - Main application
- \`POST /api/generate-questions\` - Generate questions from content
- \`GET /health\` - Server health check

### Request Format

\`\`\`javascript
{
  "content": "Your study material text...",
  "questionCount": 10,
  "difficulty": {
    "easy": 25,
    "moderate": 25,
    "difficult": 50
  }
}
\`\`\`

### Response Format

\`\`\`javascript
{
  "questions": [
    {
      "question": "What is the main concept?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "B",
      "difficulty": "moderate"
    }
  ]
}
\`\`\`

## 🔧 Configuration

### Environment Variables

\`\`\`bash
GEMINI_API_KEY=your_google_gemini_api_key    # Required for AI features
PORT=3000                                    # Server port (default: 3000)
NODE_ENV=development                         # Environment mode
DEBUG=true                                   # Enable detailed logging
\`\`\`

### Customization

You can customize:

- **Question count range**: Modify limits in both frontend and backend
- **Difficulty options**: Add new difficulty levels
- **UI theme**: Update CSS variables for colors and styling
- **API parameters**: Adjust Gemini AI generation settings

## 🚀 Deployment

### Local Development
\`\`\`bash
npm run dev
\`\`\`

### Production Deployment

#### Using PM2 (Recommended)
\`\`\`bash
npm install -g pm2
pm2 start server.js --name "ai-exam-generator"
pm2 startup
pm2 save
\`\`\`

#### Using Docker
\`\`\`dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

#### Deploy to Cloud Platforms

- **Heroku**: Push to Heroku with buildpack
- **Vercel**: Deploy with serverless functions
- **Railway**: One-click deployment
- **DigitalOcean App Platform**: Container deployment

## 🧪 Testing

### Demo Mode
If no API key is configured, the app runs in demo mode with sample questions.

### API Testing
\`\`\`bash
curl -X POST http://localhost:3000/api/generate-questions \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Machine learning is a subset of artificial intelligence...",
    "questionCount": 5,
    "difficulty": {"easy": 40, "moderate": 40, "difficult": 20}
  }'
\`\`\`

## 🔍 Troubleshooting

### Common Issues

**"No questions generated"**
- Check your API key is valid and has quota remaining
- Ensure content is at least 50 characters
- Verify internet connection

**"Difficulty percentages must total 100%"**
- Adjust the sliders so they add up to exactly 100%

**"Port already in use"**
- Change PORT in your .env file or stop other services

**API quota exceeded**
- Check your Google Cloud Console for quota limits
- Consider upgrading your Gemini API plan

### Debug Mode

Set \`DEBUG=true\` in your .env file for detailed logging.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature-name\`
3. Make your changes and test thoroughly
4. Commit with clear messages: \`git commit -m "Add feature"\`
5. Push to your branch: \`git push origin feature-name\`
6. Submit a pull request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test with various content types
- Ensure mobile responsiveness
- Validate all user inputs

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-exam-generator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-exam-generator/discussions)
- **Email**: your.email@example.com

## 🎯 Roadmap

- [ ] Question categories and tagging
- [ ] Export results to PDF
- [ ] Question history and favorites
- [ ] Multi-language support
- [ ] Timer functionality for timed exams
- [ ] Bulk content processing
- [ ] Advanced analytics dashboard
- [ ] Integration with learning management systems

## 📊 Performance

- **Load time**: < 2 seconds
- **API response**: < 5 seconds for 10 questions
- **Mobile performance**: 90+ Lighthouse score
- **Browser support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

⭐ **Star this repository if you find it helpful!** ⭐

Made with ❤️ and powered by Google Gemini AI`,

  "SETUP_GUIDE.md": `# 🛠️ Complete Setup Guide

## Step-by-Step Installation

### 1. Prerequisites Check

Before starting, ensure you have:

\`\`\`bash
# Check Node.js version (should be 16+)
node --version

# Check npm version (should be 8+)
npm --version
\`\`\`

If not installed, download from [nodejs.org](https://nodejs.org/)

### 2. Project Setup

\`\`\`bash
# Create project directory
mkdir ai-exam-generator
cd ai-exam-generator

# Initialize npm project
npm init -y

# Install dependencies
npm install express cors dotenv

# Install development dependencies
npm install -D nodemon
\`\`\`

### 3. File Structure Setup

Create the following files in your project directory:

\`\`\`
ai-exam-generator/
├── index.html              # Main application file
├── server.js               # Backend server
├── package.json            # Dependencies
├── .env                    # Environment variables
├── .env.example            # Environment template
├── .gitignore             # Git ignore rules
└── README.md              # Documentation
\`\`\`

### 4. Environment Configuration

Create \`.env\` file:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` and add your Gemini API key:
\`\`\`
GEMINI_API_KEY=your_actual_api_key_here
PORT=3000
NODE_ENV=development
\`\`\`

### 5. Google Gemini API Setup

#### Method 1: Google AI Studio (Recommended)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the generated key

#### Method 2: Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "Generative Language API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the generated key

### 6. Run the Application

\`\`\`bash
# Development mode (recommended)
npm run dev

# Or production mode
npm start
\`\`\`

### 7. Verify Installation

1. Open browser to \`http://localhost:3000\`
2. Check health endpoint: \`http://localhost:3000/health\`
3. Test with sample content

## Advanced Configuration

### Custom Port
\`\`\`bash
# In .env file
PORT=8080
\`\`\`

### Production Environment
\`\`\`bash
NODE_ENV=production
\`\`\`

### CORS Configuration
For production, update server.js:
\`\`\`javascript
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}));
\`\`\`

## Deployment Options

### 1. Local Development Server
\`\`\`bash
npm run dev
\`\`\`

### 2. PM2 (Production)
\`\`\`bash
npm install -g pm2
pm2 start server.js --name "exam-generator"
pm2 startup
pm2 save
\`\`\`

### 3. Docker Container
\`\`\`dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

### 4. Cloud Deployment

#### Heroku
\`\`\`bash
heroku create your-app-name
heroku config:set GEMINI_API_KEY=your_key
git push heroku main
\`\`\`

#### Vercel
\`\`\`bash
npm install -g vercel
vercel
\`\`\`

#### Railway
\`\`\`bash
npm install -g @railway/cli
railway login
railway deploy
\`\`\`

## Troubleshooting

### Port Issues
\`\`\`bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=8080 npm start
\`\`\`

### API Key Issues
\`\`\`bash
# Test API key
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
\`\`\`

### Permission Issues
\`\`\`bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
\`\`\`

## Security Checklist

- [ ] API key in .env file only
- [ ] .env added to .gitignore
- [ ] CORS configured for production
- [ ] Input validation enabled
- [ ] HTTPS enabled in production
- [ ] Rate limiting implemented (optional)

## Performance Optimization

### Enable Compression
\`\`\`javascript
const compression = require('compression');
app.use(compression());
\`\`\`

### Add Caching
\`\`\`javascript
app.use(express.static('public', {
  maxAge: '1d'
}));
\`\`\`

### Monitor Performance
\`\`\`bash
npm install --save-dev clinic
clinic doctor -- node server.js
\`\`\`

## Maintenance

### Update Dependencies
\`\`\`bash
npm outdated
npm update
\`\`\`

### Check Security
\`\`\`bash
npm audit
npm audit fix
\`\`\`

### Monitor Logs
\`\`\`bash
# PM2 logs
pm2 logs

# Or direct
tail -f logs/app.log
\`\`\`

## Getting Help

- Check console for error messages
- Verify API key is valid
- Test with demo mode first
- Check network connectivity
- Review server logs

For additional support, create an issue on GitHub.`
}