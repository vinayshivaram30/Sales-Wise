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

// Initialize: try storage first, then auto-fetch from web app tabs
function init() {
  chrome.storage.local.get(['token', 'active_call_id'], (res) => {
    token = res.token;
    callId = res.active_call_id;

    if (token) {
      updateUI();
      loadCallsDropdown();
    } else {
      // Token not in extension storage — pull from web app tab automatically
      chrome.runtime.sendMessage({ type: 'FETCH_APP_DATA' }, (response) => {
        if (chrome.runtime.lastError) {
          updateUI();
          return;
        }
        if (response?.ok) {
          chrome.storage.local.get(['token', 'active_call_id'], (r) => {
            token = r.token;
            callId = r.active_call_id;
            updateUI();
            if (token) loadCallsDropdown();
          });
        } else {
          updateUI();
        }
      });
    }
  });
}

init();

// React to storage changes (e.g. user logs in while panel is open)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.token) token = changes.token.newValue;
    if (changes.active_call_id) {
      callId = changes.active_call_id.newValue;
    }
    updateUI();
    if (token && changes.token) loadCallsDropdown();
  }
});

document.getElementById('retry-btn').addEventListener('click', init);

function showStatus(msg) {
  const el = document.getElementById('status-msg');
  if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
}


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

function buildTutorialOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'audio-tutorial';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'padding:16px;background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;margin:12px;color:#e0e0e0;font-size:13px';

  const heading = document.createElement('h3');
  heading.textContent = 'Before you start';
  heading.style.cssText = 'margin:0 0 12px;color:#818cf8;font-size:15px;font-weight:600';
  wrapper.appendChild(heading);

  const intro = document.createElement('p');
  intro.style.cssText = 'margin:0 0 10px;line-height:1.5';
  intro.textContent = 'Chrome will ask to share this tab. For live coaching to work:';
  wrapper.appendChild(intro);

  const stepsBox = document.createElement('div');
  stepsBox.style.cssText = 'background:#0f0f1e;border:1px solid #2a2a4a;border-radius:8px;padding:12px;margin:0 0 12px';

  function makeStep(num, text, highlight) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px';
    const badge = document.createElement('span');
    badge.textContent = num;
    badge.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#818cf8;color:white;border-radius:50%;font-size:11px;font-weight:700;flex-shrink:0';
    const label = document.createElement('span');
    if (highlight) {
      label.textContent = text.split(highlight)[0];
      const strong = document.createElement('strong');
      strong.textContent = highlight;
      strong.style.color = '#f97316';
      label.appendChild(strong);
      const rest = text.split(highlight)[1];
      if (rest) label.appendChild(document.createTextNode(rest));
    } else {
      label.textContent = text;
    }
    row.appendChild(badge);
    row.appendChild(label);
    return row;
  }

  stepsBox.appendChild(makeStep('1', 'Select the Google Meet tab in the dialog'));
  stepsBox.appendChild(makeStep('2', 'Check "Also share tab audio" at the bottom', '"Also share tab audio"'));
  stepsBox.lastChild.style.marginBottom = '0';
  wrapper.appendChild(stepsBox);

  const note = document.createElement('p');
  note.textContent = 'Without tab audio, Sales-Wise can\'t hear the conversation.';
  note.style.cssText = 'margin:0 0 14px;font-size:11px;color:#9ca3af';
  wrapper.appendChild(note);

  const btn = document.createElement('button');
  btn.id = 'audio-tutorial-continue';
  btn.textContent = 'Got it — start copilot';
  btn.style.cssText = 'width:100%;padding:10px;background:#818cf8;color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer';
  wrapper.appendChild(btn);

  overlay.appendChild(wrapper);
  return overlay;
}

function showAudioTutorial(onContinue) {
  chrome.storage.local.get(['audio_tutorial_seen'], (res) => {
    if (res.audio_tutorial_seen) {
      onContinue();
      return;
    }
    const overlay = buildTutorialOverlay();
    document.body.insertBefore(overlay, document.getElementById('status-msg'));
    document.getElementById('audio-tutorial-continue').addEventListener('click', () => {
      chrome.storage.local.set({ audio_tutorial_seen: true });
      overlay.remove();
      onContinue();
    });
  });
}

function doStartCall(cid) {
  showAudioTutorial(() => {
    chrome.runtime.sendMessage({ type: 'START_CALL', callId: cid, token }, (res) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      callId = cid;
      document.getElementById('start-btn').style.display = 'none';
      document.getElementById('call-select-wrap').style.display = 'none';
    });
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
        const sugArea = document.getElementById('suggestion-area');
      while (sugArea.firstChild) sugArea.removeChild(sugArea.firstChild);
      const txLines = document.getElementById('transcript-lines');
      if (txLines) while (txLines.firstChild) txLines.removeChild(txLines.firstChild);
      showStatus('');
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
    showStatus('Connected. Waiting for audio...');
    document.getElementById('meddic').style.display = 'block';
    document.getElementById('transcript').style.display = 'block';
    document.getElementById('end-btn').style.display = 'block';
    document.getElementById('postcall-summary').style.display = 'none';
  }

  if (msg.type === 'WS_DISCONNECTED') {
    document.getElementById('end-btn').style.display = 'none';
    showStatus('Disconnected from server.');
    setLive(false);
  }

  if (msg.type === 'WS_ERROR') {
    document.getElementById('end-btn').style.display = 'none';
    showStatus('WebSocket error — check if the backend is running.');
    setLive(false);
  }

  if (msg.type === 'AUDIO_MISSING_CHECKBOX') {
    document.getElementById('audio-warning').style.display = 'block';
    showStatus('No tab audio detected. Please share tab audio.');
  }

  if (msg.type === 'AUDIO_CAPTURE_FAILED') {
    showStatus(msg.error || 'Audio capture failed. Please try again.');
  }

  if (msg.type === 'error') {
    showStatus('Error: ' + (msg.message || 'Unknown error'));
  }

  if (msg.type === 'call_plan') {
    renderCallPlan(msg.payload);
  }

  if (msg.type === 'suggestion') {
    showStatus('');
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

function renderCallPlan(plan) {
  const area = document.getElementById('suggestion-area');
  const questions = plan.questions || [];
  if (questions.length === 0) return;

  const planDiv = document.createElement('div');
  planDiv.id = 'plan-questions';
  planDiv.style.cssText = 'background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;padding:10px 12px;margin-bottom:10px';
  planDiv.innerHTML = '<p style="font-size:10px;font-weight:600;color:#4F46E5;margin-bottom:8px;text-transform:uppercase">Pre-call plan — Questions to ask</p>';

  questions.forEach((q, i) => {
    const qDiv = document.createElement('div');
    qDiv.style.cssText = 'margin-bottom:6px;font-size:12px;line-height:1.5;color:#1e1b4b';
    qDiv.textContent = `${i + 1}. ${q.question}`;
    const tag = document.createElement('span');
    tag.style.cssText = 'font-size:9px;font-weight:600;padding:1px 5px;border-radius:6px;background:#eef2ff;color:#4F46E5;margin-left:6px';
    tag.textContent = MEDDIC_LABELS[q.meddic_field] || q.meddic_field;
    qDiv.appendChild(tag);
    planDiv.appendChild(qDiv);
  });

  if (plan.watch_for) {
    const wf = document.createElement('p');
    wf.style.cssText = 'font-size:11px;color:#92400e;margin-top:8px;padding-top:6px;border-top:1px solid #c7d2fe';
    wf.textContent = 'Watch for: ' + plan.watch_for;
    planDiv.appendChild(wf);
  }

  area.prepend(planDiv);
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
