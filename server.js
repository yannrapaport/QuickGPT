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

// API endpoint to retrieve available models
app.get('/api/models', async (req, res) => {
  try {
    // Get the API key
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey.startsWith('sk-')) {
      // Initialize the OpenAI client with the API key
      const openai = new OpenAI({
        apiKey: apiKey,
        timeout: 30000,
        maxRetries: 2
      });
      
      // Get the available models
      const response = await openai.models.list();
      
      // Filter for chat models that we want to support
      const supportedModels = response.data
        .filter(model => {
          const id = model.id;
          return id.includes('gpt-4') || id.includes('gpt-3.5-turbo');
        })
        .map(model => model.id);
      
      // Check for our specific model sequence
      const modelPriority = ['gpt-4.1', 'gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
      
      // Filter models based on availability and priority
      const availableModels = modelPriority.filter(model => 
        supportedModels.includes(model) || 
        // Handle special case for models with versions
        supportedModels.some(m => m.startsWith(`${model}-`))
      );
      
      return res.json({ models: availableModels });
    } else {
      // If no API key, return default models
      return res.json({ 
        models: ['gpt-4o', 'gpt-3.5-turbo'],
        simulated: true
      });
    }
  } catch (error) {
    console.error('Error fetching models:', error);
    // Return a reasonable default in case of error
    return res.json({ 
      models: ['gpt-4o', 'gpt-3.5-turbo'],
      error: error.message 
    });
  }
});

// Function to select best available model based on preference with fallback
function selectBestAvailableModel(requestedModel, availableModels) {
  // If the exact requested model is available, use it
  if (availableModels.includes(requestedModel)) {
    return requestedModel;
  }
  
  // Check if a version of the requested model is available
  const matchingVersions = availableModels.filter(m => m.startsWith(`${requestedModel}-`));
  if (matchingVersions.length > 0) {
    // Sort to get the latest version (assumes version format is consistent)
    return matchingVersions.sort().pop();
  }
  
  // Define the fallback order
  const fallbackOrder = ['gpt-4.1', 'gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
  
  // Find the requested model's position in the fallback order
  const requestedIndex = fallbackOrder.indexOf(requestedModel);
  
  if (requestedIndex !== -1) {
    // Try models of equal or lesser preference
    for (let i = requestedIndex; i < fallbackOrder.length; i++) {
      const fallbackModel = fallbackOrder[i];
      if (availableModels.includes(fallbackModel)) {
        return fallbackModel;
      }
      
      // Check for versioned models
      const matchingFallbacks = availableModels.filter(m => m.startsWith(`${fallbackModel}-`));
      if (matchingFallbacks.length > 0) {
        return matchingFallbacks.sort().pop();
      }
    }
    
    // If no fallback found after the requested model, try models with higher preference
    for (let i = requestedIndex - 1; i >= 0; i--) {
      const fallbackModel = fallbackOrder[i];
      if (availableModels.includes(fallbackModel)) {
        return fallbackModel;
      }
      
      // Check for versioned models
      const matchingFallbacks = availableModels.filter(m => m.startsWith(`${fallbackModel}-`));
      if (matchingFallbacks.length > 0) {
        return matchingFallbacks.sort().pop();
      }
    }
  }
  
  // If all else fails, return the first available model or gpt-3.5-turbo as the ultimate fallback
  return availableModels[0] || 'gpt-3.5-turbo';
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
    
    // Get API key and available models
    const apiKey = process.env.OPENAI_API_KEY;
    let availableModels = ['gpt-4o', 'gpt-3.5-turbo']; // Default fallback models
    
    if (apiKey && apiKey.startsWith('sk-')) {
      try {
        const openaiForModels = new OpenAI({ apiKey, timeout: 10000, maxRetries: 1 });
        const modelResponse = await openaiForModels.models.list();
        availableModels = modelResponse.data
          .filter(m => m.id.includes('gpt-'))
          .map(m => m.id);
        console.log('Available models:', availableModels);
      } catch (modelError) {
        console.error('Error fetching models, using defaults:', modelError.message);
      }
    }
    
    // Select the best model based on requested model and available models
    const requestedModel = model || 'gpt-4o';
    const selectedModel = selectBestAvailableModel(requestedModel, availableModels);
    console.log(`Requested model: ${requestedModel}, Selected model: ${selectedModel}`);
    
    // Get the latest user message (to create a relevant response)
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    const userQuestion = lastUserMessage ? lastUserMessage.content : '';
    console.log('Processing user question:', userQuestion);
    
    // Check API key availability
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

// API endpoint for generating conversation summaries
app.post('/api/generate-summary', async (req, res) => {
  try {
    console.log('Summary generation request received');
    const { messages } = req.body;
    
    // Validate request
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format for summary generation:', messages);
      return res.status(400).json({ 
        error: 'Invalid request format. Messages array is required.' 
      });
    }
    
    // Get API key and check availability
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !apiKey.startsWith('sk-')) {
      console.log('No valid API key for summary generation');
      return res.status(400).json({ 
        error: 'Valid API key required for summary generation' 
      });
    }
    
    // Initialize the OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 60000,
      maxRetries: 2
    });
    
    // Get available models for fallback
    let availableModels = [];
    try {
      const modelResponse = await openai.models.list();
      availableModels = modelResponse.data
        .filter(m => m.id.includes('gpt-'))
        .map(m => m.id);
      console.log('Available models for summary generation:', availableModels);
    } catch (modelError) {
      console.error('Error fetching models, using defaults:', modelError.message);
      // Default fallback order
      availableModels = ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    }
    
    // Model preference order for summary generation
    const modelPreference = ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    
    // Select best available model using our helper function
    const selectedModel = selectBestAvailableModel(modelPreference[0], availableModels);
    console.log(`Using model for summary generation: ${selectedModel}`);
    
    // Craft the message for the summary generation prompt
    const systemPrompt = `
You are tasked with creating a brief, concise summary of a conversation. 
The summary should capture the essential points discussed, without unnecessary details.
Focus on the main topics and the most recent exchange.
The output should be in a simple format with:
1. A short overview of main topics (1-2 sentences max)
2. The most recent exchange (last question and answer)

Keep your summary very concise - it should fit comfortably in a small text area.
Do not include any explanations or meta-commentary about the summary itself.

IMPORTANT: Always ensure that your summary reflects the ENTIRE conversation up to its most recent state.
DO NOT focus only on earlier exchanges - include information from the most recent messages.
`;

    // Make the API call for summary generation
    const response = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages // Pass the conversation history
      ],
      max_tokens: 250,
      temperature: 0.7
    });
    
    if (response.choices && response.choices.length > 0) {
      const summary = response.choices[0].message.content.trim();
      
      // Format the continuation prompt
      const continuationPrompt = `Please continue this conversation where we left off, keeping in mind the context and the topic we discussed. You are the assistant in this conversation and should respond naturally, as if we never stopped talking. No need to summarize what was discussed; just continue directly based on the previous exchange.`;
      
      return res.json({ 
        summary: summary,
        continuationPrompt: continuationPrompt
      });
    } else {
      return res.status(500).json({ 
        error: 'Failed to generate summary' 
      });
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    return res.status(500).json({ 
      error: 'Error generating summary', 
      details: error.message 
    });
  }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});