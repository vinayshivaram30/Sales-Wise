// Injected into Google Meet tab - handles audio capture via getDisplayMedia
// Uses AudioWorklet (replaces deprecated ScriptProcessor)

let mediaStream = null;
let audioContext = null;
let workletNode = null;
const SAMPLE_RATE = 16000;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'START_AUDIO_CAPTURE') {
    startCapture().then(() => sendResponse({ ok: true })).catch(e => sendResponse({ error: e.message }));
    return true;
  }
  if (msg.type === 'STOP_AUDIO_CAPTURE') {
    stopCapture();
    sendResponse({ ok: true });
  }
});

async function startCapture() {
  mediaStream = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: 'browser' },
    audio: {
      systemAudio: 'include',
      suppressLocalAudioPlayback: false
    },
    preferCurrentTab: true
  });

  const audioTracks = mediaStream.getAudioTracks();
  if (audioTracks.length === 0) {
    mediaStream.getTracks().forEach(t => t.stop());
    chrome.runtime.sendMessage({ type: 'AUDIO_MISSING_CHECKBOX' });
    return;
  }

  audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
  const source = audioContext.createMediaStreamSource(mediaStream);

  await audioContext.audioWorklet.addModule(chrome.runtime.getURL('audio-processor.js'));
  workletNode = new AudioWorkletNode(audioContext, 'pcm-processor', { numberOfInputs: 1, numberOfOutputs: 1 });

  workletNode.port.onmessage = (e) => {
    if (e.data.type === 'pcm' && e.data.data) {
      const bytes = new Uint8Array(e.data.data);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      chrome.runtime.sendMessage({ type: 'AUDIO_CHUNK', data: btoa(binary) });
    }
  };

  source.connect(workletNode);
  workletNode.connect(audioContext.destination);

  mediaStream.getVideoTracks()[0]?.addEventListener('ended', () => {
    chrome.runtime.sendMessage({ type: 'SHARE_STOPPED' });
    stopCapture();
  });
}

function stopCapture() {
  workletNode?.disconnect();
  audioContext?.close();
  mediaStream?.getTracks().forEach(t => t.stop());
  workletNode = audioContext = mediaStream = null;
}
