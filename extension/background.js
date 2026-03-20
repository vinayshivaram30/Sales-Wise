// Update API_BASE and WS_BASE before deploying
const API_BASE = "https://backend-production-71f1.up.railway.app";
const WS_BASE = "wss://backend-production-71f1.up.railway.app";

let ws = null;
let callId = null;

// Open side panel when extension icon clicked
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

// Open side panel automatically on Google Meet tabs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('meet.google.com')) {
    await chrome.sidePanel.setOptions({ tabId, path: 'sidepanel.html', enabled: true });
  }
});

// Handle messages from content scripts and external pages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SET_TOKEN') {
    chrome.storage.local.set({ token: msg.token });
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === 'SET_CALL') {
    chrome.storage.local.set({ active_call_id: msg.callId });
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === 'START_CALL') {
    callId = msg.callId;
    const token = msg.token;
    startWebSocket(callId, token);
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === 'STOP_CALL') {
    stopCall();
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === 'AUDIO_CHUNK') {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const binary = atob(msg.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      ws.send(bytes.buffer);
    }
    return true;
  }
  if (msg.type === 'SUGGESTION_ACTION') {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'suggestion_action',
        suggestion_id: msg.suggestion_id,
        status: msg.status
      }));
    }
    return true;
  }
  if (msg.type === 'AUDIO_CAPTURE_FAILED') {
    broadcastToSidepanel({ type: 'AUDIO_CAPTURE_FAILED', error: msg.error });
    return true;
  }
  if (msg.type === 'MANUAL_TRANSCRIPT') {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'manual_transcript',
        text: msg.text
      }));
    } else {
      broadcastToSidepanel({ type: 'error', message: 'WebSocket not connected. Start a call first.' });
    }
    return true;
  }
  if (msg.type === 'FETCH_APP_DATA') {
    // Try all tabs - content script only responds from web app tabs
    chrome.tabs.query({}, (tabs) => {
      let done = false;
      let tried = 0;
      const tryNext = (i) => {
        if (done || i >= tabs.length) {
          if (!done) sendResponse({ ok: false, error: 'No web app tab found. Keep the app open (e.g. localhost:5173 or your deployed URL).' });
          return;
        }
        if (tabs[i].url?.startsWith('chrome://') || tabs[i].url?.startsWith('chrome-extension://')) {
          tryNext(i + 1);
          return;
        }
        chrome.tabs.sendMessage(tabs[i].id, { type: 'GET_APP_DATA' }, (data) => {
          if (chrome.runtime.lastError) { tryNext(i + 1); return; }
          if (data?.token && data?.active_call_id) {
            done = true;
            chrome.storage.local.set({ token: data.token, active_call_id: data.active_call_id });
            sendResponse({ ok: true });
          } else {
            tryNext(i + 1);
          }
        });
      };
      tryNext(0);
    });
    return true;
  }
});

function startWebSocket(cid, token) {
  ws = new WebSocket(`${WS_BASE}/ws/call/${cid}?token=${token}`);

  ws.onopen = () => {
    console.log('[Sales-wise] WebSocket connected');
    broadcastToSidepanel({ type: 'WS_CONNECTED' });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'START_AUDIO_CAPTURE' });
      }
    });
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    broadcastToSidepanel(msg);
  };

  ws.onclose = () => {
    console.log('[Sales-wise] WebSocket closed');
    broadcastToSidepanel({ type: 'WS_DISCONNECTED' });
  };

  ws.onerror = (e) => {
    console.error('[Sales-wise] WebSocket error', e);
    broadcastToSidepanel({ type: 'WS_ERROR' });
  };
}

function stopCall() {
  if (ws) {
    ws.send(JSON.stringify({ type: 'stop' }));
    ws.close();
    ws = null;
  }
}

function broadcastToSidepanel(msg) {
  chrome.runtime.sendMessage(msg).catch(() => {});
}
