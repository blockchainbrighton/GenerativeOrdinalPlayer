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
let secondsPerBeat = 60 / currentBpm;



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
playbackState.loops = Object.fromEntries(
  Object.values(summaryData.instrumentsByCategory)
    .flat()
    .map(loopId => [loopId, false])
);


// Initialize AudioContext on user interaction
document.body.addEventListener(
  'click',
  () => initializeAudioContext(),
  { once: true }
);

// Dynamically generate instrument play functions
const instrumentPlayFunctions = Object.fromEntries(
  Object.entries(summaryData.instrumentsByCategory)
    .flatMap(([category, instruments]) =>
      instruments.map(instrument => [
        instrument,
        () => {
          const startTime = getNextBeatStartTime();
          playRandomSample(category, instrument, currentBpm, startTime);
        },
      ])
    )
);


// Timing Functions
const getNextBeatStartTime = () => {
  const now = audioContext.currentTime;
  const globalStart = getGlobalStartTime();
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

const calculateBars = () => {
  const activeLoopKeys = Object.keys(playbackState.loops).filter(
    (key) => playbackState.loops[key]
  );
  if (activeLoopKeys.length === 0) return 4;

  return Math.max(
    ...activeLoopKeys.map((loopId) => {
      const category = loopId === 'rhythmLoop' ? 'percussionLoop' : 'melodicLoop';
      const type = loopId === 'rhythmLoop' ? 'rhythm' : 'melody';
      const sample = getSample(category, type);
      return sample?.properties?.loopBars || 4;
    })
  );
};

const toggleBeat = () => {
  playbackState.beat = !playbackState.beat;
  toggleClass(getElement('generateBeat'), 'active', playbackState.beat);

  if (playbackState.beat) {
    if (beatGenerator?.isPlaying) {
      console.warn('BeatGenerator is already running.');
      return;
    }

    beatConfig = { ...beatConfig, bars: calculateBars() };

    // Initialize BeatGenerator
    beatGenerator = new BeatGenerator(beatConfig);
    beatGenerator.setLoopDuration(loopTimings);

    if (!schedulerTimer) {
      startScheduler();
    }

    const nextStart = getNextLoopStartTime();
    console.log(`Scheduling Beat Generator to start at ${nextStart.toFixed(3)} seconds.`);
    beatGenerator.start(nextStart);
  } else {
    beatGenerator?.stop();
    beatGenerator = null;

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
  secondsPerBeat = 60 / currentBpm;
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
  masterGainNode.gain.value = parseFloat(value) ?? 1.0;
};


const applySettings = () => {
  const instruments = Object.values(summaryData.instrumentsByCategory).flat();
  const uniqueInstruments = [...new Set(instruments)];

  const updatedInstruments = uniqueInstruments.reduce((acc, name) => {
    const capitalized = capitalize(name);
    acc[name] = {
      enabled: getElement(`enable${capitalized}`)?.checked ?? false,
      probability: parseFloat(getElement(`${name.toLowerCase()}Probability`)?.value) ?? 0,
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
const idActionMap = {
  generateBeat: toggleBeat,
  applySettings: applySettings,
  setBpm: setBpm,
};

document.body.addEventListener('click', ({ target }) => {
  const { id } = target;

  if (idActionMap[id]) {
    idActionMap[id]();
    return;
  }

  // Handle Loop Buttons
  const loopMatch = id.match(/^play(.*)Loop$/);
  if (loopMatch) {
    const loopType = loopMatch[1].toLowerCase();
    const sourceKey = `${loopType}Loop`;
    toggleLoop(sourceKey);
    return;
  }

  // Handle Play Instrument Buttons
  if (id.startsWith('play') && !id.endsWith('Loop')) {
    const instrumentName = id.replace(/^play/i, '').toLowerCase();
    instrumentPlayFunctions[instrumentName]?.();
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






/** Condensed dev notes for main.js for AI assistants: 
 * ### Condensed Version for AI Assistant (main.js)

**`main.js` Summary:**
Handles audio playback, beat generation, loop management, and user interaction in a web-based music system.

**Key Features:**
- **Beat Generation**: `BeatGenerator` schedules beats based on user config, BPM, and randomness.
- **Loop Management**: Controls multiple loops (e.g., rhythm, melody) using dynamic functions.
- **Audio Context**: Manages `AudioContext` for playback.
- **User Controls**: Interface for adjusting BPM, volume, toggling loops, and controlling beat settings.
- **Scheduling**: Ensures loops and beats play in sync with the correct timing.
- **State Management**: Tracks loop and beat states for accurate playback.

**Core Functions:**
- **`capitalize(str)`**: Capitalizes the first letter.
- **`getElement(id)`**: Retrieves an HTML element by `id`.
- **`toggleClass(element, className, condition)`**: Toggles a class based on a condition.
- **`getNextBeatStartTime()`, `getNextLoopStartTime()`**: Calculates start times for beats/loops.
- **`scheduler()`, `startScheduler()`, `stopScheduler()`**: Controls the loop/beat scheduling.
- **`toggleLoop(sourceKey)`, `scheduleLoop(category, type, time, sourceKey)`**: Manages and schedules loops.
- **`stopSource(loopId)`**: Stops a specific loop.
- **`toggleBeat()`, `setBpm()`, `setVolume(value)`**: Toggles beat generator, sets BPM, adjusts volume.
- **`applySettings()`**: Applies beat generator settings.

**UI Events:**
- **Click & Volume Slider Events**: Handle UI interactions for loops, beats, BPM, and volume.

**Developer Notes:**
- **Beat Generator**: Controlled via `toggleBeat()`; customizable via `beatConfig`.
- **Loop Control**: Managed by `toggleLoop()` and `scheduleLoop()` for dynamic playback.
- **Audio Context**: Initialized via user click to comply with autoplay restrictions.
- **UI Integration**: Can be linked with UI elements for real-time adjustments.
- **Sample Loading**: Uses `loadSample()` and `scheduleLoop()` for dynamic sample playback.

**Dependencies:**
- **Audio Loader**: `audioContext`, `masterGainNode`, `loadSample`, etc., for audio management.
- **Beat Generator**: `BeatGenerator`, `defaultConfig` for beat timing.
- **Sample List**: `samples` for available audio samples.
- **Summary Data**: `summaryData` for managing play functions and loop states.

This module is essential for orchestrating web-based music systems, providing real-time control over audio loops, beats, and playback settings.
*/