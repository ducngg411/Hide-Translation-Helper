let allWords = [];
let wordSets = [];
let wordsByDate = {};
let currentFilter = 'all';

// Load dữ liệu
chrome.storage.sync.get(['forgetfulWords', 'wordContents', 'wordSets', 'wordTimestamps'], function(result) {
  const forgetfulWords = result.forgetfulWords || [];
  const wordContents = result.wordContents || {};
  const wordTimestamps = result.wordTimestamps || {};
  wordSets = result.wordSets || [];
  
  // Parse all words
  allWords = forgetfulWords.map(hash => {
    const content = wordContents[hash] || '';
    const timestamp = wordTimestamps[hash] || new Date().toISOString();
    return {
      hash: hash,
      timestamp: timestamp,
      date: new Date(timestamp).toLocaleDateString('vi-VN'),
      ...parseWordContent(content)
    };
  }).filter(w => w.word);
  
  // Sắp xếp theo thời gian (mới nhất trước)
  allWords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Nhóm theo ngày
  groupWordsByDate();
  
  renderWordList();
  renderSetsList();
  setupFilters();
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
    word = fullHeader.split(/[\(\/]/)[0].trim();
  }
  
  if (definitionEl) {
    definition = definitionEl.textContent.trim();
  } else {
    const text = temp.textContent.trim();
    definition = text;
    word = text.split(/[\(\/=]/)[0].trim();
  }
  
  return { word, fullHeader: fullHeader || word, definition };
}

// Nhóm từ theo ngày
function groupWordsByDate() {
  wordsByDate = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  allWords.forEach(word => {
    const wordDate = new Date(word.timestamp);
    wordDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - wordDate) / (1000 * 60 * 60 * 24));
    
    let label;
    if (diffDays === 0) {
      label = 'Hôm nay';
    } else if (diffDays === 1) {
      label = 'Hôm qua';
    } else if (diffDays <= 7) {
      label = `${diffDays} ngày trước`;
    } else if (diffDays <= 30) {
      label = `${Math.floor(diffDays / 7)} tuần trước`;
    } else {
      label = word.date;
    }
    
    if (!wordsByDate[label]) {
      wordsByDate[label] = [];
    }
    wordsByDate[label].push(word);
  });
}

// Lọc từ theo thời gian
function filterWords(filter) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return allWords.filter(word => {
    const wordDate = new Date(word.timestamp);
    wordDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - wordDate) / (1000 * 60 * 60 * 24));
    
    switch(filter) {
      case 'today':
        return diffDays === 0;
      case 'yesterday':
        return diffDays === 1;
      case 'week':
        return diffDays <= 7;
      case 'month':
        return diffDays <= 30;
      default:
        return true;
    }
  });
}

// Render danh sách từ vựng theo nhóm ngày
function renderWordList() {
  const container = document.getElementById('wordList');
  const wordCount = document.getElementById('wordCount');
  
  const filteredWords = filterWords(currentFilter);
  
  if (filteredWords.length === 0) {
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Không có từ nào trong khoảng thời gian này</div>';
    wordCount.textContent = '(0 từ)';
    return;
  }
  
  wordCount.textContent = `(${filteredWords.length} từ)`;
  
  // Nhóm lại theo ngày cho filtered words
  const groupedFiltered = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  filteredWords.forEach(word => {
    const wordDate = new Date(word.timestamp);
    wordDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - wordDate) / (1000 * 60 * 60 * 24));
    
    let label;
    if (diffDays === 0) {
      label = 'Hôm nay';
    } else if (diffDays === 1) {
      label = 'Hôm qua';
    } else if (diffDays <= 7) {
      label = `${diffDays} ngày trước`;
    } else if (diffDays <= 30) {
      label = `${Math.floor(diffDays / 7)} tuần trước`;
    } else {
      label = word.date;
    }
    
    if (!groupedFiltered[label]) {
      groupedFiltered[label] = [];
    }
    groupedFiltered[label].push(word);
  });
  
  // Render theo nhóm
  let html = '';
  Object.keys(groupedFiltered).forEach(dateLabel => {
    const words = groupedFiltered[dateLabel];
    html += `
      <div class="date-group">
        <div class="date-group-header">
          <span>${dateLabel}</span>
          <span class="date-group-count">${words.length} từ</span>
        </div>
        ${words.map((word, index) => `
          <div class="word-checkbox">
            <input type="checkbox" class="word-cb" id="word-${word.hash}" value="${word.hash}">
            <label class="word-checkbox-label" for="word-${word.hash}">
              <strong>${word.fullHeader}</strong><br>
              <span style="color: #666; font-size: 13px;">${word.definition.substring(0, 80)}${word.definition.length > 80 ? '...' : ''}</span>
            </label>
          </div>
        `).join('')}
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Setup filter buttons
function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      currentFilter = this.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('selectAll').checked = false;
      renderWordList();
    });
  });
}

// Select all checkbox
document.getElementById('selectAll').addEventListener('change', function() {
  const checkboxes = document.querySelectorAll('.word-cb');
  checkboxes.forEach(cb => cb.checked = this.checked);
});

// Tạo bộ từ mới
document.getElementById('createBtn').addEventListener('click', function() {
  const setName = document.getElementById('setName').value.trim();
  
  if (!setName) {
    alert('Vui lòng nhập tên bộ từ');
    return;
  }
  
  const selectedHashes = Array.from(document.querySelectorAll('.word-cb:checked'))
    .map(cb => cb.value);
  
  if (selectedHashes.length === 0) {
    alert('Vui lòng chọn ít nhất 1 từ');
    return;
  }
  
  const newSet = {
    id: Date.now().toString(),
    name: setName,
    wordHashes: selectedHashes,
    createdAt: new Date().toISOString()
  };
  
  wordSets.push(newSet);
  
  chrome.storage.sync.set({ wordSets: wordSets }, function() {
    alert(`Đã tạo bộ từ "${setName}" với ${selectedHashes.length} từ`);
    document.getElementById('setName').value = '';
    document.querySelectorAll('.word-cb').forEach(cb => cb.checked = false);
    document.getElementById('selectAll').checked = false;
    renderSetsList();
  });
});

// Render danh sách bộ từ
function renderSetsList() {
  const container = document.getElementById('setsList');
  
  if (wordSets.length === 0) {
    container.innerHTML = '<div class="empty-state">Chưa có bộ từ nào</div>';
    return;
  }
  
  container.innerHTML = wordSets.map(set => `
    <div class="set-item">
      <div class="set-header">
        <div class="set-name">${set.name}</div>
        <div class="set-count">${set.wordHashes.length} từ</div>
      </div>
      <div class="set-actions">
        <button class="btn-set" onclick="practiceSet('${set.id}')">🎯 Luyện tập</button>
        <button class="btn-set btn-delete" onclick="deleteSet('${set.id}')">🗑️ Xóa</button>
      </div>
    </div>
  `).join('');
}

// Luyện tập bộ từ
window.practiceSet = function(setId) {
  chrome.tabs.create({ 
    url: chrome.runtime.getURL('practice.html') + '?setId=' + setId 
  });
};

// Xóa bộ từ
window.deleteSet = function(setId) {
  if (!confirm('Bạn có chắc muốn xóa bộ từ này?')) return;
  
  wordSets = wordSets.filter(s => s.id !== setId);
  chrome.storage.sync.set({ wordSets: wordSets }, function() {
    renderSetsList();
  });
};
