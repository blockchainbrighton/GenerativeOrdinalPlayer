// main.js
import {
  playKick,
  playSnare,
  playHiHat,
  playTonalHit,
  getSample,
  playSampleAtTime,
} from './player.js';
import { audioContext, loadSample } from './audioLoader.js';

// Ensure the user interacts with the page before audio can be played
document.body.addEventListener(
  'click',
  () => {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  },
  { once: true }
);

// Current BPM (default)
let currentBpm = 137;

// Scheduler variables
let isBeatPlaying = false;
let isRhythmLoopPlaying = false;
let isMelodyLoopPlaying = false;

let nextNoteTime = 0.0; // When the next note is due
const scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)
const lookahead = 25.0; // How frequently to call scheduling function (ms)

let current16thNote = 0; // What note is currently last scheduled?
let timerID = 0;

// Map to hold currently playing sources for loops
const activeSources = new Map();

// Object to store loop info
const loopInfo = {
  rhythmLoop: null,
  melodyLoop: null,
};

// Add event listeners to buttons
document.getElementById('playKick').addEventListener('click', () => playKick(currentBpm));
document.getElementById('playSnare').addEventListener('click', () => playSnare(currentBpm));
document.getElementById('playHiHat').addEventListener('click', () => playHiHat(currentBpm));
document.getElementById('playTonalHit').addEventListener('click', () => playTonalHit(currentBpm));

// Loop buttons
document.getElementById('generateBeat').addEventListener('click', toggleBeat);
document.getElementById('playRhythmLoop').addEventListener('click', () => toggleLoop('rhythmLoop', 'loop', 'rhythm'));
document.getElementById('playMelodyLoop').addEventListener('click', () => toggleLoop('melodyLoop', 'loop', 'melody'));

// BPM Control
document.getElementById('setBpm').addEventListener('click', () => {
  const bpmInput = document.getElementById('bpmInput').value;
  const bpm = parseInt(bpmInput, 10);
  if (isNaN(bpm) || bpm <= 0) {
    alert('Please enter a valid BPM value.');
    return;
  }
  currentBpm = bpm;
  alert(`BPM set to ${currentBpm}`);

  // If any loops or beats are playing, restart the scheduler
  if (isBeatPlaying || isRhythmLoopPlaying || isMelodyLoopPlaying) {
    stopScheduler();
    startScheduler();
  }
});

// Scheduler function
function scheduler() {
  while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
    if (isBeatPlaying) {
      scheduleBeat(current16thNote, nextNoteTime);
    }
    if (isRhythmLoopPlaying) {
      scheduleLoop('loop', 'rhythm', nextNoteTime, 'rhythmLoop');
    }
    if (isMelodyLoopPlaying) {
      scheduleLoop('loop', 'melody', nextNoteTime, 'melodyLoop');
    }
    nextNote();
  }
  timerID = setTimeout(scheduler, lookahead);
}

// Advances current note and time by a 16th note
function nextNote() {
  const secondsPerBeat = 60.0 / currentBpm;
  nextNoteTime += 0.25 * secondsPerBeat; // Add a quarter of a beat (16th note)
  current16thNote = (current16thNote + 1) % 16;
}

function scheduleBeat(beatNumber, time) {
  let loopDuration = null;
  let loopStartTime = null;

  // Determine if a loop is playing and get its duration and start time
  if (isRhythmLoopPlaying && loopInfo.rhythmLoop) {
    loopDuration = loopInfo.rhythmLoop.duration;
    loopStartTime = loopInfo.rhythmLoop.startTime;
  } else if (isMelodyLoopPlaying && loopInfo.melodyLoop) {
    loopDuration = loopInfo.melodyLoop.duration;
    loopStartTime = loopInfo.melodyLoop.startTime;
  }

  if (loopDuration && loopStartTime !== null) {
    const secondsPerBeat = 60.0 / currentBpm;
    const totalBeatsInLoop = Math.round(loopDuration / secondsPerBeat);

    const timeSinceLoopStart = time - loopStartTime;
    const beatPositionInLoop = Math.floor(timeSinceLoopStart / secondsPerBeat) % totalBeatsInLoop;

    // Schedule beats based on beatPositionInLoop
    if (beatPositionInLoop === 0) {
      playSampleAtTime('drum', 'kick', time);
    }
    if (beatPositionInLoop === Math.floor(totalBeatsInLoop / 2)) {
      playSampleAtTime('drum', 'snare', time);
    }
    playSampleAtTime('drum', 'hihat', time);
  } else {
    // Default beat scheduling when no loop is playing
    if (beatNumber % 8 === 0) {
      playSampleAtTime('drum', 'kick', time);
    }
    if (beatNumber % 8 === 4) {
      playSampleAtTime('drum', 'snare', time);
    }
    playSampleAtTime('drum', 'hihat', time);
  }
}

async function scheduleLoop(category, type, time, sourceKey) {
  if (activeSources.has(sourceKey)) return; // Already scheduled

  const sample = getSample(category, type);
  if (!sample) return;

  const audioBuffer = await loadSample(sample);
  if (!audioBuffer) return;

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = sample.properties.volume || 1.0;

  source.connect(gainNode).connect(audioContext.destination);

  // Set playback rate
  let playbackRate = sample.properties.playbackRate || 1.0;
  const sampleBpm = sample.properties.bpm || sample.tempo || 120;
  if (currentBpm && sampleBpm) {
    playbackRate *= currentBpm / sampleBpm;
  }
  source.playbackRate.value = playbackRate;

  // Handle trimming
  const startOffset = sample.properties.trimStart || 0;
  const endOffset = audioBuffer.duration - (sample.properties.trimEnd || 0);

  // Handle looping
  source.loop = true;
  source.loopStart = startOffset;
  source.loopEnd = endOffset;

  // Start the source at the scheduled time
  source.start(time, startOffset);

  // Store the source so we can stop it later
  activeSources.set(sourceKey, source);

  // Store loop info
  const loopDuration = (endOffset - startOffset) / playbackRate;
  loopInfo[sourceKey] = {
    startTime: time,
    duration: loopDuration,
  };
}

// Toggle functions
function toggleBeat() {
  isBeatPlaying = !isBeatPlaying;
  const button = document.getElementById('generateBeat');
  button.classList.toggle('active', isBeatPlaying);
  if (isBeatPlaying) {
    startScheduler();
  } else {
    stopScheduler();
  }
}

function toggleLoop(sourceKey, category, type) {
  const isPlaying = sourceKey === 'rhythmLoop' ? isRhythmLoopPlaying : isMelodyLoopPlaying;
  const buttonId = sourceKey === 'rhythmLoop' ? 'playRhythmLoop' : 'playMelodyLoop';
  const button = document.getElementById(buttonId);

  if (!isPlaying) {
    if (sourceKey === 'rhythmLoop') isRhythmLoopPlaying = true;
    if (sourceKey === 'melodyLoop') isMelodyLoopPlaying = true;
    button.classList.add('active');
    startScheduler();
  } else {
    if (sourceKey === 'rhythmLoop') isRhythmLoopPlaying = false;
    if (sourceKey === 'melodyLoop') isMelodyLoopPlaying = false;
    button.classList.remove('active');
    stopSource(sourceKey);
  }
}

// Start the scheduler
function startScheduler() {
  if (timerID === 0) {
    nextNoteTime = audioContext.currentTime + 0.1; // Slight delay to start
    scheduler();
  }
}

// Stop the scheduler if nothing is playing
function stopScheduler() {
  if (!isBeatPlaying && !isRhythmLoopPlaying && !isMelodyLoopPlaying) {
    clearTimeout(timerID);
    timerID = 0;
    activeSources.forEach((source) => {
      source.stop();
    });
    activeSources.clear();
  }
}

// Stop a specific source
function stopSource(sourceKey) {
  const source = activeSources.get(sourceKey);
  if (source) {
    source.stop();
    activeSources.delete(sourceKey);
  }
  // Clear loop info when stopping the source
  if (loopInfo[sourceKey]) {
    loopInfo[sourceKey] = null;
  }
}