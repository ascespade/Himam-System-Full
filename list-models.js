
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const key = 'AIzaSyCc_WMALGhROTeUyq8gW8FbCjL6LZ_ubic';
  console.log(`Listing Models for Key: ${key}`);

  // Fetching models via REST directly to debug easier
  try {
     const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
     const data = await response.json();
     
     if (data.error) {
        console.error('❌ KEY ERROR:', JSON.stringify(data.error, null, 2));
     } else if (data.models) {
        console.log('✅ AVAILABLE MODELS:');
        data.models.forEach(m => console.log(` - ${m.name} (${m.supportedGenerationMethods})`));
     } else {
        console.log('❓ Unknown response:', data);
     }
  } catch (error) {
    console.error('❌ REQUEST FAILED:', error.message);
  }
}

listModels();
