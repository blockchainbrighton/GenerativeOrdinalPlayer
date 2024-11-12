// main.js

// Import necessary modules
import './summary.js'; // Ensures summary is generated
import {
  playSampleAtTime,
  getSample,
  playRandomSample,
} from './player.js';
import {
  audioContext,
  masterGainNode,
  loadSample,
  initializeAudioContext,
  getGlobalStartTime,
} from './audioLoader.js';
import { BeatGenerator, defaultConfig } from './beatGenerator.js';
import { summaryData } from './summary.js'; // Import summary data for dynamic handling
import { samples } from './samples.js'; // Import samples

// Constants
const DEFAULT_BPM = 137;
const SCHEDULER_AHEAD_TIME = 0.1; // seconds
const SCHEDULER_LOOKAHEAD = 25.0; // milliseconds
const MAX_LOOP_ITERATIONS = 16;

// State Variables
let currentBpm = DEFAULT_BPM;
let beatGenerator = null;
let nextNoteTime = 0.0;
let schedulerTimer = null;
let barCount = 0;

// Playback State
const playbackState = {
  beat: false,
  loops: {}, // Dynamically holds loop states keyed by loop IDs
};

// Active Audio Sources and Loop Timings
const activeSources = new Map(); // Keyed by loop ID
const loopTimings = {}; // Keyed by loop ID

// Beat Generator Configuration
let beatConfig = {
  bpm: currentBpm,
  instruments: {},
  randomness: {},
  swing: 0,
  bars: 4,
  beatsPerBar: 4,
};

// Utility Functions
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const getElement = (id) => document.getElementById(id);

const toggleClass = (element, className, condition) => {
  if (element) element.classList.toggle(className, condition);
};

// Initialize playbackState.loops with all loop samples, defaulting to inactive
Object.keys(summaryData.instrumentsByCategory).forEach(category => {
  summaryData.instrumentsByCategory[category].forEach(loopId => {
    playbackState.loops[loopId] = false;
  });
});

// Initialize AudioContext on user interaction
document.body.addEventListener(
  'click',
  () => initializeAudioContext(),
  { once: true }
);

// Dynamically generate instrument play functions
const instrumentPlayFunctions = Object.entries(summaryData.instrumentsByCategory)
  .flatMap(([category, instruments]) =>
    instruments.map(instrument => ({
      instrument,
      category
    }))
  )
  .reduce((acc, { instrument, category }) => {
    acc[instrument] = () => {
      const startTime = getNextBeatStartTime();
      playRandomSample(category, instrument, currentBpm, startTime);
    };
    return acc;
  }, {});

// Timing Functions
const getNextBeatStartTime = () => {
  const now = audioContext.currentTime;
  const globalStart = getGlobalStartTime();
  const secondsPerBeat = 60 / currentBpm;
  const elapsedBeats = Math.floor((now - globalStart) / secondsPerBeat);
  const nextBeat = globalStart + (elapsedBeats + 1) * secondsPerBeat;
  return nextBeat > now ? nextBeat : now + secondsPerBeat;
};

const getNextLoopStartTime = () => {
  const currentTime = audioContext.currentTime;
  const activeLoopKeys = Object.keys(playbackState.loops).filter(
    (key) => playbackState.loops[key]
  );

  let earliestStart = Infinity;

  activeLoopKeys.forEach((loopId) => {
    const { start, duration } = loopTimings[loopId] || {};
    if (start && duration) {
      const iterationsElapsed = Math.floor((currentTime - start) / duration);
      const nextStart = start + (iterationsElapsed + 1) * duration;
      if (nextStart < earliestStart) earliestStart = nextStart;
    }
  });

  return earliestStart !== Infinity ? earliestStart : getNextBeatStartTime();
};

// Scheduler Functions
const scheduler = () => {
  const now = audioContext.currentTime;

  while (nextNoteTime < now + SCHEDULER_AHEAD_TIME) {
    // Schedule loops
    Object.keys(playbackState.loops).forEach((loopKey) => {
      if (playbackState.loops[loopKey] && !activeSources.has(loopKey)) {
        const [category, type] =
          loopKey === 'rhythmLoop' ? ['percussionLoop', 'rhythm'] : ['melodicLoop', 'melody'];
        scheduleLoop(category, type, nextNoteTime, loopKey);
      }
    });

    // Schedule beats with loopTimings
    if (playbackState.beat && beatGenerator) {
      beatGenerator.scheduleBeat(nextNoteTime, loopTimings);
    }

    const secondsPerBar = (60 / currentBpm) * beatConfig.beatsPerBar;
    nextNoteTime += secondsPerBar;
    barCount += 1;
  }

  schedulerTimer = setTimeout(scheduler, SCHEDULER_LOOKAHEAD);
};

const startScheduler = () => {
  if (!schedulerTimer) {
    initializeAudioContext();
    nextNoteTime = getNextLoopStartTime();
    scheduler();
    console.log('Scheduler started.');
  }
};

const stopScheduler = () => {
  if (!playbackState.beat && !Object.values(playbackState.loops).some(Boolean)) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
    activeSources.forEach((source) => source.stop());
    activeSources.clear();
    console.log('Scheduler stopped.');
  }
};

const toggleLoop = (sourceKey) => {
  playbackState.loops[sourceKey] = !playbackState.loops[sourceKey];
  const buttonId = sourceKey === 'rhythmLoop' ? 'playRhythmLoop' : 'playMelodyLoop';
  toggleClass(getElement(buttonId), 'active', playbackState.loops[sourceKey]);

  if (playbackState.loops[sourceKey]) {
    if (!schedulerTimer) {
      startScheduler();
    } else {
      const nextStart = getNextLoopStartTime();
      const [category, type] =
        sourceKey === 'rhythmLoop' ? ['percussionLoop', 'rhythm'] : ['melodicLoop', 'melody'];
      scheduleLoop(category, type, nextStart, sourceKey);
    }
  } else {
    stopSource(sourceKey);
    if (!playbackState.beat && !Object.values(playbackState.loops).some(Boolean)) {
      stopScheduler();
    }
  }
};

// Loop Scheduling and Logging
const scheduleLoop = async (category, type, time, sourceKey) => {
  if (activeSources.has(sourceKey)) return;

  console.log(
    `Scheduling loop '${sourceKey}' for category: ${category}, type: ${type} at time ${time.toFixed(3)} seconds`
  );

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
  const sampleBpm = sample.properties.bpm || sample.tempo || 120;
  const playbackRate = (sample.properties.playbackRate || 1.0) * (currentBpm / sampleBpm) || 1.0;
  source.playbackRate.value = playbackRate;

  // Handle trimming
  const { trimStart = 0, trimEnd = 0 } = sample.properties;
  const loopStart = trimStart;
  const loopEnd = audioBuffer.duration - trimEnd;

  source.loop = true;
  source.loopStart = loopStart;
  source.loopEnd = loopEnd;

  // Compute adjusted loop duration
  const adjustedLoopDuration = (loopEnd - loopStart) / playbackRate;

  // Log loop details
  console.log(`Loop '${sample.name}' scheduled to start at audio time: ${time.toFixed(3)} seconds`);
  console.log(
    `Loop Start: ${source.loopStart.toFixed(3)} sec, Loop End: ${source.loopEnd.toFixed(3)} sec`
  );
  console.log(`Playback Rate: ${playbackRate.toFixed(3)}`);
  console.log(`Adjusted Loop Duration: ${adjustedLoopDuration.toFixed(3)} seconds`);

  // Schedule loop iterations
  const iterations = MAX_LOOP_ITERATIONS;
  loopTimings[sourceKey] = [];

  console.log(`Scheduled loop iterations for '${sourceKey}' for the next ${iterations} times:`);
  for (let i = 0; i < iterations; i++) {
    const iterationStart = time + i * adjustedLoopDuration;
    const iterationEnd = iterationStart + adjustedLoopDuration;
    loopTimings[sourceKey].push({ start: iterationStart, end: iterationEnd });
    console.log(
      `Scheduled Iteration ${i + 1}: Start at ${iterationStart.toFixed(3)}s, End at ${iterationEnd.toFixed(3)}s`
    );
  }

  // Start the loop
  source.start(time, loopStart);

  // Store the source for control
  activeSources.set(sourceKey, source);

  // Update BeatGenerator's loop duration if active
  if (playbackState.beat && beatGenerator) {
    beatGenerator.setLoopDuration(adjustedLoopDuration);
  }
};

/**
 * Stops a specific loop based on its unique ID.
 * @param {string} loopId - The unique ID of the loop.
 */
const stopSource = (loopId) => {
  const source = activeSources.get(loopId);
  if (source) {
    source.stop();
    activeSources.delete(loopId);
    delete loopTimings[loopId];
    console.log(`Stopped source: ${loopId}`);
  }
};

/**
 * Toggles the Beat Generator on or off.
 */
const toggleBeat = () => {
  playbackState.beat = !playbackState.beat;
  toggleClass(getElement('generateBeat'), 'active', playbackState.beat);

  if (playbackState.beat) {
    if (beatGenerator && beatGenerator.isPlaying) {
      console.warn('BeatGenerator is already running.');
      return;
    }

    // Determine the number of bars based on active loops
    const activeLoopKeys = Object.keys(playbackState.loops).filter(
      (key) => playbackState.loops[key]
    );
    const bars = activeLoopKeys.length
      ? Math.max(
          ...activeLoopKeys.map((loopId) => {
            const sample = getSample(loopId === 'rhythmLoop' ? 'percussionLoop' : 'melodicLoop', loopId === 'rhythmLoop' ? 'rhythm' : 'melody');
            return sample?.properties?.loopBars || 4;
          })
        )
      : 4;

    beatConfig = { ...beatConfig, bars };

    // Initialize BeatGenerator
    beatGenerator = new BeatGenerator(beatConfig);
    // Pass loopTimings to Beat Generator
    beatGenerator.setLoopDuration(loopTimings);

    if (!schedulerTimer) {
      startScheduler();
    }

    const nextStart = getNextLoopStartTime();
    console.log(`Scheduling Beat Generator to start at ${nextStart.toFixed(3)} seconds.`);
    beatGenerator.start(nextStart);
  } else {
    if (beatGenerator) {
      beatGenerator.stop();
      beatGenerator = null;
    }
    if (!Object.values(playbackState.loops).some(Boolean)) {
      stopScheduler();
    }
  }
};


// Control Functions
const setBpm = () => {
  const bpmInput = parseInt(getElement('bpmInput')?.value, 10);
  if (isNaN(bpmInput) || bpmInput <= 0) {
    alert('Please enter a valid BPM value.');
    return;
  }
  currentBpm = bpmInput;
  alert(`BPM set to ${currentBpm}`);

  // Update BeatGenerator's BPM if active
  if (beatGenerator) {
    beatGenerator.syncWithBpm(currentBpm);
  }

  // Restart scheduler and reschedule loops
  if (playbackState.beat || Object.values(playbackState.loops).some(Boolean)) {
    stopScheduler();
    startScheduler();

    // Reschedule active loops with updated BPM
    activeSources.forEach((source, key) => {
      const [category, type] =
        key === 'rhythmLoop' ? ['percussionLoop', 'rhythm'] : ['melodicLoop', 'melody'];
      scheduleLoop(category, type, getNextLoopStartTime(), key);
    });
  }
};

const setVolume = (value) => {
  masterGainNode.gain.value = parseFloat(value) || 1.0;
};

const applySettings = () => {
  const instruments = summaryData.instrumentsByCategory.flatMap(([_, instruments]) => instruments);
  const uniqueInstruments = [...new Set(instruments)];

  const updatedInstruments = uniqueInstruments.reduce((acc, name) => {
    const capitalized = capitalize(name);
    acc[name] = {
      enabled: getElement(`enable${capitalized}`)?.checked || false,
      probability: parseFloat(getElement(`${name.toLowerCase()}Probability`)?.value) || 0,
      tempoVariants:
        beatConfig.instruments[name]?.tempoVariants ||
        defaultConfig.instruments[name]?.tempoVariants ||
        [1],
    };
    return acc;
  }, {});

  const randomness = {
    patternSelection: getElement('patternSelection')?.checked || false,
    hitVariation: getElement('hitVariation')?.checked || false,
  };

  const swingAmount = parseFloat(getElement('swingAmount')?.value) || 0;

  // Update beat generator configuration
  beatConfig = {
    ...beatConfig,
    instruments: updatedInstruments,
    randomness,
    swing: swingAmount,
  };

  alert('Beat generator settings updated.');

  // Restart BeatGenerator if active
  if (playbackState.beat && beatGenerator) {
    beatGenerator.refreshPatterns();
  }
};

// Event Listeners
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


/** main.js Dev Notes
 * ### Summary of `main.js`

The `main.js` file integrates the various components responsible for audio playback, beat generation, and loop control in an interactive web-based music system. It handles the scheduling of loops and beats, user interface interactions for controlling the audio settings, and dynamic management of audio sources. The file also allows the user to modify playback settings such as BPM and volume and controls the activation of beat generation and loop playback.

### Key Features:
- **Beat Generation**: Uses a `BeatGenerator` class to schedule beats for various instruments based on user configuration, BPM, and randomness settings.
- **Loop Management**: Supports the scheduling and control of multiple audio loops (e.g., rhythm and melody) using dynamically generated loop functions.
- **Audio Context Initialization**: Manages the `AudioContext`, which is essential for audio processing and playback.
- **User Controls**: Allows users to interact with the system via UI elements to set BPM, toggle loops, apply beat settings, and adjust volume.
- **Scheduling**: Includes a scheduler to manage the timing of loops and beats, ensuring they are played at the correct times relative to each other.
- **State Management**: Tracks the state of loops, beats, and audio sources to maintain synchronization and ensure proper playback.

### Functions and Methods:
1. **`capitalize(str)`**:
   - Capitalizes the first letter of a string.
   
2. **`getElement(id)`**:
   - Retrieves an HTML element by its `id`.

3. **`toggleClass(element, className, condition)`**:
   - Toggles the specified class on an element based on a given condition.

4. **`getNextBeatStartTime()`**:
   - Calculates the start time for the next beat relative to the current time and the global start time.

5. **`getNextLoopStartTime()`**:
   - Determines the start time for the next loop, considering the active loops and their durations.

6. **`scheduler()`**:
   - The main scheduling function that checks if it's time to schedule new loops or beats and does so based on the current time.
   
7. **`startScheduler()`**:
   - Starts the scheduler, which continuously checks for when to schedule new beats and loops.

8. **`stopScheduler()`**:
   - Stops the scheduler and clears any active audio sources.

9. **`toggleLoop(sourceKey)`**:
   - Toggles the state of a loop (e.g., rhythm or melody) and starts or stops it accordingly.

10. **`scheduleLoop(category, type, time, sourceKey)`**:
    - Schedules a loop by loading the appropriate sample, adjusting the playback rate, and starting the audio source.

11. **`stopSource(loopId)`**:
    - Stops a specific audio source (loop) based on its loop ID.

12. **`toggleBeat()`**:
    - Toggles the Beat Generator on or off, starting or stopping beat scheduling.

13. **`setBpm()`**:
    - Sets the BPM (beats per minute) for the playback and updates the Beat Generator's configuration if active.

14. **`setVolume(value)`**:
    - Sets the volume for the master gain node.

15. **`applySettings()`**:
    - Applies the settings for the beat generator, such as instrument enablement, probability, tempo variants, and randomness.

### Event Listeners:
- **Click Events**: 
  - Handles UI interactions for playing instruments, toggling loops, generating beats, applying settings, and setting the BPM.
- **Volume Slider**: 
  - Adjusts the volume dynamically when the user interacts with the volume slider.

### Important Information for Developers Importing This Module:
- **Beat Generator Integration**: The `BeatGenerator` is initialized and controlled via the `toggleBeat()` function. Developers can customize the beat generation by modifying the `beatConfig` object, which includes settings like BPM, swing, randomness, and instruments.
- **Loop Control**: Loops (e.g., rhythm and melody) are controlled by `toggleLoop()` and `scheduleLoop()`, which allow for dynamic playback of different audio loop categories. Loops are scheduled at precise times based on the current BPM and other factors like loop trimming and playback rate.
- **Audio Context**: The `AudioContext` is initialized via user interaction (click event), which complies with modern browser autoplay restrictions. All audio playback, sample loading, and synchronization are dependent on the `audioContext`.
- **UI Interactions**: Developers can hook up UI elements like buttons, sliders, and inputs to control various aspects of playback, such as BPM, volume, and beat settings. Event listeners handle actions for toggling loops, playing instruments, and updating settings.
- **Sample Loading**: The module dynamically loads audio samples using `loadSample()` and schedules them at the right time using `scheduleLoop()`. This ensures smooth audio playback in sync with the generated beats and loops.

### Dependencies:
- **`audioContext`, `masterGainNode`, `loadSample`, `initializeAudioContext`, `getGlobalStartTime`** from `audioLoader.js`: These functions and objects manage the audio environment, including loading samples and synchronizing playback.
- **`BeatGenerator`, `defaultConfig`** from `beatGenerator.js`: Used to generate beats and manage the timing and patterns of the beat sequence.
- **`samples` from `samples.js`**: Provides the list of available audio samples that can be played as loops or individual beats.
- **`summaryData` from `summary.js`**: Contains dynamic data that helps to generate instrument play functions and manages loop states.

This module serves as the central controller for orchestrating audio loops, beats, and user interactions, making it a crucial part of any web-based music creation or sequencing project.
 */