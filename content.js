// Kiểm tra trạng thái extension từ storage
let isEnabled = true;

// Lấy trạng thái từ storage khi load trang
chrome.storage.sync.get(['isEnabled'], function(result) {
  isEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
  if (isEnabled) {
    processDefinitions();
  } else {
    // Nếu tắt thì không làm gì, để hiển thị bình thường
    removeAllToggles();
  }
});

// Lắng nghe thay đổi từ popup
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (changes.isEnabled) {
    isEnabled = changes.isEnabled.newValue;
    if (isEnabled) {
      processDefinitions();
    } else {
      removeAllToggles();
    }
  }
});

function processDefinitions() {
  // Tìm tất cả các thẻ div có class "prewrap mb-2"
  const divs = document.querySelectorAll('div.prewrap.mb-2');
  
  divs.forEach((div) => {
    // Kiểm tra xem đã xử lý chưa
    if (div.dataset.processed) return;
    
    const originalContent = div.innerHTML;
    const contentHash = hashContent(originalContent);
    
    // Tìm thẻ từ vựng (h2) gần nhất phía trên
    const wordInfo = findNearestWordHeader(div);
    
    // Tạo container mới
    const container = document.createElement('div');
    container.className = 'translation-container';
    container.style.cssText = div.style.cssText;
    container.dataset.contentHash = contentHash;
    container.dataset.wordInfo = wordInfo;
    
    // Nút toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-definition-btn';
    toggleBtn.innerHTML = '👁️';
    toggleBtn.title = 'Click để hiện/ẩn định nghĩa';
    
    // Nút đánh dấu hay quên
    const markBtn = document.createElement('button');
    markBtn.className = 'mark-btn';
    markBtn.innerHTML = '⭐';
    markBtn.title = 'Đánh dấu hay quên';
    
    // Tag "hay quên"
    const forgetTag = document.createElement('span');
    forgetTag.className = 'forget-tag hidden';
    forgetTag.textContent = 'Hay quên';
    
    // Phần nội dung (ẩn mặc định)
    const contentPart = document.createElement('div');
    contentPart.className = 'content-part hidden';
    contentPart.innerHTML = originalContent;
    
    // Kiểm tra xem từ này đã được đánh dấu chưa
    chrome.storage.sync.get(['forgetfulWords'], function(result) {
      const forgetfulWords = result.forgetfulWords || [];
      if (forgetfulWords.includes(contentHash)) {
        markBtn.classList.add('marked');
        forgetTag.classList.remove('hidden');
      }
    });
    
    // Xử lý sự kiện click toggle
    toggleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      contentPart.classList.toggle('hidden');
      toggleBtn.innerHTML = contentPart.classList.contains('hidden') ? '👁️' : '🙈';
    });
    
    // Xử lý sự kiện đánh dấu
    markBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      chrome.storage.sync.get(['forgetfulWords', 'wordContents'], function(result) {
        let forgetfulWords = result.forgetfulWords || [];
        let wordContents = result.wordContents || {};
        
        if (forgetfulWords.includes(contentHash)) {
          // Bỏ đánh dấu
          forgetfulWords = forgetfulWords.filter(h => h !== contentHash);
          delete wordContents[contentHash];
          markBtn.classList.remove('marked');
          forgetTag.classList.add('hidden');
        } else {
          // Đánh dấu - kết hợp từ vựng + định nghĩa
          forgetfulWords.push(contentHash);
          const fullContent = wordInfo 
            ? `<div class="word-header"><strong>${wordInfo}</strong></div><div class="word-definition">${originalContent}</div>`
            : originalContent;
          wordContents[contentHash] = fullContent;
          markBtn.classList.add('marked');
          forgetTag.classList.remove('hidden');
        }
        
        chrome.storage.sync.set({ 
          forgetfulWords: forgetfulWords,
          wordContents: wordContents
        });
      });
    });
    
    // Tạo button group
    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group';
    btnGroup.appendChild(toggleBtn);
    btnGroup.appendChild(markBtn);
    
    // Thêm các phần tử vào container
    container.appendChild(btnGroup);
    container.appendChild(forgetTag);
    container.appendChild(contentPart);
    
    // Thay thế div gốc bằng container mới
    div.parentNode.replaceChild(container, div);
    container.dataset.processed = 'true';
  });
}

// Hàm hash nội dung để tạo ID duy nhất
function hashContent(content) {
  let hash = 0;
  const str = content.trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

// Tìm thẻ h2 chứa từ vựng gần nhất phía trên
function findNearestWordHeader(element) {
  let current = element.previousElementSibling;
  let searchLimit = 20; // Giới hạn tìm kiếm 20 element
  
  while (current && searchLimit > 0) {
    // Tìm h2 có class "h3"
    if (current.tagName === 'H2' && current.classList.contains('h3')) {
      return extractWordInfo(current);
    }
    
    // Tìm trong các element cha/anh em
    const h2 = current.querySelector('h2.h3');
    if (h2) {
      return extractWordInfo(h2);
    }
    
    current = current.previousElementSibling;
    searchLimit--;
  }
  
  return null;
}

// Trích xuất thông tin từ vựng từ thẻ h2
function extractWordInfo(h2Element) {
  try {
    // Lấy tên từ (text node đầu tiên, loại bỏ khoảng trắng)
    let word = '';
    for (let node of h2Element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text && !text.startsWith('/')) {
          word = text;
          break;
        }
      }
    }
    
    // Lấy loại từ (v), (n), (adj)...
    const typeSpan = h2Element.querySelector('span');
    const wordType = typeSpan ? typeSpan.textContent.trim() : '';
    
    // Lấy phát âm /.../ 
    let pronunciation = '';
    const spans = h2Element.querySelectorAll('span');
    for (let span of spans) {
      const text = span.textContent.trim();
      if (text.startsWith('/') && text.endsWith('/')) {
        pronunciation = text;
        break;
      }
    }
    
    // Kết hợp: word (type) /pronunciation/
    let result = word;
    if (wordType) result += ` ${wordType}`;
    if (pronunciation) result += ` ${pronunciation}`;
    
    return result || null;
  } catch (e) {
    console.error('Error extracting word info:', e);
    return null;
  }
}

function removeAllToggles() {
  const containers = document.querySelectorAll('.translation-container');
  containers.forEach((container) => {
    const content = container.querySelector('.content-part')?.innerHTML || '';
    
    const originalDiv = document.createElement('div');
    originalDiv.className = 'prewrap mb-2';
    originalDiv.innerHTML = content;
    
    container.parentNode.replaceChild(originalDiv, container);
  });
}

// Theo dõi các thay đổi DOM để xử lý nội dung được thêm động
const observer = new MutationObserver(function(mutations) {
  if (isEnabled) {
    processDefinitions();
  }
});

// Bắt đầu theo dõi
observer.observe(document.body, {
  childList: true,
  subtree: true
});
