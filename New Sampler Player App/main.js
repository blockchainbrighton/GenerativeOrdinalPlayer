// main.js

// Import necessary modules
import './summary.js'; // Ensures summary is generated
import {
  playSampleAtTime,
  getSample, // Assuming getSample is exported from player.js or relevant module
} from './player.js';
import { audioContext, masterGainNode, loadSample } from './audioLoader.js';
import { BeatGenerator } from './beatGenerator.js';
import { summaryData } from './summary.js'; // Import summary data for dynamic handling

let beatGeneratorInstance = null; // Declare at the global scope

// Scheduler constants
const CURRENT_BPM_DEFAULT = 137;
let currentBpm = CURRENT_BPM_DEFAULT;

const SCHEDULER_CONFIG = {
  scheduleAheadTime: 0.1, // seconds
  lookahead: 25.0, // milliseconds
};

let nextNoteTime = 0.0;
let timerID = null;

let globalStartTime = null;
let barCount = 0;

// Playback state management
const playbackState = {
  beat: false,
  loops: {
    rhythmLoop: false,
    melodyLoop: false,
  },
};

// Active audio sources
const activeSources = new Map();

// Beat generator configuration
let beatGeneratorConfig = {
  bpm: currentBpm,
  instruments: {},
  randomness: {},
  swing: 0,
  bars: 4,
  beatsPerBar: 4,
};

// Utility functions
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const getElement = (id) => document.getElementById(id);

const toggleClass = (element, className, condition) => {
  if (element) element.classList.toggle(className, condition);
};

// Initialize AudioContext on user interaction
document.body.addEventListener(
  'click',
  () => {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  },
  { once: true }
);

// Dynamically generate instrument play functions
const instrumentPlayFunctions = Object.entries(summaryData.instrumentsByCategory).reduce(
  (acc, [category, instruments]) => {
    instruments.forEach((instrument) => {
      acc[instrument] = () => playSampleAtTime(category, instrument, currentBpm);
    });
    return acc;
  },
  {}
);

// Scheduler function
const scheduler = () => {
  while (nextNoteTime < audioContext.currentTime + SCHEDULER_CONFIG.scheduleAheadTime) {
    // Schedule loops
    Object.keys(playbackState.loops).forEach((loopKey) => {
      if (playbackState.loops[loopKey]) {
        if (!activeSources.has(loopKey)) {
          const [category, type] =
            loopKey === 'rhythmLoop' ? ['percussionLoop', 'rhythm'] : ['melodicLoop', 'melody'];
          scheduleLoop(category, type, nextNoteTime, loopKey);
        }
      }
    });

    // Schedule beats if beat playback is enabled
    if (playbackState.beat && beatGeneratorInstance) {
      beatGeneratorInstance.scheduleBeat(nextNoteTime);
    }

    // Advance nextNoteTime and barCount
    const secondsPerBeat = 60 / currentBpm;
    const secondsPerBar = secondsPerBeat * beatGeneratorConfig.beatsPerBar;
    nextNoteTime += secondsPerBar;
    barCount += 1;
  }
  timerID = setTimeout(scheduler, SCHEDULER_CONFIG.lookahead);
};

// Scheduler control
const startScheduler = () => {
  if (!timerID) {
    globalStartTime = audioContext.currentTime + 0.1; // Slight delay to start
    nextNoteTime = globalStartTime;
    scheduler();
  }
};

const stopScheduler = () => {
  if (!playbackState.beat && !Object.values(playbackState.loops).some(Boolean)) {
    clearTimeout(timerID);
    timerID = null;
    activeSources.forEach((source) => source.stop());
    activeSources.clear();
  }
};

// Stop a specific audio source
const stopSource = (sourceKey) => {
  const source = activeSources.get(sourceKey);
  if (source) {
    source.stop();
    activeSources.delete(sourceKey);
  }
};

// Toggle Beat Playback
const toggleBeat = () => {
  playbackState.beat = !playbackState.beat;
  toggleClass(getElement('generateBeat'), 'active', playbackState.beat);

  if (playbackState.beat) {
    // Determine bars from the playing loops
    let bars = 4; // Default
    const playingLoopKeys = Object.keys(playbackState.loops).filter((key) => playbackState.loops[key]);
    if (playingLoopKeys.length > 0) {
      // Get the maximum loopBars among the playing loops
      bars = Math.max(
        ...playingLoopKeys.map((sourceKey) => {
          const sample = getSample(
            sourceKey === 'rhythmLoop' ? 'percussionLoop' : 'melodicLoop',
            sourceKey === 'rhythmLoop' ? 'rhythm' : 'melody'
          );
          return sample?.properties?.loopBars || 4;
        })
      );
    }
    // Update beatGeneratorConfig.bars
    beatGeneratorConfig.bars = bars;

    // Create a new instance of BeatGenerator
    beatGeneratorInstance = new BeatGenerator({
      bpm: currentBpm,
      instruments: beatGeneratorConfig.instruments,
      randomness: beatGeneratorConfig.randomness,
      swing: beatGeneratorConfig.swing,
      bars: beatGeneratorConfig.bars,
      beatsPerBar: beatGeneratorConfig.beatsPerBar,
    });

    if (!timerID) {
      startScheduler();
    } else {
      // Scheduler is already running
      // Schedule beat to start at next bar boundary
      const nextBarStartTime = getNextBarStartTime();
      beatGeneratorInstance.scheduleBeat(nextBarStartTime);
    }
  } else {
    beatGeneratorInstance = null;
    if (!Object.values(playbackState.loops).some(Boolean)) {
      stopScheduler();
    }
  }
};

// Toggle Loop Playback
const toggleLoop = (sourceKey) => {
  playbackState.loops[sourceKey] = !playbackState.loops[sourceKey];
  toggleClass(
    getElement(sourceKey === 'rhythmLoop' ? 'playRhythmLoop' : 'playMelodyLoop'),
    'active',
    playbackState.loops[sourceKey]
  );

  if (playbackState.loops[sourceKey]) {
    if (!timerID) {
      startScheduler();
    } else {
      // Scheduler is already running
      // Schedule loop to start at next bar boundary
      const nextBarStartTime = getNextBarStartTime();
      const [category, type] =
        sourceKey === 'rhythmLoop' ? ['percussionLoop', 'rhythm'] : ['melodicLoop', 'melody'];
      scheduleLoop(category, type, nextBarStartTime, sourceKey);
    }
  } else {
    stopSource(sourceKey);
    if (!playbackState.beat && !Object.values(playbackState.loops).some(Boolean)) {
      stopScheduler();
    }
  }
};


const getNextBarStartTime = () => {
  const now = audioContext.currentTime;
  const secondsPerBeat = 60 / currentBpm;
  const secondsPerBar = secondsPerBeat * beatGeneratorConfig.beatsPerBar;
  const elapsedSinceGlobalStart = now - globalStartTime;
  const barsElapsed = Math.floor(elapsedSinceGlobalStart / secondsPerBar);
  const nextBarStartTime = globalStartTime + (barsElapsed + 1) * secondsPerBar;
  return nextBarStartTime;
};

// Schedule a loop with adjusted loopEnd based on playbackRate
const scheduleLoop = async (category, type, time, sourceKey) => {
  if (activeSources.has(sourceKey)) return; // Already scheduled

  console.log(`Scheduling loop '${sourceKey}' for category: ${category}, type: ${type} at time ${time.toFixed(3)} seconds`);

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
  const playbackRate =
    ((sample.properties.playbackRate || 1.0) * (currentBpm / (sample.properties.bpm || sample.tempo || 120))) ||
    1.0;
  source.playbackRate.value = playbackRate;

  // Handle trimming
  const trimStart = sample.properties.trimStart || 0;
  const trimEnd = sample.properties.trimEnd || 0;

  // Set loop points in the sample's time coordinates
  const loopStart = trimStart;
  const loopEnd = audioBuffer.duration - trimEnd;

  source.loop = true;
  source.loopStart = loopStart;
  source.loopEnd = loopEnd;

  // Log loop details
  console.log(`Loop '${sample.name}' scheduled to start at audio time: ${time.toFixed(3)} seconds`);
  console.log(`Loop Start: ${source.loopStart} sec, Loop End: ${source.loopEnd} sec`);
  console.log(`Playback Rate: ${playbackRate}`);

  // Start the source at the scheduled time
  source.start(time, trimStart);

  // Store the source for later control
  activeSources.set(sourceKey, source);
};

// BPM Control
const setBpm = () => {
  const bpmInput = parseInt(getElement('bpmInput')?.value, 10);
  if (isNaN(bpmInput) || bpmInput <= 0) {
    alert('Please enter a valid BPM value.');
    return;
  }
  currentBpm = bpmInput;
  alert(`BPM set to ${currentBpm}`);

  // Restart scheduler if necessary
  if (playbackState.beat || Object.values(playbackState.loops).some(Boolean)) {
    stopScheduler();
    startScheduler();
  }
};

// Volume Control
const setVolume = (value) => {
  masterGainNode.gain.value = parseFloat(value) || 1.0;
};

// Apply Beat Generator Settings
const applySettings = () => {
  const instruments = Object.values(summaryData.instrumentsByCategory).flat();
  const uniqueInstruments = [...new Set(instruments)];

  const updatedInstruments = uniqueInstruments.reduce((acc, name) => {
    const capitalized = capitalize(name);
    acc[name] = {
      enabled: getElement(`enable${capitalized}`)?.checked || false,
      probability: parseFloat(getElement(`${name.toLowerCase()}Probability`)?.value) || 0,
      // Preserve or set tempoVariants
      tempoVariants: beatGeneratorConfig.instruments[name]?.tempoVariants || defaultConfig.instruments[name]?.tempoVariants || [1],
    };
    return acc;
  }, {});

  const randomness = {
    patternSelection: getElement('patternSelection')?.checked || false,
    hitVariation: getElement('hitVariation')?.checked || false,
  };

  const swingAmount = parseFloat(getElement('swingAmount')?.value) || 0;

  // Update beat generator configuration
  beatGeneratorConfig = {
    ...beatGeneratorConfig,
    instruments: updatedInstruments,
    randomness,
    swing: swingAmount,
  };

  alert('Beat generator settings updated.');

  // Restart scheduler if beat is playing
  if (playbackState.beat) {
    stopScheduler();
    // Refresh the beat generator instance
    beatGeneratorInstance = new BeatGenerator(beatGeneratorConfig);
    startScheduler();
  }
};

// Event Delegation for Dynamic Buttons
document.body.addEventListener('click', (event) => {
  const { target } = event;

  // Handle Loop Buttons
  const loopMatch = target.id.match(/^play(.*)Loop$/);
    if (loopMatch) {
      const loopType = loopMatch[1].toLowerCase();
      const sourceKey = `${loopType}Loop`;
      toggleLoop(sourceKey);
      return;
    }

  // Handle Play Instrument Buttons
  if (target.id.startsWith('play') && !target.id.endsWith('Loop')) {
    const instrumentName = target.id.replace(/^play/i, '').toLowerCase();
    instrumentPlayFunctions[instrumentName]?.();
    return;
  }

  // Handle Generate Beat Button
  if (target.id === 'generateBeat') {
    toggleBeat();
    return;
  }

  // Handle Apply Settings Button
  if (target.id === 'applySettings') {
    applySettings();
    return;
  }

  // Handle Set BPM Button
  if (target.id === 'setBpm') {
    setBpm();
    return;
  }
});

// Volume Slider Event Listener
getElement('volumeSlider')?.addEventListener('input', (e) => {
  setVolume(e.target.value);
});