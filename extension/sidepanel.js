const MEDDIC_LABELS = {
  metrics: 'Metrics', econ_buyer: 'Econ. buyer',
  decision_criteria: 'Decision criteria', decision_process: 'Decision process',
  pain: 'Pain', champion: 'Champion'
};

let callId = null;
let token = null;
let callsWithPlan = [];

function updateFromStorage() {
  chrome.storage.local.get(['active_call_id', 'token'], (res) => {
    callId = res.active_call_id;
    token = res.token;
    updateUI();
  });
}

function updateUI() {
  const infoEl = document.getElementById('call-info');
  const loginMsg = document.getElementById('login-msg');
  const callSelectWrap = document.getElementById('call-select-wrap');
  const startBtn = document.getElementById('start-btn');

  if (!token) {
    loginMsg.style.display = 'block';
    callSelectWrap.style.display = 'none';
    startBtn.style.display = 'none';
    if (infoEl) infoEl.textContent = '';
    return;
  }
  loginMsg.style.display = 'none';
  callSelectWrap.style.display = 'block';
  startBtn.style.display = callsWithPlan.length > 0 ? 'block' : 'none';

  if (callId && infoEl) {
    const name = callsWithPlan.find(c => c.id === callId)?.name || callId;
    infoEl.textContent = name.length > 24 ? name.slice(0, 21) + '...' : name;
  } else if (infoEl) {
    infoEl.textContent = '';
  }
}

async function fetchCallsWithPlan() {
  if (!token) return [];
  const r = await fetch(`${API_BASE}/calls?with_plan_only=true`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  if (!r.ok) return [];
  return r.json();
}

async function loadCallsDropdown() {
  callsWithPlan = await fetchCallsWithPlan();
  const sel = document.getElementById('call-select');
  sel.innerHTML = '<option value="">Select a call...</option>' +
    callsWithPlan.map(c => `<option value="${c.id}">${c.name || c.id}</option>`).join('');
  if (callId && callsWithPlan.some(c => c.id === callId)) sel.value = callId;
  updateUI();
}

updateFromStorage();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.active_call_id || changes.token)) {
    updateFromStorage();
  }
});

// Load calls on init
chrome.storage.local.get(['token'], (res) => {
  if (res.token) loadCallsDropdown();
});

document.getElementById('call-select').addEventListener('change', (e) => {
  callId = e.target.value || null;
  if (callId) {
    chrome.storage.local.set({ active_call_id: callId });
    updateUI();
  }
});

document.getElementById('start-btn').addEventListener('click', () => {
  const sel = document.getElementById('call-select');
  const selectedId = sel?.value || callId;
  if (!selectedId || !token) {
    chrome.runtime.sendMessage({ type: 'FETCH_APP_DATA' }, (response) => {
      if (response?.ok) {
        updateFromStorage();
        setTimeout(() => {
          chrome.storage.local.get(['active_call_id', 'token'], (res) => {
            callId = res.active_call_id;
            token = res.token;
            if (callId && token) {
              doStartCall(callId);
            } else {
              alert('Select a call from the dropdown, or log in to the web app and create a plan first.');
            }
          });
        }, 100);
      } else {
        alert('Select a call from the dropdown. Create a plan in the web app first.');
      }
    });
    return;
  }
  doStartCall(selectedId);
});

function doStartCall(cid) {
  chrome.runtime.sendMessage({ type: 'START_CALL', callId: cid, token }, (res) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    callId = cid;
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('call-select-wrap').style.display = 'none';
  });
}

document.getElementById('end-btn').addEventListener('click', async () => {
  if (!callId || !token) return;
  const btn = document.getElementById('end-btn');
  btn.disabled = true;
  btn.textContent = 'Generating summary...';
  chrome.runtime.sendMessage({ type: 'STOP_CALL' }, () => {
    (async () => {
      try {
        const summariseRes = await fetch(`${API_BASE}/postcall/${callId}/summarise`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (!summariseRes.ok) throw new Error('Summarise failed');
        const detailRes = await fetch(`${API_BASE}/calls/${callId}/detail`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!detailRes.ok) throw new Error('Fetch detail failed');
        const detail = await detailRes.json();
        renderPostCallSummary(detail);
      } catch (e) {
        document.getElementById('postcall-summary').innerHTML = `<p style="color:#dc2626">Failed to generate summary. ${e?.message || 'No transcript?'} Try again in the web app.</p>`;
      }
      btn.disabled = false;
      btn.textContent = 'End call & generate summary';
      btn.style.display = 'none';
      document.getElementById('start-btn').style.display = 'block';
      document.getElementById('call-select-wrap').style.display = 'block';
      document.getElementById('meddic').style.display = 'none';
      document.getElementById('transcript').style.display = 'none';
      document.getElementById('suggestion-area').innerHTML = '';
      const txLines = document.getElementById('transcript-lines');
      if (txLines) txLines.innerHTML = '';
      setLive(false);
    })();
  });
});

function renderPostCallSummary(detail) {
  const summary = detail.summary;
  const container = document.getElementById('postcall-summary');
  container.style.display = 'block';
  if (!summary) {
    container.innerHTML = '<p>No summary available.</p>';
    return;
  }
  const meddic = summary.meddic_state || {};
  const objections = summary.objections || [];
  const nextSteps = summary.next_steps || [];
  const coaching = summary.coaching || [];
  container.innerHTML = `
    <div class="summary-section">
      <h4>Summary</h4>
      <p>${(summary.summary_text || '').replace(/</g, '&lt;')}</p>
    </div>
    <div class="summary-section">
      <h4>MEDDIC</h4>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        ${Object.entries(meddic).map(([k, v]) => `<span class="med-pill ${v ? 'med-done' : 'med-open'}">${MEDDIC_LABELS[k] || k}: ${v || '-'}</span>`).join('')}
      </div>
    </div>
    ${objections.length ? `<div class="summary-section"><h4>Objections</h4><ul>${objections.map(o => `<li>"${(o.text || '').replace(/</g, '&lt;')}" ${o.handled ? '✓' : '✗'} ${(o.response || '').replace(/</g, '&lt;')}</li>`).join('')}</ul></div>` : ''}
    ${nextSteps.length ? `<div class="summary-section"><h4>Next steps</h4><ul>${nextSteps.map(ns => `<li>${(ns.text || '').replace(/</g, '&lt;')} (${ns.owner || '-'})</li>`).join('')}</ul></div>` : ''}
    ${coaching.length ? `<div class="summary-section"><h4>Coaching</h4><ul>${coaching.map(c => `<li>${(c.note || '').replace(/</g, '&lt;')}</li>`).join('')}</ul></div>` : ''}
  `;
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'WS_CONNECTED') {
    setLive(true);
    document.getElementById('meddic').style.display = 'block';
    document.getElementById('transcript').style.display = 'block';
    document.getElementById('end-btn').style.display = 'block';
    document.getElementById('postcall-summary').style.display = 'none';
  }

  if (msg.type === 'WS_DISCONNECTED' || msg.type === 'WS_ERROR') {
    document.getElementById('end-btn').style.display = 'none';
    setLive(false);
  }

  if (msg.type === 'AUDIO_MISSING_CHECKBOX') {
    document.getElementById('audio-warning').style.display = 'block';
  }

  if (msg.type === 'suggestion') {
    renderSuggestion(msg.payload);
  }

  if (msg.type === 'meddic_update') {
    renderMEDDIC(msg.payload);
  }

  if (msg.type === 'objection') {
    renderObjection(msg.payload);
  }

  if (msg.type === 'transcript') {
    appendTranscript(msg.payload?.text || '', 'unknown');
  }
});

function setLive(live) {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  dot.className = live ? 'live' : '';
  text.textContent = live ? 'Live' : 'Disconnected';
}

function renderMEDDIC(state) {
  const container = document.getElementById('meddic-pills');
  if (!container) return;
  container.innerHTML = Object.entries(state).map(([k, v]) => {
    const cls = v === null ? 'med-open' : v === 'in_progress' ? 'med-active' : 'med-done';
    return `<span class="med-pill ${cls}">${MEDDIC_LABELS[k] || k}</span>`;
  }).join('');
}

function renderSuggestion(s) {
  const area = document.getElementById('suggestion-area');
  area.querySelectorAll('.sug-card').forEach(c => c.remove());

  const card = document.createElement('div');
  card.className = 'sug-card';
  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
      <span class="sug-tag">${MEDDIC_LABELS[s.meddic_field] || s.meddic_field}</span>
    </div>
    <p class="sug-why">${s.why}</p>
    <p class="sug-q">"${s.question}"</p>
    <div class="sug-btns">
      <button class="btn-used" data-id="${s.id}" data-action="used">Used it</button>
      <button data-id="${s.id}" data-action="skipped">Skip</button>
    </div>`;

  card.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      chrome.runtime.sendMessage({ type: 'SUGGESTION_ACTION', suggestion_id: id, status: action });
      if (action === 'used') card.style.opacity = '0.4';
      else card.remove();
    });
  });

  area.prepend(card);
  appendTranscript(`Suggestion [${MEDDIC_LABELS[s.meddic_field]}]: "${s.question}"`, 'rep');
}

function renderObjection(o) {
  const area = document.getElementById('suggestion-area');
  const card = document.createElement('div');
  card.className = 'obj-card';
  card.innerHTML = `
    <p class="obj-label">Objection detected</p>
    <p style="font-size:12px;color:#92400e">"${o.text}"</p>
    <p class="obj-label" style="margin-top:6px">Suggested response</p>
    <p class="obj-resp">${o.response}</p>`;
  area.prepend(card);
}

function appendTranscript(text, speaker) {
  const lines = document.getElementById('transcript-lines');
  if (!lines) return;
  const line = document.createElement('div');
  line.className = `tx-line ${speaker === 'rep' ? 'tx-rep' : ''}`;
  line.textContent = text;
  lines.appendChild(line);
  while (lines.children.length > 20) lines.removeChild(lines.firstChild);
}
