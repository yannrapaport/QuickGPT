const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const path = require('path');

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
    console.log('Received request body:', JSON.stringify(req.body));
    const { messages, model } = req.body;
    
    // Validate request
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return res.status(400).json({ error: 'Invalid request format. Messages array is required.' });
    }
    
    // Default to gpt-4o if no model specified
    const selectedModel = model || "gpt-4o";
    console.log('Using model:', selectedModel);
    
    // Get the latest user message (to create a relevant response)
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    const userQuestion = lastUserMessage ? lastUserMessage.content : '';
    console.log('Processing user question:', userQuestion);
    
    // Try to use the OpenAI API if the key is available
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('API Key available:', apiKey ? 'Yes (masked)' : 'No');
    
    if (apiKey && apiKey.startsWith('sk-')) {
      try {
        // Initialize the OpenAI client with the API key and improved settings
        console.log('Creating OpenAI client with valid API key format...');
        const openai = new OpenAI({
          apiKey: apiKey,
          timeout: 60000, // 60 seconds timeout
          maxRetries: 3,  // Retry 3 times on failures
          defaultHeaders: {
            'User-Agent': 'ReplitChatApp/1.0.0'
          },
          defaultQuery: {
            // Add safety check for repeated requests
            user: 'replit-chat-app'
          }
        });
        
        // Format messages for OpenAI API
        const formattedMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        // Call the OpenAI API with chat completions
        console.log(`Attempting to call OpenAI API with ${selectedModel} model...`);
        const response = await openai.chat.completions.create({
          model: selectedModel, // Use the model selected by the user
          messages: formattedMessages,
          max_tokens: 500,
          temperature: 0.7,
        });
        
        // Extract and return the OpenAI response
        if (response.choices && response.choices.length > 0) {
          console.log('OpenAI API response received successfully');
          return res.json({ message: response.choices[0].message });
        }
      } catch (apiError) {
        console.error('Error calling OpenAI API:', apiError.message);
        console.error('Error details:', apiError);
        
        // Handle specific error types
        if (apiError.message.includes('401') || apiError.message.includes('authentication')) {
          console.error('Authentication error - API key may be invalid');
          // Continue to fallback response
        } else if (apiError.message.includes('429') || apiError.message.includes('rate limit')) {
          console.error('Rate limit exceeded - too many requests');
          // Continue to fallback response
        } else {
          console.error('Other API error occurred');
          // Continue to fallback response
        }
      }
    } else {
      console.log('No OpenAI API key found, using fallback response');
    }
    
    // Fallback to simulated response
    console.log('Using fallback response mechanism');
    const simulatedResponse = generateFallbackResponse(userQuestion);
    
    // Return the simulated response
    return res.json({ 
      message: { 
        role: 'assistant', 
        content: simulatedResponse 
      } 
    });
    
  } catch (error) {
    console.error('Error in chat endpoint:', error.message);
    return res.status(500).json({ 
      error: 'Error processing your request',
      details: error.message 
    });
  }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});