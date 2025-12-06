
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testKey() {
  const key = 'AIzaSyCc_WMALGhROTeUyq8gW8FbCjL6LZ_ubic';
  console.log(`Testing Key: ${key} with gemini-pro`);

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    console.log('Sending request to Gemini Pro...');
    const result = await model.generateContent('Say Hello');
    console.log('Response:', result.response.text());
    console.log('✅ KEY IS VALID for gemini-pro');
  } catch (error) {
    console.error('❌ KEY TEST FAILED:', error.message);
  }
}

testKey();
