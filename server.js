const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const path = require('path');
const util = require('util');

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

// Function to generate quick answer suggestions based on AI response
async function generateQuickAnswers(response, openai) {
  try {
    if (!openai) {
      console.log('OpenAI client not available for generating quick answers');
      return getDefaultQuickAnswers();
    }
    
    console.log('Generating quick answer suggestions...');
    
    // Use gpt-4o-mini for generating quick answers in the same language as the conversation
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini for better quality and language matching
      messages: [
        {
          role: "system", 
          content: "Generate 3 short follow-up questions or statements that a user might want to respond with based on this assistant message. The suggestions should be in the SAME LANGUAGE as the assistant's message. Format your response as a simple JSON object with a 'suggestions' array containing 3 short strings. Each suggestion should be 2-5 words. The suggestions should be diverse and cover different directions the conversation could go."
        },
        {
          role: "user",
          content: `Assistant's message: "${response}"`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    const result = completion.choices[0].message.content;
    console.log('Generated quick answer suggestions:', result);
    
    try {
      // Try to parse JSON from the result
      const parsed = JSON.parse(result);
      
      // Check for suggestions array format
      if (parsed.suggestions && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
        return parsed.suggestions.slice(0, 3); // Ensure we have max 3 suggestions
      }
      
      // Alternative: If there's no suggestions array but there are other arrays in the response
      const firstArrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]) && parsed[key].length > 0);
      if (firstArrayKey) {
        return parsed[firstArrayKey].slice(0, 3);
      }
      
      // If we have any string array, use it
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        return parsed.slice(0, 3);
      }
      
    } catch (parseError) {
      console.error('Error parsing quick answer suggestions:', parseError);
      
      // Try to extract suggestions using regex as fallback
      try {
        const suggestionMatches = result.match(/"([^"]+)"/g);
        if (suggestionMatches && suggestionMatches.length >= 3) {
          return suggestionMatches.slice(0, 3).map(s => s.replace(/"/g, ''));
        }
      } catch (regexError) {
        console.error('Regex extraction failed:', regexError);
      }
    }
    
    // Use language-aware default answers based on the assistant's response
    return getDefaultQuickAnswers(response);
  } catch (error) {
    console.error('Error generating quick answers:', error);
    return getDefaultQuickAnswers(response);
  }
}

// Default quick answers when generation fails
function getDefaultQuickAnswers(response) {
  // Try to detect if the response is not in English
  if (response) {
    // Check for French
    if (/[àáâäæçèéêëìíîïòóôöùúûüÿ]/i.test(response) || 
        /(\bje\b|\bet\b|\ble\b|\bla\b|\bles\b|\bun\b|\bune\b|\bou\b|\bpour\b|\bce\b|\bcette\b|\bces\b)/i.test(response)) {
      return [
        "Dis-m'en plus",
        "Pourquoi ?",
        "Un exemple ?"
      ];
    }
    
    // Check for Spanish
    if (/[áéíóúüñ¿¡]/i.test(response) || 
        /(\bel\b|\bla\b|\blos\b|\blas\b|\by\b|\bo\b|\bpor\b|\bpara\b|\bque\b|\bcomo\b|\bpuedo\b)/i.test(response)) {
      return [
        "Cuéntame más",
        "¿Por qué?",
        "¿Un ejemplo?"
      ];
    }
    
    // Check for German
    if (/[äöüß]/i.test(response) || 
        /(\bund\b|\bder\b|\bdie\b|\bdas\b|\bein\b|\beine\b|\bzu\b|\bmit\b|\bfür\b|\bist\b|\bsind\b)/i.test(response)) {
      return [
        "Mehr Details",
        "Warum?",
        "Ein Beispiel?"
      ];
    }
  }
  
  // Default to English
  return [
    "Tell me more",
    "Why is that?",
    "Give an example"
  ];
}

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
            'User-Agent': 'QuickGPT/1.0.0'
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
        
        // Extract the OpenAI response
        if (response.choices && response.choices.length > 0) {
          console.log('OpenAI API response received successfully');
          
          // Get the assistant's response content
          const assistantMessage = response.choices[0].message;
          const responseContent = assistantMessage.content;
          
          // Generate quick answer suggestions based on the response
          const quickAnswers = await generateQuickAnswers(responseContent, openai);
          
          // Return both the message and quick answer suggestions
          return res.json({ 
            message: assistantMessage, 
            quickAnswers: quickAnswers 
          });
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
    
    // Return the simulated response with default quick answers
    return res.json({ 
      message: { 
        role: 'assistant', 
        content: simulatedResponse 
      },
      quickAnswers: getDefaultQuickAnswers(simulatedResponse)
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