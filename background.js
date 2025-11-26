// Background service worker for Gemini API calls

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'lookupWord') {
    handleWordLookup(request.word, sendResponse);
    return true; // Keep channel open for async response
  }
});

async function handleWordLookup(word, sendResponse) {
  try {
    // Get API key from storage
    const result = await chrome.storage.sync.get(['geminiApiKey']);
    const apiKey = result.geminiApiKey;
    
    if (!apiKey) {
      sendResponse({ 
        error: 'Chưa cấu hình API key. Vui lòng vào Options để cài đặt.' 
      });
      return;
    }
    
    // Call Gemini API to get word information
    const wordInfo = await getWordInfo(word, apiKey);
    
    if (wordInfo.error) {
      sendResponse({ error: wordInfo.error });
      return;
    }
    
    sendResponse({
      word: word,
      type: wordInfo.type,
      meaning: wordInfo.meaning,
      ipa: wordInfo.ipa,
      examples: wordInfo.examples
    });
    
  } catch (error) {
    console.error('Error in handleWordLookup:', error);
    sendResponse({ 
      error: 'Có lỗi xảy ra: ' + error.message 
    });
  }
}

async function getWordInfo(word, apiKey) {
  const prompt = `English word: "${word}"
Provide JSON:
{
  "type": "(n/v/adj/adv/...)",
  "meaning": "nghĩa 1; nghĩa 2; nghĩa 3",
  "ipa": {
    "uk": "/UK/",
    "us": "/US/"
  },
  "examples": [
    {"en": "sentence", "vi": "dịch"},
    {"en": "sentence 2", "vi": "dịch 2"}
  ]
}`;

  try {
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
          responseMimeType: "application/json"
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Lỗi 429: Quá nhiều requests. Vui lòng chờ 1-2 phút.');
      } else if (response.status === 403) {
        throw new Error('Lỗi 403: API key không hợp lệ hoặc chưa được kích hoạt.');
      } else if (response.status === 400) {
        throw new Error('Lỗi 400: Request không hợp lệ.');
      }
      
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const textContent = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from markdown code blocks if present
    let jsonText = textContent;
    const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    const wordInfo = JSON.parse(jsonText);
    return wordInfo;
    
  } catch (error) {
    console.error('Error getting word info:', error);
    return { error: 'Không thể lấy thông tin từ: ' + error.message };
  }
}


