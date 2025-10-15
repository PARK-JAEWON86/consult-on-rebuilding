const OpenAI = require('openai');
const fs = require('fs');

// Read .env file manually
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const apiKey = envVars.OPENAI_API_KEY;
const model = envVars.OPENAI_MODEL || 'gpt-4o-mini';

console.log('🔧 Configuration:');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT SET');
console.log('Model:', model);
console.log('');

const client = new OpenAI({ apiKey });

async function testChatCompletion() {
  try {
    console.log('📤 Sending chat completion request...\n');

    const messages = [
      { role: 'system', content: '당신은 친절한 AI 상담사입니다.' },
      { role: 'user', content: '안녕하세요! 테스트 메시지입니다.' }
    ];

    const completion = await client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    console.log('✅ SUCCESS!\n');
    console.log('📬 Response:');
    console.log(completion.choices[0].message.content);
    console.log('\n📊 Usage:');
    console.log(JSON.stringify(completion.usage, null, 2));

    return true;

  } catch (error) {
    console.error('❌ FAILED!\n');

    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:');
      console.error('- Status:', error.status);
      console.error('- Type:', error.type);
      console.error('- Code:', error.code);
      console.error('- Message:', error.message);
      console.error('- Headers:', error.headers);
    } else {
      console.error('General Error:');
      console.error('- Name:', error.name);
      console.error('- Message:', error.message);
      console.error('- Stack:', error.stack);
    }

    return false;
  }
}

console.log('🧪 Testing OpenAI Integration (Same as Backend)\n');
console.log('='.repeat(60));
testChatCompletion().then(success => {
  console.log('='.repeat(60));
  process.exit(success ? 0 : 1);
});
