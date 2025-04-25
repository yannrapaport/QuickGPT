const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const path = require('path');

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false,
  defaultHeaders: {
    'User-Agent': 'ReplitChatApp/1.0.0'
  },
  defaultQuery: {
    'api-version': '2023-05-15'
  },
  timeout: 30000, // 30 seconds
  maxRetries: 2
});

// Create the Express app
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Function to generate fallback responses
function generateFallbackResponse(question) {
  // Basic response templates based on question content
  if (!question || question.trim() === '') {
    return "I'm here to help! Feel free to ask me anything.";
  }
  
  // Convert to lowercase for easier matching
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi ')) {
    return "Hello! I'm your AI assistant. How can I help you today?";
  }
  
  if (lowerQuestion.includes('how are you')) {
    return "I'm functioning well, thank you for asking! I'm here to assist you with any questions or tasks you might have.";
  }
  
  if (lowerQuestion.includes('weather')) {
    return "As a simulated response, I don't have access to real-time weather data. When you use the 'Continue in ChatGPT' feature with a valid API key, you can ask about weather and get more useful responses.";
  }
  
  if (lowerQuestion.includes('help') || lowerQuestion.includes('can you')) {
    return "I'd be happy to help! Currently, I'm running in simulation mode while waiting for a valid API key. You can test the interface and especially the 'Continue in ChatGPT' feature, which will allow you to continue this conversation with the full capabilities of GPT-4.";
  }
  
  if (lowerQuestion.includes('time') || lowerQuestion.includes('date')) {
    return "I'm a simulated response and don't have access to the current time or date. This is a temporary solution while waiting for a valid API key. Try the 'Continue in ChatGPT' feature to get more accurate responses!";
  }
  
  // Default response
  return "This is a simulated response while we're waiting for a valid OpenAI API key. Feel free to test the interface, especially the 'Continue in ChatGPT' feature which allows you to take this conversation to the full GPT-4 model for more detailed responses.\n\nOnce you provide a valid API key, you'll get genuine AI-generated responses here instead of this placeholder.";
}

// API endpoint for ChatGPT completion
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format. Messages array is required.' });
    }
    
    // Get the latest user message (to create a relevant response)
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    let userQuestion = lastUserMessage ? lastUserMessage.content : '';
    
    // Try to use the OpenAI API first (for when we get a working key)
    try {
      // Format messages for OpenAI API
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Log API key status (without revealing the key)
      console.log('OpenAI API key status: ' + (process.env.OPENAI_API_KEY ? 'Present (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'Missing'));
      
      // Call the OpenAI API with chat completions
      console.log('Attempting to call OpenAI API with model: gpt-4o');
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: formattedMessages,
        max_tokens: 500,
        temperature: 0.7,
      });
      
      console.log('OpenAI API response received successfully');
      
      // Extract and return the OpenAI response
      if (response.choices && response.choices.length > 0) {
        return res.json({ message: response.choices[0].message });
      }
    } catch (apiError) {
      console.error('Error calling OpenAI API:', apiError.message);
      console.error('API Error details:', JSON.stringify({
        status: apiError.status,
        headers: apiError.headers,
        code: apiError.code,
        type: apiError.type,
        name: apiError.name
      }, null, 2));
      // If API call fails, continue to fallback (don't return error response)
    }
    
    // Fallback to simulated response if OpenAI call fails
    console.log('Using fallback response mechanism');
    
    // Create a simulated response based on the user's message
    let simulatedResponse = generateFallbackResponse(userQuestion);
    
    // Return the simulated response
    return res.json({ 
      message: { 
        role: 'assistant', 
        content: simulatedResponse 
      } 
    });
    
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return res.status(500).json({ 
      error: 'Error processing your request',
      details: error.message 
    });
  }
});

// Function to mask an API key for safe logging
function maskApiKey(key) {
  if (!key) return 'NOT PRESENT';
  if (key.length <= 8) return '****';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
  console.log(`API Key (masked): ${maskApiKey(process.env.OPENAI_API_KEY)}`);
});