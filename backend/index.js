const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const connectDB    = require('./config/db');
const searchRoutes   = require('./routes/search');
const authRoutes     = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const { getAvailableProviders } = require('./config/aiClients');

const app  = express();
const PORT = process.env.PORT || 5000;
connectDB();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 200 }));
app.use('/api/auth',     rateLimit({ windowMs:15*60*1000, max:20 }), authRoutes);
app.use('/api/search',   searchRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (_, res) => res.json({ status:'ok', version:'4.0.0', providers: getAvailableProviders() }));
app.use((req,res) => res.status(404).json({ error:'Not found' }));
app.use((err,req,res,next) => { console.error(err.message); res.status(500).json({ error:'Server error' }); });

app.listen(PORT, () => {
  const p = getAvailableProviders();
  console.log(`\n🚀 Bharat.AI v4.0 → http://localhost:${PORT}`);
  console.log(`🤖 Providers: Claude:${p.claude?'✅':'❌'} OpenAI:${p.openai?'✅':'❌'} Groq:${p.groq?'✅':'❌'} Gemini:${p.gemini?'✅':'❌'}\n`);
});

const allowedOrigins = [
  "http://localhost:3000",
  "https://bharat-ai-tau.vercel.app",
];

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));