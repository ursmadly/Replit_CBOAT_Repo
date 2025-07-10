// Simple script to test OpenAI API key
import OpenAI from 'openai';

async function testOpenAI() {
  try {
    console.log('Testing OpenAI API key...');
    
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant for clinical trial management." },
        { role: "user", content: "Provide a brief test response to verify the API connection." }
      ],
      max_tokens: 50
    });

    console.log('✅ OpenAI API key is working!');
    console.log('Response: ', response.choices[0].message.content);
    return true;
  } catch (error) {
    console.error('❌ Error testing OpenAI API key:');
    console.error(error);
    return false;
  }
}

testOpenAI();