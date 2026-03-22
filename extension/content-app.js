// Content script for the Sales-Wise web app - receives token/callId from login and plan generation
(function() {
  // Auto-init: push token and call ID to background on load (no postMessage needed)
  setTimeout(() => {
    try {
      const token = localStorage.getItem('token');
      const callId = localStorage.getItem('active_call_id');
      if (token) {
        chrome.runtime.sendMessage({ type: 'SET_TOKEN', token }).catch(() => {});
      }
      if (callId) {
        chrome.runtime.sendMessage({ type: 'SET_CALL', callId }).catch(() => {});
      }
    } catch (e) {
      // localStorage may be unavailable in some contexts
    }
  }, 500);

  // Forward postMessage from web app to extension (real-time updates)
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data?.type === 'SALESWISE_SET_TOKEN') {
      chrome.runtime.sendMessage({ type: 'SET_TOKEN', token: event.data.token }).catch(() => {});
    }
    if (event.data?.type === 'SALESWISE_SET_CALL') {
      chrome.runtime.sendMessage({ type: 'SET_CALL', callId: event.data.callId }).catch(() => {});
    }
  });

  // When extension asks for data, read from localStorage (fallback if postMessage didn't work)
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_APP_DATA') {
      const token = localStorage.getItem('token');
      const callId = localStorage.getItem('active_call_id');
      sendResponse({ token, active_call_id: callId });
    }
    return true; // Keep channel open for async sendResponse
  });
})();
