// Lấy trạng thái hiện tại từ storage
chrome.storage.sync.get(['isEnabled'], function(result) {
  const isEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
  document.getElementById('toggleSwitch').checked = isEnabled;
  updateStatus(isEnabled);
});

// Xử lý sự kiện toggle
document.getElementById('toggleSwitch').addEventListener('change', function() {
  const isEnabled = this.checked;
  
  // Lưu trạng thái vào storage
  chrome.storage.sync.set({ isEnabled: isEnabled }, function() {
    updateStatus(isEnabled);
    
    // Reload trang hiện tại để áp dụng thay đổi
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });
});

function updateStatus(isEnabled) {
  const statusDiv = document.getElementById('status');
  if (isEnabled) {
    statusDiv.textContent = '✅ Extension đang hoạt động';
    statusDiv.className = 'status';
  } else {
    statusDiv.textContent = '❌ Extension đã tắt';
    statusDiv.className = 'status disabled';
  }
}

// Xử lý nút xem từ hay quên
document.getElementById('viewForgetfulWords').addEventListener('click', function() {
  chrome.tabs.create({ url: chrome.runtime.getURL('forgetful.html') });
});

// Xử lý nút bắt đầu ôn tập
document.getElementById('startPractice').addEventListener('click', function() {
  chrome.tabs.create({ url: chrome.runtime.getURL('practice.html') });
});

// Xử lý nút quản lý bộ từ
document.getElementById('manageSets').addEventListener('click', function() {
  chrome.tabs.create({ url: chrome.runtime.getURL('wordsets.html') });
});

// Xử lý nút cài đặt
document.getElementById('openOptions').addEventListener('click', function() {
  chrome.runtime.openOptionsPage();
});
