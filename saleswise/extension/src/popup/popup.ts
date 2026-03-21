import { API_BASE_URL } from '../lib/config';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('precall-form') as HTMLFormElement;
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
  const loading = document.getElementById('loading') as HTMLDivElement;
  const results = document.getElementById('results') as HTMLDivElement;
  const questionsList = document.getElementById('questions-list') as HTMLDivElement;
  const startCallBtn = document.getElementById('start-call-btn') as HTMLButtonElement;

  let currentQuestions: any[] = [];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const product = (document.getElementById('product') as HTMLInputElement).value;
    const company = (document.getElementById('company') as HTMLInputElement).value;
    const goal = (document.getElementById('goal') as HTMLInputElement).value;

    generateBtn.disabled = true;
    loading.classList.remove('hidden');
    results.classList.add('hidden');

    try {
      // In Phase 1 we send this to our local Next.js API
      const res = await fetch(`${API_BASE_URL}/api/precall/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product, company, goal, framework: 'MEDDIC' })
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      currentQuestions = data.questions || [];

      // Build DOM safely — no innerHTML from API data
      questionsList.replaceChildren();
      for (const q of currentQuestions) {
        const card = document.createElement('div');
        card.className = 'question-card';
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = q.framework_tag || 'MEDDIC';
        const text = document.createElement('p');
        text.textContent = q.text;
        card.appendChild(badge);
        card.appendChild(text);
        questionsList.appendChild(card);
      }

      loading.classList.add('hidden');
      results.classList.remove('hidden');

    } catch (err) {
      console.error(err);
      loading.textContent = 'Error generating questions. Is the API running?';
    } finally {
      generateBtn.disabled = false;
    }
  });

  startCallBtn.addEventListener('click', () => {
    // Send message to background to start recording
    // The background script will check if we're on meet.google.com
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url?.includes('meet.google.com')) {
        chrome.runtime.sendMessage({
          action: 'START_RECORDING',
          callInfo: { questions: currentQuestions }
        }, (response) => {
          if (response && response.success) {
            window.close(); // Close popup
          } else {
            alert('Failed to start recording: ' + (response?.error || 'Unknown error'));
          }
        });
      } else {
        alert('Please navigate to a Google Meet tab first!');
      }
    });
  });
});
