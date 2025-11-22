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
