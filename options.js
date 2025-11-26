// Load saved API key
document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get(['geminiApiKey'], function(result) {
    if (result.geminiApiKey) {
      document.getElementById('apiKey').value = result.geminiApiKey;
    }
  });
});

// Save API key
document.getElementById('saveBtn').addEventListener('click', function() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const statusDiv = document.getElementById('status');
  
  if (!apiKey) {
    statusDiv.textContent = '❌ Vui lòng nhập API key';
    statusDiv.className = 'status error';
    return;
  }
  
  chrome.storage.sync.set({ geminiApiKey: apiKey }, function() {
    statusDiv.textContent = '✅ Đã lưu thành công!';
    statusDiv.className = 'status success';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  });
});
