// player.js
import { samples } from './samples.js';
import { audioContext, masterGainNode, loadSample } from './audioLoader.js';

/**
 * Convert bars and beats to seconds based on BPM.
 * @param {number} bars - Number of bars.
 * @param {number} beats - Number of beats.
 * @param {number} bpm - Beats per minute.
 * @param {number} beatsPerBar - Number of beats per bar (default is 4).
 * @returns {number} - Time in seconds.
 */
const barsBeatsToSeconds = (bars, beats, bpm, beatsPerBar = 4) => {
  const beatDuration = 60 / bpm;
  return (bars * beatsPerBar + beats) * beatDuration;
};

// Build a sample index for quick lookups
const sampleIndex = samples.reduce((index, sample) => {
  const category = sample.category.toLowerCase();
  const type = sample.type.toLowerCase();

  if (!index[category]) index[category] = {};
  if (!index[category][type]) index[category][type] = [];

  index[category][type].push(sample);
  return index;
}, {});



/**
 * Retrieve a sample by category and type.
 * @param {string} category - The category of the sample (e.g., 'drum', 'loop').
 * @param {string} type - The type within the category (e.g., 'kick', 'snare').
 * @returns {object|null} - The sample object or null if not found.
 */
export const getSample = (category, type) => {
  const lowerCategory = category.toLowerCase();
  const lowerType = type.toLowerCase();
  console.log(`Looking for sample with category: ${lowerCategory}, type: ${lowerType}`);

  const samplesByType = sampleIndex[lowerCategory]?.[lowerType];
  return samplesByType ? samplesByType[0] : null;
};

/**
 * Play a sample at a specific time.
 * @param {string} category - The category of the sample.
 * @param {string} type - The type of the sample.
 * @param {number} time - The time in audioContext time to play the sample.
 */
export const playSampleAtTime = async (category, type, time) => {
  const sample = getSample(category, type);
  if (!sample) {
    console.warn(`Sample not found: Category - ${category}, Type - ${type}`);
    return;
  }

  const audioBuffer = await loadSample(sample);
  if (!audioBuffer) {
    console.warn(`Failed to load audio buffer for sample: ${sample.name}`);
    return;
  }

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  const {
    playbackRate = 1.0,
    volume = 1.0,
    trimStart = 0,
    trimEnd = 0,
    loop = false,
  } = sample.properties || {};

  source.playbackRate.value = playbackRate;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume;

  source.connect(gainNode).connect(masterGainNode);

  const duration = audioBuffer.duration - trimStart - trimEnd;

  if (loop) {
    source.loop = true;
    source.loopStart = trimStart;
    source.loopEnd = audioBuffer.duration - trimEnd;
  }

  console.log(`Sample '${sample.name}' scheduled to start at audio time: ${time.toFixed(3)} seconds`);

  source.start(time, trimStart, duration);
};

/**
 * Play a sample with optional processing based on its properties.
 * @param {object} sample - The sample object.
 * @param {number|null} globalBpm - Optional global BPM to override sample BPM.
 */
export const playSample = async (sample, globalBpm = null, startTime = null) => {
  if (!sample) return;

  const audioBuffer = await loadSample(sample);
  if (!audioBuffer) return;

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  const {
    playbackRate: initialPlaybackRate = 1.0,
    volume = 1.0,
    trimStart = 0,
    trimEnd = 0,
    loop = false,
    bpm: sampleBpm = sample.tempo || 120,
    loopPoints,
    timeSignature = [4, 4],
  } = sample.properties || {};

  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume;

  source.connect(gainNode).connect(masterGainNode);

  let playbackRate = initialPlaybackRate;

  if (loop && globalBpm && sampleBpm) {
    playbackRate *= globalBpm / sampleBpm;
  }

  if (playbackRate <= 0) {
    console.warn(`Invalid playback rate for sample ${sample.id}. Using default value of 1.0.`);
    playbackRate = 1.0;
  }
  source.playbackRate.value = playbackRate;

  const startOffset = trimStart;
  const endOffset = audioBuffer.duration - trimEnd;
  const duration = endOffset - startOffset;

  if (loop) {
    source.loop = true;

    let loopStart = startOffset;
    let loopEnd = endOffset;

    if (loopPoints && sampleBpm) {
      const { bars = 0, beats = 0 } = loopPoints;
      const [beatsPerBar] = timeSignature;

      const loopDuration = barsBeatsToSeconds(bars, beats, sampleBpm, beatsPerBar);
      loopEnd = loopStart + loopDuration;

      if (loopEnd > endOffset) {
        console.warn(
          `Calculated loop end (${loopEnd}s) exceeds buffer end (${endOffset}s). Adjusting loop end to buffer end.`
        );
        loopEnd = endOffset;
      }
    }

    if (loopEnd > audioBuffer.duration) {
      console.warn(
        `Loop end (${loopEnd}s) exceeds buffer duration (${audioBuffer.duration}s). Adjusting loop end to buffer end.`
      );
      loopEnd = audioBuffer.duration;
    }

    source.loopStart = loopStart;
    source.loopEnd = loopEnd;

    console.log(`Playing loop: ${sample.name}`);
    console.log(`Playback Rate: ${playbackRate}`);
    console.log(`Loop Start: ${source.loopStart} sec, Loop End: ${source.loopEnd} sec`);

    const scheduledStartTime = startTime ?? audioContext.currentTime;
    console.log(
      `Sample '${sample.name}' scheduled to start at audio time: ${scheduledStartTime.toFixed(3)} seconds`
    );
    source.start(scheduledStartTime, startOffset);
  } else {
    const scheduledStartTime = startTime ?? audioContext.currentTime;
    console.log(
      `Playing sample: ${sample.name} at audio time: ${scheduledStartTime.toFixed(3)} seconds`
    );
    source.start(scheduledStartTime, startOffset, duration);
  }
};

const instruments = ['kick', 'snare', 'hihat', 'rimshot', 'rhythm', 'melody'];
const instrumentFunctions = {};

instruments.forEach(instrument => {
  const functionName = `play${instrument.charAt(0).toUpperCase() + instrument.slice(1)}`;
  const category = ['rhythm', 'melody'].includes(instrument) ? 'loop' : 'drum';

  instrumentFunctions[functionName] = async (globalBpm = null) => {
    await playRandomSample(category, instrument, globalBpm);
  };
});

// Export the generated functions
export const {
  playKick,
  playSnare,
  playHihat,
  playRimshot,
  playRhythmLoop,
  playMelodyLoop,
} = instrumentFunctions;


/**
 * Play a random sample from a specified category and type.
 * @param {string} category - The category of the sample.
 * @param {string} type - The type within the category.
 * @param {number|null} globalBpm - Optional global BPM to override sample BPM.
 */
export const playRandomSample = async (category, type, globalBpm = null, startTime = null) => {
  const lowerCategory = category.toLowerCase();
  const lowerType = type.toLowerCase();

  const samplesByType = sampleIndex[lowerCategory]?.[lowerType];
  if (!samplesByType || samplesByType.length === 0) {
    console.warn(`No samples found for category: ${category}, type: ${type}`);
    return;
  }

  const randomIndex = Math.floor(Math.random() * samplesByType.length);
  const sample = samplesByType[randomIndex];

  await playSample(sample, globalBpm, startTime);
};


/** Dev notes for playres.js
 * ### Summary of `player.js`

The `player.js` module handles the playback of audio samples using the **Web Audio API**. It provides functions to load, play, and manipulate samples in different categories (e.g., drum, loop). The module supports various playback options, including adjusting playback rates based on BPM, trimming audio samples, looping, and managing the scheduling of audio playback.

### Key Features:
- **Sample Retrieval**: Retrieves samples based on their category and type.
- **Playback Scheduling**: Plays samples at specific times and supports advanced features like trimming, looping, and adjusting playback rates.
- **Random Sample Playback**: Allows playing a random sample from a specific category and type.
- **Tempo and Looping Adjustments**: Adjusts playback rates based on the BPM and time signature of samples, enabling tempo synchronization for loops.
- **Utility for Audio Management**: Functions for playing specific drum sounds (kick, snare, hi-hat, etc.) or loops (rhythm, melody).

### Functions and Methods:
1. **`barsBeatsToSeconds(bars, beats, bpm, beatsPerBar = 4)`**:
   - Converts bars and beats to time in seconds based on the given BPM and beats per bar.
   - Used for calculating the duration of a loop in time.

2. **`getSample(category, type)`**:
   - Retrieves a sample object based on its category (e.g., drum, loop) and type (e.g., kick, snare).
   - Returns `null` if no matching sample is found.

3. **`playSampleAtTime(category, type, time)`**:
   - Plays a sample at a specific time within the audio context.
   - Supports looping, trimming, and adjusting the volume and playback rate for the sample.
   - Logs the sample’s start time for tracking.

4. **`playSample(sample, globalBpm = null, startTime = null)`**:
   - Plays a sample object with optional processing based on its properties.
   - Supports BPM synchronization, looping, trimming, and adjusting playback rate.
   - If `globalBpm` is provided, the sample’s playback rate is adjusted accordingly.

5. **`playRandomSample(category, type, globalBpm = null, startTime = null)`**:
   - Selects and plays a random sample from the specified category and type.
   - If `globalBpm` is provided, the playback rate is adjusted to match it.

6. **Example Functions for Playing Specific Samples**:
   - **`playKick(globalBpm = null)`**: Plays a random kick sample.
   - **`playSnare(globalBpm = null)`**: Plays a random snare sample.
   - **`playHiHat(globalBpm = null)`**: Plays a random hi-hat sample.
   - **`playRimshot(globalBpm = null)`**: Plays a random rimshot sample.
   - **`playRhythmLoop(globalBpm = null)`**: Plays a random rhythm loop.
   - **`playMelodyLoop(globalBpm = null)`**: Plays a random melody loop.

### Important Information for Developers Importing This Module:
- **Sample Management**: The module depends on the `samples` object, which contains a collection of sample data (e.g., kick, snare, melody loops). Developers can add or modify this collection to include their own samples.
- **Tempo Control**: Playback speed is automatically adjusted based on the global BPM. This feature ensures that looped samples play in sync with the overall tempo.
- **Trim and Looping**: The module supports trimming (cutting off portions of a sample) and looping, making it flexible for playing different parts of a sample repeatedly.
- **Playback Time Scheduling**: Developers can specify when a sample should play by passing a `time` argument, which is relative to the `audioContext`'s current time.
- **Sample Properties**: Each sample has properties like `playbackRate`, `volume`, `trimStart`, `trimEnd`, and `loop`, which control its playback behavior. These properties allow for detailed control over how each sample is played.
- **Randomization**: The `playRandomSample` function ensures that each playthrough could potentially feature different variations of a sample, helping to create more dynamic compositions.

### Dependencies:
- **`samples` from `samples.js`**: Contains the sample data, which includes information about sample categories, types, and properties.
- **`audioContext`, `masterGainNode`, `loadSample` from `audioLoader.js`**: These are essential for creating, processing, and controlling the audio playback.

This module provides a powerful set of utilities for managing and playing samples within a music production or sequencing application, making it ideal for building beat-making tools, drum machines, or interactive sound applications.
 */





/**### Condensed Version for AI Assistant (player.js)

**`player.js` Summary:**
Manages the playback of audio samples using the **Web Audio API**, with functions for sample retrieval, scheduling, tempo adjustments, looping, and random sample playback.

**Key Features:**
- **Sample Retrieval**: Retrieves samples by category and type.
- **Playback Scheduling**: Plays samples at specific times, supporting tempo syncing, trimming, and looping.
- **Random Sample Playback**: Plays random samples from a category/type.
- **Tempo Adjustments**: Syncs playback rate with BPM for loops and samples.
- **Audio Management**: Functions for playing specific sounds (kick, snare, loops).

**Core Functions:**
- **`barsBeatsToSeconds(bars, beats, bpm, beatsPerBar = 4)`**: Converts bars/beats to time in seconds.
- **`getSample(category, type)`**: Retrieves sample by category/type; returns `null` if not found.
- **`playSampleAtTime(category, type, time)`**: Plays sample at a specific time; supports loop, trim, volume, playback rate.
- **`playSample(sample, globalBpm = null, startTime = null)`**: Plays sample with optional BPM sync, loop, trim, and rate adjustment.
- **`playRandomSample(category, type, globalBpm = null, startTime = null)`**: Plays a random sample, adjusted to BPM.
- **Specific Sample Play**: Functions like `playKick(globalBpm = null)`, `playSnare(globalBpm = null)` for specific sound types.

**Developer Notes:**
- **Sample Management**: Relies on `samples` object for sample data; modifiable for custom samples.
- **Tempo Control**: Automatically adjusts playback to global BPM for sync.
- **Trim and Looping**: Supports trimming and looping of samples.
- **Playback Scheduling**: Developers specify sample playback time relative to `audioContext` time.
- **Sample Properties**: Each sample has properties like `playbackRate`, `volume`, `trimStart`, `trimEnd`, `loop` for detailed control.
- **Randomization**: `playRandomSample` provides random sample variations for dynamic playback.

**Dependencies:**
- **`samples` from `samples.js`**: Provides sample data.
- **`audioContext`, `masterGainNode`, `loadSample` from `audioLoader.js`**: Manage audio playback.

This module is essential for managing and playing dynamic audio samples with advanced features for tempo sync, trimming, looping, and randomization, making it ideal for interactive music applications. */