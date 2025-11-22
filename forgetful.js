// Load danh sách từ hay quên
function loadForgetfulWords() {
  chrome.storage.sync.get(['forgetfulWords', 'wordContents'], function(result) {
    const forgetfulWords = result.forgetfulWords || [];
    const wordContents = result.wordContents || {};
    
    const wordList = document.getElementById('wordList');
    const totalWords = document.getElementById('totalWords');
    
    totalWords.textContent = forgetfulWords.length;
    
    if (forgetfulWords.length === 0) {
      wordList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <div class="empty-state-text">Chưa có từ nào được đánh dấu</div>
          <div class="empty-state-hint">Click vào nút ⭐ trên trang web để đánh dấu từ hay quên</div>
        </div>
      `;
      return;
    }
    
    wordList.innerHTML = '';
    
    forgetfulWords.forEach((hash) => {
      const content = wordContents[hash] || 'Nội dung không có sẵn';
      
      const wordItem = document.createElement('div');
      wordItem.className = 'word-item';
      
      const wordContent = document.createElement('div');
      wordContent.className = 'word-content';
      wordContent.innerHTML = content;
      
      const wordActions = document.createElement('div');
      wordActions.className = 'word-actions';
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove';
      removeBtn.textContent = '❌ Bỏ đánh dấu';
      removeBtn.addEventListener('click', () => removeWord(hash));
      
      wordActions.appendChild(removeBtn);
      wordItem.appendChild(wordContent);
      wordItem.appendChild(wordActions);
      wordList.appendChild(wordItem);
    });
  });
}

// Xóa một từ
function removeWord(hash) {
  chrome.storage.sync.get(['forgetfulWords', 'wordContents'], function(result) {
    let forgetfulWords = result.forgetfulWords || [];
    let wordContents = result.wordContents || {};
    
    forgetfulWords = forgetfulWords.filter(h => h !== hash);
    delete wordContents[hash];
    
    chrome.storage.sync.set({ 
      forgetfulWords: forgetfulWords,
      wordContents: wordContents
    }, function() {
      loadForgetfulWords();
    });
  });
}

// Xóa tất cả
document.getElementById('clearBtn').addEventListener('click', function() {
  if (confirm('Bạn có chắc muốn xóa tất cả từ hay quên?')) {
    chrome.storage.sync.set({ 
      forgetfulWords: [],
      wordContents: {}
    }, function() {
      loadForgetfulWords();
    });
  }
});

// Xuất danh sách
document.getElementById('exportBtn').addEventListener('click', function() {
  chrome.storage.sync.get(['forgetfulWords', 'wordContents'], function(result) {
    const forgetfulWords = result.forgetfulWords || [];
    const wordContents = result.wordContents || {};
    
    let text = 'DANH SÁCH TỪ HAY QUÊN\n';
    text += '='.repeat(50) + '\n\n';
    
    forgetfulWords.forEach((hash, index) => {
      const content = wordContents[hash] || 'Nội dung không có sẵn';
      text += `${index + 1}. ${content.replace(/<[^>]*>/g, '')}\n\n`;
    });
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tu-hay-quen.txt';
    a.click();
    URL.revokeObjectURL(url);
  });
});

// Load khi trang được mở
loadForgetfulWords();
