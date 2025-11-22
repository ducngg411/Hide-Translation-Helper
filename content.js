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
    
    // Tạo container mới
    const container = document.createElement('div');
    container.className = 'translation-container';
    container.style.cssText = div.style.cssText;
    container.dataset.contentHash = contentHash;
    
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
      
      chrome.storage.sync.get(['forgetfulWords'], function(result) {
        let forgetfulWords = result.forgetfulWords || [];
        
        if (forgetfulWords.includes(contentHash)) {
          // Bỏ đánh dấu
          forgetfulWords = forgetfulWords.filter(h => h !== contentHash);
          markBtn.classList.remove('marked');
          forgetTag.classList.add('hidden');
        } else {
          // Đánh dấu
          forgetfulWords.push(contentHash);
          markBtn.classList.add('marked');
          forgetTag.classList.remove('hidden');
        }
        
        chrome.storage.sync.set({ forgetfulWords: forgetfulWords });
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
