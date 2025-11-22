let words = [];
let currentIndex = 0;
let currentMode = 'flashcard';
let correctCount = 0;
let attemptedWords = new Set();

// Load words và khởi tạo
chrome.storage.sync.get(['forgetfulWords', 'wordContents'], function(result) {
  const forgetfulWords = result.forgetfulWords || [];
  const wordContents = result.wordContents || {};
  
  // Chuyển đổi thành array với cấu trúc dễ xử lý
  words = forgetfulWords.map(hash => {
    const content = wordContents[hash] || '';
    return parseWordContent(content);
  }).filter(w => w.word); // Chỉ lấy từ hợp lệ
  
  if (words.length === 0) {
    showEmptyState();
  } else {
    hideEmptyState();
    updateProgress();
    showWord();
  }
});

// Parse nội dung từ vựng
function parseWordContent(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  const headerEl = temp.querySelector('.word-header');
  const definitionEl = temp.querySelector('.word-definition');
  
  let word = '';
  let fullHeader = '';
  let definition = '';
  
  if (headerEl) {
    fullHeader = headerEl.textContent.trim();
    // Trích xuất từ (phần trước dấu ngoặc hoặc /)
    word = fullHeader.split(/[\(\/]/)[0].trim();
  }
  
  if (definitionEl) {
    definition = definitionEl.textContent.trim();
  } else {
    // Fallback nếu không có cấu trúc word-header/word-definition
    const text = temp.textContent.trim();
    definition = text;
    word = text.split(/[\(\/=]/)[0].trim();
  }
  
  return { word, fullHeader: fullHeader || word, definition };
}

// Chuyển đổi mode
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const mode = this.dataset.mode;
    if (mode === currentMode) return;
    
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    
    // Reset về đầu khi chuyển mode
    currentIndex = 0;
    
    // Reset điểm số cho dictation
    if (mode === 'dictation') {
      correctCount = 0;
      attemptedWords.clear();
    }
    
    // Reset trạng thái
    document.getElementById('flashcard').classList.remove('flipped');
    document.getElementById('dictationInput').value = '';
    document.getElementById('dictationInput').className = 'dictation-input';
    document.getElementById('dictationFeedback').innerHTML = '';
    
    showWord();
  });
});

// Hiển thị từ hiện tại
function showWord() {
  if (words.length === 0) return;
  
  const currentWord = words[currentIndex];
  
  if (currentMode === 'flashcard') {
    showFlashcard(currentWord);
  } else {
    showDictation(currentWord);
  }
  
  updateProgress();
}

// Hiển thị flashcard
function showFlashcard(wordData) {
  document.getElementById('flashcardMode').classList.remove('hidden');
  document.getElementById('dictationMode').classList.add('hidden');
  
  document.getElementById('cardWord').textContent = wordData.fullHeader;
  document.getElementById('cardDefinition').innerHTML = wordData.definition;
  document.getElementById('flashcard').classList.remove('flipped');
}

// Hiển thị dictation
function showDictation(wordData) {
  document.getElementById('flashcardMode').classList.add('hidden');
  document.getElementById('dictationMode').classList.remove('hidden');
  
  // Kiểm tra xem đã hoàn thành chưa
  if (currentIndex >= words.length) {
    showDictationComplete();
    return;
  }
  
  document.getElementById('dictationDefinition').innerHTML = wordData.definition;
  const input = document.getElementById('dictationInput');
  input.value = '';
  input.className = 'dictation-input';
  input.disabled = false;
  input.focus();
  document.getElementById('dictationFeedback').innerHTML = '';
}

// Hiển thị màn hình hoàn thành dictation
function showDictationComplete() {
  const container = document.getElementById('dictationMode');
  const percentage = Math.round((correctCount / words.length) * 100);
  
  container.innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
      <div style="font-size: 28px; font-weight: 700; color: #000; margin-bottom: 20px;">
        Hoàn thành!
      </div>
      <div style="font-size: 48px; font-weight: 700; color: #4CAF50; margin-bottom: 10px;">
        ${correctCount}/${words.length}
      </div>
      <div style="font-size: 18px; color: #666; margin-bottom: 40px;">
        Tỷ lệ chính xác: ${percentage}%
      </div>
      <button class="nav-btn" id="restartBtn" style="padding: 14px 40px; font-size: 16px;">
        🔄 Làm lại
      </button>
    </div>
  `;
  
  // Attach event listener
  document.getElementById('restartBtn').addEventListener('click', restartDictation);
}

// Lật flashcard
document.getElementById('flashcard').addEventListener('click', function() {
  this.classList.toggle('flipped');
});

// Kiểm tra dictation
document.getElementById('dictationInput').addEventListener('input', handleDictationInput);

// Navigation
document.getElementById('prevBtn').addEventListener('click', prevWord);
document.getElementById('nextBtn').addEventListener('click', nextWord);

function prevWord() {
  if (currentIndex > 0) {
    currentIndex--;
    showWord();
  }
}

function nextWord() {
  if (currentIndex < words.length - 1) {
    currentIndex++;
    showWord();
  } else if (currentMode === 'dictation') {
    // Dictation mode: chuyển sang màn hình hoàn thành
    currentIndex++;
    showDictationComplete();
    updateProgress();
  }
}

// Làm lại dictation
function restartDictation() {
  currentIndex = 0;
  correctCount = 0;
  attemptedWords.clear();
  
  // Recreate dictation HTML
  const container = document.getElementById('dictationMode');
  container.innerHTML = `
    <div class="dictation-definition" id="dictationDefinition"></div>
    <input 
      type="text" 
      class="dictation-input" 
      id="dictationInput" 
      placeholder="Nhập từ vựng..."
      autocomplete="off"
      spellcheck="false"
    >
    <div class="dictation-feedback" id="dictationFeedback"></div>
  `;
  
  // Re-attach event listener
  document.getElementById('dictationInput').addEventListener('input', handleDictationInput);
  
  showWord();
}

// Tách logic xử lý dictation input
function handleDictationInput() {
  const currentWord = words[currentIndex];
  const userInput = this.value.trim();
  const correctAnswer = currentWord.word;
  
  if (userInput.toLowerCase() === correctAnswer.toLowerCase()) {
    this.className = 'dictation-input correct';
    document.getElementById('dictationFeedback').innerHTML = 
      '<div class="feedback-correct">✓ Chính xác!</div>';
    
    // Đánh dấu đã trả lời đúng
    if (!attemptedWords.has(currentIndex)) {
      correctCount++;
      attemptedWords.add(currentIndex);
      updateProgress();
    }
    
    // Tự động chuyển sau 1s
    setTimeout(() => {
      nextWord();
    }, 1000);
  } else if (userInput.length > 0) {
    // Có input nhưng chưa đúng
    this.className = 'dictation-input';
    document.getElementById('dictationFeedback').innerHTML = '';
  }
}

// Update progress
function updateProgress() {
  const progressText = document.getElementById('progressText');
  const scoreText = document.getElementById('scoreText');
  const progressFill = document.getElementById('progressFill');
  
  // Xử lý khi đã hoàn thành dictation
  if (currentMode === 'dictation' && currentIndex >= words.length) {
    progressText.textContent = `Hoàn thành!`;
    progressFill.style.width = '100%';
    scoreText.textContent = `Đúng: ${correctCount}/${words.length}`;
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;
    return;
  }
  
  progressText.textContent = `Từ ${currentIndex + 1} / ${words.length}`;
  
  if (currentMode === 'dictation') {
    scoreText.textContent = `Đúng: ${correctCount}/${words.length}`;
  } else {
    scoreText.textContent = '';
  }
  
  const progress = ((currentIndex + 1) / words.length) * 100;
  progressFill.style.width = progress + '%';
  
  // Update navigation buttons
  document.getElementById('prevBtn').disabled = currentIndex === 0;
  document.getElementById('nextBtn').disabled = currentIndex === words.length - 1;
}

// Empty state
function showEmptyState() {
  document.getElementById('emptyState').classList.remove('hidden');
  document.getElementById('flashcardMode').classList.add('hidden');
  document.getElementById('dictationMode').classList.add('hidden');
  document.getElementById('progressBar').style.display = 'none';
  document.querySelector('.navigation').style.display = 'none';
}

function hideEmptyState() {
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('progressBar').style.display = 'block';
  document.querySelector('.navigation').style.display = 'flex';
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (currentMode === 'flashcard') {
    if (e.key === 'ArrowLeft') {
      prevWord();
    } else if (e.key === 'ArrowRight') {
      nextWord();
    } else if (e.key === ' ') {
      e.preventDefault();
      document.getElementById('flashcard').classList.toggle('flipped');
    }
  } else if (currentMode === 'dictation') {
    if (e.key === 'ArrowLeft' && e.ctrlKey) {
      prevWord();
    } else if (e.key === 'ArrowRight' && e.ctrlKey) {
      nextWord();
    }
  }
});
