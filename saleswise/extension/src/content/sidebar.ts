// Inject sidebar
const sidebar = document.createElement('div');
sidebar.id = 'saleswise-sidebar';
sidebar.setAttribute('role', 'complementary');
sidebar.setAttribute('aria-label', 'Sales-Wise Co-pilot');

// Build static shell with DOM methods (no innerHTML with user data)
const header = document.createElement('div');
header.className = 'sw-header';
const title = document.createElement('div');
title.className = 'sw-title';
title.textContent = 'Sales-wise Co-pilot';
const timer = document.createElement('div');
timer.className = 'sw-timer';
timer.setAttribute('aria-label', 'Call duration');
timer.textContent = '00:00';
header.appendChild(title);
header.appendChild(timer);

const transcript = document.createElement('div');
transcript.className = 'sw-transcript-container';
transcript.id = 'sw-transcript';
transcript.setAttribute('role', 'log');
transcript.setAttribute('aria-label', 'Call transcript');
transcript.setAttribute('aria-live', 'polite');

const questions = document.createElement('div');
questions.className = 'sw-questions-container';
questions.id = 'sw-questions';
const questionsTitle = document.createElement('div');
questionsTitle.className = 'sw-questions-title';
questionsTitle.textContent = 'Suggested Questions';
const questionsList = document.createElement('div');
questionsList.id = 'sw-questions-list';
questionsList.setAttribute('role', 'list');
questionsList.setAttribute('aria-live', 'polite');
questionsList.textContent = 'Waiting for context...';
questions.appendChild(questionsTitle);
questions.appendChild(questionsList);

sidebar.appendChild(header);
sidebar.appendChild(transcript);
sidebar.appendChild(questions);
document.body.appendChild(sidebar);

let timerInterval: ReturnType<typeof setInterval> | null = null;
let startTime = 0;
let transcriptHistory: {speaker: string, text: string}[] = [];

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'TRANSCRIPT_RESULT') {
    addTranscript(message.speaker, message.text);
  } else if (message.action === 'NEW_QUESTIONS') {
    updateQuestions(message.questions);
  }
});

function addTranscript(speaker: string, text: string) {
  const container = document.getElementById('sw-transcript');
  if (!container) return;

  transcriptHistory.push({ speaker, text });
  if (transcriptHistory.length > 10) {
    transcriptHistory.shift();
  }

  // Build DOM safely — no innerHTML from user data
  container.replaceChildren();
  for (const t of transcriptHistory) {
    const line = document.createElement('div');
    line.className = 'sw-transcript-line';
    const strong = document.createElement('strong');
    strong.textContent = `${t.speaker}:`;
    line.appendChild(strong);
    line.appendChild(document.createTextNode(` ${t.text}`));
    container.appendChild(line);
  }

  container.scrollTop = container.scrollHeight;
}

function updateQuestions(questionData: {text: string, framework_tag: string}[]) {
  const list = document.getElementById('sw-questions-list');
  if (!list) return;

  if (questionData.length === 0) {
    list.textContent = 'Waiting for more context...';
    return;
  }

  // Build DOM safely — no innerHTML from API data
  list.replaceChildren();
  for (const q of questionData) {
    const card = document.createElement('div');
    card.className = 'sw-question-card';
    card.setAttribute('role', 'listitem');

    const badge = document.createElement('span');
    badge.className = 'sw-badge';
    badge.textContent = q.framework_tag;

    const text = document.createElement('p');
    text.textContent = q.text;

    card.appendChild(badge);
    card.appendChild(text);
    list.appendChild(card);
  }
}

// Start timer automatically when injected
startTime = Date.now();
timerInterval = setInterval(() => {
  const timerEl = document.querySelector('.sw-timer');
  if (timerEl) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
  }
}, 1000);
