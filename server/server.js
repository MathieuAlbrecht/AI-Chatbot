import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import cookieParser from 'cookie-parser';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Serve static files from project root
app.use(express.static(path.join(__dirname, '..')));
console.log('Static files served from:', path.join(__dirname, '..'));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'text/plain', 'text/csv', 'text/markdown',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'application/javascript',
    'text/html',
    'text/css',
    'application/xml'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Dateityp ${file.mimetype} ist nicht erlaubt`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files at once
  }
});

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model configuration with providers
const modelConfig = {
  "gemini-2.5-pro-preview-06-05": {
    provider: "gemini",
    actualModel: "gemini-1.5-pro",
    supportsVision: true
  },
  "gemini-1.5-flash": {
    provider: "gemini",
    actualModel: "gemini-1.5-flash",
    supportsVision: true
  },
  "deepseek-r1": {
    provider: "openrouter",
    actualModel: "deepseek/deepseek-r1-0528:free",
    supportsVision: false
  },
  "deepseek-V3": {
    provider: "openrouter",
    actualModel: "deepseek/deepseek-chat-v3-0324:free",
    supportsVision: false
  },
  "claude-opus-4": {
    provider: "anthropic",
    actualModel: "claude-opus-4-20250514",
    description: "Claude Opus 4 (Direct API)",
    supportsVision: true
  },
  "sonar": {
    provider: "perplexity",
    actualModel: "sonar",
    description: "Perplexity Sonar",
    supportsVision: false
  },
  "sonar-pro": {
    provider: "perplexity",
    actualModel: "sonar-pro",
    description: "Perplexity Sonar Pro",
    supportsVision: false
  },
  "deepseek-chat": {
    provider: "deepseek",
    actualModel: "deepseek-chat",
    supportsVision: false,
    description: "DeepSeek Chat (direkte API)"
  },
  "deepseek-coder": {
    provider: "deepseek",
    actualModel: "deepseek-coder",
    supportsVision: false,
    description: "DeepSeek Coder (direkte API)"
  },
  "llama-3.3-8b": {
    provider: "openrouter",
    actualModel: "meta-llama/llama-3.3-8b-instruct:free",
    supportsVision: false
  },
  "gpt-4o": {
    provider: "openai",
    actualModel: "gpt-4o",
    supportsVision: false,
    description: "OpenAI GPT-4o (direkte API)"
  },
  "gpt-4-turbo": {
    provider: "openai",
    actualModel: "gpt-4.1",
    supportsVision: false,
    description: "OpenAI GPT-4.1 (direkte API)"
  }
};

// Helper functions for file handling
const imageToBase64 = (filePath, mimeType) => {
  const data = fs.readFileSync(filePath);
  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType
    }
  };
};

const readFileContent = async (filePath, mimeType) => {
  try {
    if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      return await fs.promises.readFile(filePath, 'utf-8');
    }
    return `[Binary file content not readable: ${path.basename(filePath)}]`;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return `[Error reading file: ${path.basename(filePath)}]`;
  }
};

// Gemini API handler
async function callGemini(model, prompt, files = [], messages = []) {
  console.log(`🤖 Calling Gemini with model: ${model}, files: ${files.length}, context: ${messages.length} messages`);
  try {
    const genModel = genAI.getGenerativeModel({ model });
    let parts = [{ text: prompt }];

    for (const file of files) {
      if (file.mimetype.startsWith('image/')) {
        parts.push(imageToBase64(file.path, file.mimetype));
      } else if (file.mimetype.startsWith('text/') || file.mimetype === 'application/json') {
        const content = await readFileContent(file.path, file.mimetype);
        parts.push({ text: `\n\nDateiinhalt von ${file.originalname}:\n${content}` });
      }
    }

    const result = await genModel.generateContent({ contents: [{ role: "user", parts }] });
    const response = await result.response;
    const text = response.text();
    console.log(`✅ Gemini response received, length: ${text.length}`);
    return text;
  } catch (error) {
    console.error(`❌ Gemini API error:`, error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

// Anthropic API handler
async function callAnthropic(model, messages, files = []) {
  console.log(`🤖 Calling Anthropic with model: ${model}, messages: ${messages.length}, files: ${files.length}`);
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Anthropic API key not configured");

  try {
    let content = [];
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.content) {
      content.push({ type: "text", text: lastMessage.content });
    }

    for (const file of files) {
      if (file.mimetype.startsWith('image/')) {
        try {
          const imageBuffer = fs.readFileSync(file.path);
          content.push({
            type: "image",
            source: {
              type: "base64",
              media_type: file.mimetype,
              data: imageBuffer.toString('base64')
            }
          });
        } catch (error) {
          console.error(`Error processing image ${file.originalname}:`, error);
          content.push({ type: "text", text: `[Error processing image: ${file.originalname}]` });
        }
      } else if (file.mimetype.startsWith('text/') || file.mimetype === 'application/json') {
        const fileContent = await readFileContent(file.path, file.mimetype);
        content.push({ type: "text", text: `\n\nDateiinhalt von ${file.originalname}:\n${fileContent}` });
      }
    }

    let systemPrompt = "Du bist ein hilfreicher AI-Assistent.";
    if (messages.length > 1) {
      const conversationHistory = messages.slice(0, -1).map(msg =>
          `${msg.role === 'user' ? 'Benutzer' : 'Assistent'}: ${msg.content}`
      ).join('\n\n');
      systemPrompt += `\n\nVorheriger Gesprächsverlauf:\n${conversationHistory}`;
    }

    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: content }]
    });

    if (!response.content || !response.content[0] || !response.content[0].text) {
      throw new Error("Invalid response format from Anthropic");
    }

    return response.content[0].text;
  } catch (error) {
    console.error(`❌ Anthropic API error:`, error);
    if (error.status === 401) throw new Error("Anthropic API key is invalid");
    else if (error.status === 429) throw new Error("Anthropic API rate limit exceeded");
    else if (error.status === 400) throw new Error(`Anthropic API request error: ${error.message}`);
    else throw new Error(`Anthropic API error: ${error.message}`);
  }
}

function normalizePerplexityMessages(messages, prompt) {
  let systemMsg = null;
  let rest = messages;
  if (messages.length > 0 && messages[0].role === "system") {
    systemMsg = messages[0];
    rest = messages.slice(1);
  }

  const normalized = [];
  let userBuffer = "";

  for (const msg of rest) {
    if (msg.role === "user") {
      userBuffer += (userBuffer ? "\n\n" : "") + msg.content;
    } else if (msg.role === "assistant") {
      if (userBuffer) {
        normalized.push({ role: "user", content: userBuffer });
        userBuffer = "";
      }
      normalized.push(msg);
    }
  }

  if (userBuffer) normalized.push({ role: "user", content: userBuffer });
  return systemMsg ? [systemMsg, ...normalized] : normalized;
}

async function callPerplexity(model, prompt, files = [], messages = []) {
  console.log(`🤖 Calling Perplexity with model: ${model}, context: ${messages.length} messages`);
  if (!process.env.PERPLEXITY_API_KEY) throw new Error("Perplexity API key not configured");

  const normalizedMessages = normalizePerplexityMessages(messages, prompt);
  const requestBody = { model: model, messages: normalizedMessages };

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) throw new Error(`Perplexity API error: ${await response.text()}`);

  const data = await response.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response format from Perplexity");
  }

  return data.choices[0].message.content;
}

// OpenRouter API handler
async function callOpenRouter(model, prompt, files = [], messages = []) {
  console.log(`🌐 Calling OpenRouter with model: ${model}, files: ${files.length}, context: ${messages.length} messages`);
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OpenRouter API key not configured");

  try {
    let requestMessages = [...messages];
    let enhancedPrompt = prompt;

    for (const file of files) {
      if (file.mimetype.startsWith('text/') || file.mimetype === 'application/json') {
        const content = await readFileContent(file.path, file.mimetype);
        enhancedPrompt += `\n\nDateiinhalt von ${file.originalname}:\n${content}`;
      } else if (file.mimetype.startsWith('image/')) {
        enhancedPrompt += `\n\nBild hochgeladen: ${file.originalname} (${file.mimetype})`;
      }
    }

    requestMessages.push({ role: "user", content: enhancedPrompt });
    const requestBody = { "model": model, "messages": requestMessages };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI ChatHub"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try { errorData = JSON.parse(errorText); } catch (e) { errorData = { error: { message: errorText } }; }
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from OpenRouter");
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error(`❌ OpenRouter API error:`, error);
    throw error;
  }
}

const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function callDeepSeek(model, messages) {
  console.log(`🤖 Calling DeepSeek with model: ${model}, messages: ${messages.length}`);
  if (!process.env.DEEPSEEK_API_KEY) throw new Error("DeepSeek API key not configured");

  try {
    const response = await deepseek.chat.completions.create({ model, messages });
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error("Invalid response format from DeepSeek");
    }
    return response.choices[0].message.content;
  } catch (error) {
    console.error(`❌ DeepSeek API error:`, error);
    throw new Error(`DeepSeek API error: ${error.message}`);
  }
}

async function callOpenAI(model, messages) {
  console.log(`🤖 Calling OpenAI with model: ${model}, messages: ${messages.length}`);
  if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API key not configured");

  try {
    const response = await openai.chat.completions.create({ model, messages });
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error("Invalid response format from OpenAI");
    }
    return response.choices[0].message.content;
  } catch (error) {
    console.error(`❌ OpenAI API error:`, error);
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

// Enhanced chat endpoint
app.post("/api/chat", async (req, res) => {
  console.log(`\n🔄 === NEW CHAT REQUEST ===`);
  let responseText;

  try {
    const { prompt, model, fileIds = [], messages = [], useContext = false } = req.body;
    console.log(`💬 Chat request details:`, { model, promptLength: prompt?.length || 0, fileCount: fileIds.length });

    if (!prompt) return res.status(400).json({ error: "Prompt is required" });
    if (!model) return res.status(400).json({ error: "Model is required" });

    const config = modelConfig[model];
    if (!config) return res.status(400).json({ error: `Unsupported model: ${model}`, availableModels: Object.keys(modelConfig) });

    let files = [];
    if (fileIds.length > 0) {
      for (const fileId of fileIds) {
        const filePath = path.join(uploadsDir, fileId);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const ext = path.extname(fileId).toLowerCase();
          const mimetypeMap = {
            '.txt': 'text/plain', '.md': 'text/markdown', '.json': 'application/json',
            '.js': 'application/javascript', '.html': 'text/html', '.css': 'text/css',
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf'
          };
          const mimetype = mimetypeMap[ext] || 'application/octet-stream';
          files.push({ path: filePath, originalname: fileId, mimetype, size: stats.size });
        }
      }
    }

    console.log(`🔧 Model configuration:`, { requestedModel: model, provider: config.provider, actualModel: config.actualModel });

    switch (config.provider) {
      case "gemini":
        if (!process.env.GOOGLE_API_KEY) return res.status(500).json({ error: "Google API key not configured" });
        responseText = await callGemini(config.actualModel, prompt, files, messages);
        break;
      case "anthropic":
        if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "Anthropic API key not configured" });
        const anthropicMessages = messages.length > 0 ? messages : [{ role: "user", content: prompt }];
        responseText = await callAnthropic(config.actualModel, anthropicMessages, files);
        break;
      case "perplexity":
        if (!process.env.PERPLEXITY_API_KEY) return res.status(500).json({ error: "Perplexity API key not configured" });
        responseText = await callPerplexity(config.actualModel, prompt, files, messages);
        break;
      case "deepseek":
        if (!process.env.DEEPSEEK_API_KEY) return res.status(500).json({ error: "DeepSeek API key not configured" });
        const deepseekMessages = messages.length > 0 ? messages : [{ role: "user", content: prompt }];
        responseText = await callDeepSeek(config.actualModel, deepseekMessages);
        break;
      case "openrouter":
        if (!process.env.OPENROUTER_API_KEY) return res.status(500).json({ error: "OpenRouter API key not configured" });
        responseText = await callOpenRouter(config.actualModel, prompt, files, messages);
        break;
      case "openai":
        if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OpenAI API key not configured" });
        const openaiMessages = messages.length > 0 ? messages : [{ role: "user", content: prompt }];
        responseText = await callOpenAI(config.actualModel, openaiMessages);
        break;
      default:
        return res.status(500).json({ error: `Unknown provider: ${config.provider}` });
    }

    console.log(`✅ Response generated successfully, length: ${responseText?.length || 0}`);
    res.json({
      response: responseText,
      model,
      provider: config.provider,
      filesProcessed: files.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Error in chat endpoint:`, { message: error.message, stack: error.stack });
    if (error.message?.includes('API key')) res.status(401).json({ error: "Invalid API key", details: error.message });
    else if (error.message?.includes('quota') || error.message?.includes('rate limit')) res.status(429).json({ error: "API quota exceeded", details: error.message });
    else if (error.message?.includes('not configured')) res.status(500).json({ error: error.message });
    else res.status(500).json({
        error: "Failed to generate response",
        details: error.message,
        timestamp: new Date().toISOString()
      });
  }
});

// Root endpoint - serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Protected Chathub route
app.get("/Chathub.html", (req, res) => {
  if (req.cookies.auth === 'true') {
    res.sendFile(path.join(__dirname, '..', 'Chathub.html'));
  } else {
    res.redirect('/');
  }
});

// Login route
app.post("/login", express.json(), (req, res) => {
  const { username, password } = req.body;
  const usersPath = path.join(__dirname, 'users.json');

  if (!fs.existsSync(usersPath)) {
    return res.status(500).json({ success: false, error: 'users.json not found' });
  }

  try {
    const users = JSON.parse(fs.readFileSync(usersPath));
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      res.cookie('auth', 'true', {
        maxAge: 900000, // 15 minutes
        httpOnly: true,
        sameSite: 'strict'
      });
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// File upload endpoint
app.post("/api/upload", upload.array('files', 5), (req, res) => {
  console.log(`📁 File upload request received`);
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: "Keine Dateien hochgeladen" });

  const uploadedFiles = req.files.map(file => ({
    id: file.filename,
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    url: `/uploads/${file.filename}`
  }));

  console.log(`✅ ${uploadedFiles.length} Dateien erfolgreich hochgeladen`);
  res.json({
    success: true,
    files: uploadedFiles,
    message: `${uploadedFiles.length} Datei(en) erfolgreich hochgeladen`
  });
});

// Delete file endpoint
app.delete("/api/files/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ File deleted: ${filename}`);
      res.json({ success: true, message: "Datei erfolgreich gelöscht" });
    } else {
      res.status(404).json({ error: "Datei nicht gefunden" });
    }
  } catch (error) {
    console.error(`❌ Error deleting file:`, error);
    res.status(500).json({ error: "Fehler beim Löschen der Datei" });
  }
});

// Get uploaded files endpoint
app.get("/api/files", (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir).map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        uploadDate: stats.birthtime,
        url: `/uploads/${filename}`
      };
    });
    res.json({ files });
  } catch (error) {
    console.error(`❌ Error listing files:`, error);
    res.status(500).json({ error: "Fehler beim Auflisten der Dateien" });
  }
});

// Get available models endpoint
app.get("/api/models", (req, res) => {
  const availableModels = Object.keys(modelConfig).map(key => {
    const available = isModelAvailable(modelConfig[key].provider);
    return {
      id: key,
      name: getModelDisplayName(key),
      provider: modelConfig[key].provider,
      available: available,
      frontendOnly: modelConfig[key].provider === "puter",
      supportsVision: modelConfig[key].supportsVision || false,
      description: modelConfig[key].description || null
    };
  });

  res.json({ models: availableModels });
});

// Helper functions
function getModelDisplayName(modelId) {
  const displayNames = {
    "gemini-2.5-pro-preview-06-05": "Gemini 1.5 Pro",
    "gemini-1.5-flash": "Gemini 1.5 Flash",
    "deepseek-r1": "DeepSeek R1",
    "deepseek-V3": "DeepSeek V3",
    "claude-opus-4": "Claude Opus 4 (Direct API)",
    "sonar": "Perplexity Sonar",
    "sonar-pro": "Perplexity Sonar Pro",
    "llama-3.3-8b": "Llama 3.3 8B"
  };
  return displayNames[modelId] || modelId;
}

function isModelAvailable(provider) {
  switch (provider) {
    case "gemini": return !!process.env.GOOGLE_API_KEY;
    case "openrouter": return !!process.env.OPENROUTER_API_KEY;
    case "anthropic": return !!process.env.ANTHROPIC_API_KEY;
    case "deepseek": return !!process.env.DEEPSEEK_API_KEY;
    case "perplexity": return !!process.env.PERPLEXITY_API_KEY;
    case "openai": return !!process.env.OPENAI_API_KEY;
    default: return false;
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  const providerStatus = {
    gemini: !!process.env.GOOGLE_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    puter: true
  };

  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    providers: providerStatus,
    availableModels: Object.keys(modelConfig).length,
    uploadSupport: true
  });
});

// Debug endpoint
app.get("/api/debug", (req, res) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: { nodeVersion: process.version, port: PORT },
    apiKeys: {
      google: !!process.env.GOOGLE_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      perplexity: !!process.env.PERPLEXITY_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      openai: !!process.env.OPENAI_API_KEY
    },
    features: {
      fileUpload: true,
      maxFileSize: "10MB",
      maxFiles: 5,
      supportedTypes: ["images", "text", "documents", "code"],
      conversationContext: true
    },
    models: Object.keys(modelConfig).map(key => ({
      id: key,
      name: getModelDisplayName(key),
      provider: modelConfig[key].provider,
      actualModel: modelConfig[key].actualModel,
      available: isModelAvailable(modelConfig[key].provider),
      frontendOnly: modelConfig[key].provider === "puter",
      supportsVision: modelConfig[key].supportsVision || false
    }))
  };

  res.json(debugInfo);
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 === AI CHATHUB SERVER STARTED ===`);
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`🔐 Login at: http://localhost:${PORT}/`);
  console.log(`📋 Available models: http://localhost:${PORT}/api/models`);

  // Log API key status
  console.log(`\n🔑 API Keys configured:`);
  console.log(` - Google API Key: ${process.env.GOOGLE_API_KEY ? '✅ Yes' : '❌ No'}`);
  console.log(` - OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? '✅ Yes' : '❌ No'}`);
  console.log(` - Anthropic API Key: ${process.env.ANTHROPIC_API_KEY ? '✅ Yes' : '❌ No'}`);
  console.log(` - DeepSeek API Key: ${process.env.DEEPSEEK_API_KEY ? '✅ Yes' : '❌ No'}`);
  console.log(` - OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Yes' : '❌ No'}`);
  console.log(` - Perplexity API Key: ${process.env.PERPLEXITY_API_KEY ? '✅ Yes' : '❌ No'}`);
});

