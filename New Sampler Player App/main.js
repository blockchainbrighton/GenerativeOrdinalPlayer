// main.js

// Import necessary modules
import './summary.js'; // Ensures summary is generated
// uiGenerator.js is already imported in index.html

import {
  playSampleAtTime,
} from './player.js';
import { audioContext, masterGainNode, loadSample } from './audioLoader.js';
import { BeatGenerator } from './beatGenerator.js';
import { summaryData } from './summary.js'; // Import summary data for dynamic handling

let beatGeneratorInstance = null;

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

let timerID = null;

// Map to hold currently playing sources for loops
const activeSources = new Map();

// Object to store loop info
const loopInfo = {
  rhythmLoop: null,
  melodyLoop: null,
};

// Mapping of instrument names to their play functions
// Ensure this mapping includes all possible instruments
const instrumentPlayFunctions = {
  kick: () => playSampleAtTime('Drums', 'kick', currentBpm),
  snare: () => playSampleAtTime('Drums', 'snare', currentBpm),
  hihat: () => playSampleAtTime('Drums', 'hihat', currentBpm),
  rimshot: () => playSampleAtTime('Tonal Hits', 'rimshot', currentBpm),
  floortom: () => playSampleAtTime('Tonal Hits', 'floortom', currentBpm),
  hightom: () => playSampleAtTime('Tonal Hits', 'hightom', currentBpm),
  // Add more mappings as needed
};

// Scheduler function
const scheduler = () => {
  while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
    if (isBeatPlaying && beatGeneratorInstance) {
      // Schedule the beat patterns starting from nextNoteTime
      beatGeneratorInstance.scheduleBeat(nextNoteTime);
      // Increment nextNoteTime by the total duration of the patterns
      const patternDuration = (60 / currentBpm) * beatGeneratorInstance.getPatternLength();
      nextNoteTime += patternDuration;
    }

    if (isRhythmLoopPlaying) {
      scheduleLoop('percussionLoop', 'rhythm', nextNoteTime, 'rhythmLoop');
    }

    if (isMelodyLoopPlaying) {
      scheduleLoop('melodicLoop', 'melody', nextNoteTime, 'melodyLoop');
    }
  }
  timerID = setTimeout(scheduler, lookahead);
};

// Start the scheduler
const startScheduler = () => {
  if (!timerID) {
    nextNoteTime = audioContext.currentTime + 0.1; // Slight delay to start
    scheduler();
  }
};

// Stop the scheduler if nothing is playing
const stopScheduler = () => {
  if (!isBeatPlaying && !isRhythmLoopPlaying && !isMelodyLoopPlaying) {
    clearTimeout(timerID);
    timerID = null;
    activeSources.forEach((source) => source.stop());
    activeSources.clear();
  }
};

// Stop a specific source
const stopSource = (sourceKey) => {
  const source = activeSources.get(sourceKey);
  if (source) {
    source.stop();
    activeSources.delete(sourceKey);
  }
  // Clear loop info when stopping the source
  loopInfo[sourceKey] = null;
};

// Toggle Beat
const toggleBeat = () => {
  isBeatPlaying = !isBeatPlaying;
  const button = document.getElementById('generateBeat');
  button?.classList.toggle('active', isBeatPlaying);

  if (isBeatPlaying) {
    // Create a new BeatGenerator instance when starting the beat
    beatGeneratorInstance = new BeatGenerator({
      bpm: currentBpm,
      instruments: beatGeneratorConfig.instruments,
      randomness: beatGeneratorConfig.randomness,
      swing: beatGeneratorConfig.swing,
      bars: beatGeneratorConfig.bars,
      beatsPerBar: beatGeneratorConfig.beatsPerBar,
    });
    // Reset nextNoteTime
    nextNoteTime = audioContext.currentTime + 0.1;
    startScheduler();
  } else {
    stopScheduler();
  }
};

// Toggle Loop
const toggleLoop = (sourceKey, sampleCategory, type) => {
  let isPlaying;
  if (sourceKey === 'rhythmLoop') {
    isPlaying = isRhythmLoopPlaying;
  } else if (sourceKey === 'melodyLoop') {
    isPlaying = isMelodyLoopPlaying;
  }

  const buttonId = sourceKey === 'rhythmLoop' ? 'playRhythmLoop' : 'playMelodyLoop';
  const button = document.getElementById(buttonId);

  if (!isPlaying) {
    if (sourceKey === 'rhythmLoop') isRhythmLoopPlaying = true;
    if (sourceKey === 'melodyLoop') isMelodyLoopPlaying = true;
    if (button) button.classList.add('active');
    startScheduler();
  } else {
    if (sourceKey === 'rhythmLoop') isRhythmLoopPlaying = false;
    if (sourceKey === 'melodyLoop') isMelodyLoopPlaying = false;
    if (button) button.classList.remove('active');
    stopSource(sourceKey);
  }
};

// Schedule a loop
const scheduleLoop = async (category, type, time, sourceKey) => {
  if (activeSources.has(sourceKey)) return; // Already scheduled

  const sample = getSample(category, type);
  if (!sample) return;

  const audioBuffer = await loadSample(sample);
  if (!audioBuffer) return;

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = sample.properties.volume || 1.0;

  source.connect(gainNode).connect(masterGainNode);

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
};

// BPM Control
const setBpm = () => {
  const bpmInput = document.getElementById('bpmInput')?.value;
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
};

// Volume Control
const setVolume = (value) => {
  masterGainNode.gain.value = parseFloat(value) || 1.0;
};

// Beat Generator Configuration
let beatGeneratorConfig = {
  bpm: currentBpm,
  instruments: {}, // Will be updated from UI
  randomness: {},
  swing: 0,
  bars: 4, // Default number of bars
  beatsPerBar: 4, // Default beats per bar
};

// Apply Settings
const applySettings = () => {
  const instrumentNames = Object.values(summaryData.instrumentsByCategory).flat();

  const uniqueInstruments = [...new Set(instrumentNames)];

  const instruments = uniqueInstruments.reduce((acc, name) => {
    const capitalized = capitalize(name);
    acc[name] = {
      enabled: document.getElementById(`enable${capitalized}`)?.checked || false,
      probability: parseFloat(document.getElementById(`${name.toLowerCase()}Probability`)?.value) || 0,
    };
    return acc;
  }, {});

  const randomness = {
    patternSelection: document.getElementById('patternSelection')?.checked || false,
    hitVariation: document.getElementById('hitVariation')?.checked || false,
  };

  const swingAmount = parseFloat(document.getElementById('swingAmount')?.value) || 0;

  // Update beat generator configuration
  beatGeneratorConfig = {
    ...beatGeneratorConfig,
    instruments,
    randomness,
    swing: swingAmount,
  };

  alert('Beat generator settings updated.');

  // Restart the scheduler if the beat is playing
  if (isBeatPlaying) {
    stopScheduler();
    startScheduler();
  }
};

// Event Delegation for Dynamic Buttons
document.body.addEventListener('click', (event) => {
  const target = event.target;

  // Handle Play Instrument Buttons
  if (target.id.startsWith('play') && !target.id.endsWith('Loop')) {
    const instrumentName = target.id.replace('play', '').toLowerCase();
    const playFunction = instrumentPlayFunctions[instrumentName];
    if (playFunction) {
      playFunction();
    }
  }

  // Handle Generate Beat Button
  if (target.id === 'generateBeat') {
    toggleBeat();
  }

  // Handle Loop Buttons
  if (target.id.startsWith('play') && target.id.endsWith('Loop')) {
    const loopType = target.id.replace('play', '').replace('Loop', '').toLowerCase();
    const sourceKey = `${loopType}Loop`;
    const sampleCategory = loopType; // Assuming category name matches loop type
    toggleLoop(sourceKey, sampleCategory, loopType);
  }

  // Handle Apply Settings Button
  if (target.id === 'applySettings') {
    applySettings();
  }

  // Handle Set BPM Button
  if (target.id === 'setBpm') {
    setBpm();
  }
});

// Volume Slider Event Listener
document.getElementById('volumeSlider')?.addEventListener('input', (e) => {
  setVolume(e.target.value);
});