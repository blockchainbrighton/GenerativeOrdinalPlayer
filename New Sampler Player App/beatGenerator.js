// beatGenerator.js
import { audioContext, getGlobalStartTime } from './audioLoader.js';
import { samples } from './samples.js';
import { playSampleAtTime } from './player.js';
import { patterns } from './patterns.js';

/**
 * Default configuration for the beat generator.
 */
export const defaultConfig = {
  bpm: 120,
  bars: 4,
  beatsPerBar: 4,
  swing: 0, // Swing amount (0 to 1)
  fillProbability: 0.2, // Probability of a fill occurring at the end of a cycle
  instruments: {
    kick: { enabled: true, probability: 0.9, tempoVariants: [1, 2, 4] },
    snare: { enabled: true, probability: 0.8, tempoVariants: [1, 2, 4] },
    hihat: { enabled: true, probability: 0.95, tempoVariants: [1, 2, 4] },
    rimshot: { enabled: false, probability: 0.5, tempoVariants: [1, 2, 4] },
    floortom: { enabled: true, probability: 0.3, tempoVariants: [1, 2, 4] },
    hightom: { enabled: true, probability: 0.3, tempoVariants: [1, 2, 4] },
    // Add other instruments as needed
  },
  patterns: patterns, // Use imported patterns
  randomness: {
    patternSelection: true,
    hitVariation: true,
  },
};

/**
 * Merges user configuration with the default configuration.
 * @param {object} userConfig - User-provided configuration.
 * @returns {object} - Merged configuration.
 */
const mergeConfigs = (userConfig = {}) => ({
  ...defaultConfig,
  ...userConfig,
  instruments: {
    ...defaultConfig.instruments,
    ...(userConfig.instruments || {}),
  },
  randomness: {
    ...defaultConfig.randomness,
    ...(userConfig.randomness || {}),
  },
});

/**
 * BeatGenerator class to manage beat patterns and scheduling.
 */
export class BeatGenerator {
  constructor(userConfig = {}) {
    this.config = mergeConfigs(userConfig);
    this.initializeTempoModifiers();
    this.generatePatterns();
  }

   /**
   * Starts the Beat Generator.
   */
   start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    console.log('BeatGenerator started.');
  }

  /**
   * Stops the Beat Generator.
   */
  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    console.log('BeatGenerator stopped.');
    // Implement any necessary cleanup here (e.g., cancel scheduled beats)
  }


  /**
   * Initializes tempo modifiers for instruments based on their tempo variants.
   */
  initializeTempoModifiers() {
    this.tempoModifiers = {};
    for (const [instrument, settings] of Object.entries(this.config.instruments)) {
      if (settings.tempoVariants && settings.tempoVariants.length > 1) {
        this.tempoModifiers[instrument] = {
          currentVariantIndex: 0,
          stepsUntilChange: this.randomTempoChangeFrequency(),
        };
      }
    }
  }


  /**
   * Schedules a beat based on the generated patterns.
   * @param {number} startTime - The time to start scheduling from.
   */
  scheduleBeat(startTime = null) {
    if (startTime === null) {
      const globalStartTime = getGlobalStartTime();
      startTime = globalStartTime;
    }
    const { swing, fillProbability } = this.config;
    const scheduledSounds = [];
    const uniqueSamples = new Set();

    // Log the start time of the beat
    console.log(`Beat scheduled to start at audio time: ${startTime.toFixed(3)} seconds`);

    // Keep track of cycles to trigger fills at specific times
    if (this.cycleCount === undefined) {
      this.cycleCount = 0;
    }

    // Decide when to play a fill (e.g., every 4 cycles)
    const playFill = Math.random() < fillProbability && this.cycleCount % 4 === 3; // Play a fill based on probability and cycle count

    // Generate fill patterns if needed
    if (playFill) {
      this.generatePatterns(true); // Generate fill patterns
    } else {
      this.generatePatterns(false); // Generate standard patterns
    }

    // Determine the maximum pattern length among all instruments
    const maxPatternLength = Math.max(...Object.values(this.generatedPatterns).map((p) => p.length));

    let firstBeatTimeLogged = false;

    for (const [instrumentName, pattern] of Object.entries(this.generatedPatterns)) {
      const stepDuration = (60 / this.config.bpm) / this.config.beatsPerBar;

      for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] !== 1) continue;

        let time = startTime + i * stepDuration;

        // Apply swing to off-beats
        const isOffBeat = (i % 2) !== 0;
        if (swing > 0 && isOffBeat) {
          time += stepDuration * swing;
        }

        // Log the time of the first beat
        if (!firstBeatTimeLogged) {
          console.log(`First beat scheduled at audio time: ${time.toFixed(3)} seconds`);
          firstBeatTimeLogged = true;
        }

        const samplesList = getSamplesByType('drum', instrumentName);
        if (samplesList.length > 0) {
          const selectedSample = playRandomSampleAtTime(samplesList, time);
          if (selectedSample) {
            scheduledSounds.push({
              instrument: instrumentName,
              sample: selectedSample.type,
              time: time.toFixed(3),
            });
            uniqueSamples.add(selectedSample.type);
          }
        }
      }

      // Update tempo modifiers for the instrument if not playing a fill
      if (!playFill) {
        const settings = this.config.instruments[instrumentName];
        const modifier = this.tempoModifiers[instrumentName];
        if (settings.tempoVariants && modifier) {
          modifier.stepsUntilChange -= 1;
          if (modifier.stepsUntilChange <= 0) {
            modifier.currentVariantIndex = (modifier.currentVariantIndex + 1) % settings.tempoVariants.length;
            modifier.stepsUntilChange = this.randomTempoChangeFrequency();
            // Regenerate the patterns with the new tempo variant
            this.generatePatterns();
          }
        }
      }
    }

    // Increment cycle count after scheduling
    this.cycleCount += 1;

    // Condensed Log: List of unique samples used in this loop
    if (uniqueSamples.size > 0) {
      console.log('Samples Used:', Array.from(uniqueSamples).join(', '));
    }

    // Detailed Log: Selection of sounds for this beat
    if (scheduledSounds.length > 0) {
      console.log('Beat Update:', scheduledSounds);
    }
  }

  /**
   * Sets the loop duration based on active loops.
   * @param {number} duration - The loop duration in seconds.
   */
  setLoopDuration(duration) {
    this.loopDuration = duration;
  }

  /**
   * Refreshes patterns, typically after settings changes.
   */
  refreshPatterns() {
    this.generatePatterns(false);
  }

  /**
   * Determines the frequency of tempo changes.
   * @returns {number} - Steps until the next tempo change.
   */
  randomTempoChangeFrequency() {
    if (!this._tempoChangeFrequency) {
      this._tempoChangeFrequency = Math.floor(Math.random() * 5) + 1; // Random between 1 and 5
    }
    return this._tempoChangeFrequency;
  }


  /**
 * Generates patterns for each instrument based on the configuration.
 * @param {boolean} isFill - Indicates if generating a fill pattern.
 */
generatePatterns(isFill = false) {
  const {
    instruments,
    beatsPerBar,
    bars,
    randomness: { patternSelection, hitVariation },
    patterns: importedPatterns,
    bpm,
  } = this.config;

  this.beatDuration = 60 / bpm;
  this.totalDuration = this.beatDuration * beatsPerBar * bars;

  // Determine the highest tempo multiplier among all instruments
  const maxTempoMultiplier = Math.max(
    ...Object.values(instruments).map((settings) =>
      settings.tempoVariants ? Math.max(...settings.tempoVariants) : 1
    )
  );

  // The highest resolution is the base for all patterns
  const maxResolution = beatsPerBar * bars * maxTempoMultiplier;

  // The base step duration for the highest resolution
  this.baseStepDuration = this.totalDuration / maxResolution;

  this.generatedPatterns = {};
  this.instrumentStepDurations = {}; // Store per-instrument step durations

  for (const [instrumentName, settings] of Object.entries(instruments)) {
    if (!settings.enabled) continue;

    // Determine current tempo multiplier
    let tempoMultiplier = 1;
    if (settings.tempoVariants && settings.tempoVariants.length > 0) {
      const modifier = this.tempoModifiers[instrumentName];
      if (modifier) {
        tempoMultiplier = settings.tempoVariants[modifier.currentVariantIndex];
      }
    }

    // Calculate step duration for this instrument
    const stepDuration = this.baseStepDuration / (tempoMultiplier / maxTempoMultiplier);
    this.instrumentStepDurations[instrumentName] = stepDuration;

    // Select or generate base pattern at max resolution
    let basePattern = [];
    const instrumentPatterns = isFill
      ? importedPatterns[`${instrumentName}_fills`] || []
      : importedPatterns[instrumentName] || [];

    if (instrumentPatterns.length > 0) {
      basePattern = patternSelection
        ? instrumentPatterns[Math.floor(Math.random() * instrumentPatterns.length)]
        : instrumentPatterns[0];
    } else {
      // Default to a pattern with hits on every step
      basePattern = Array(maxResolution).fill(1);
    }

    // Downsample the base pattern according to tempoMultiplier
    const pattern = this.downsamplePattern(basePattern, maxTempoMultiplier / tempoMultiplier);

    // Apply probability and hit variation
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === 1) {
        if (Math.random() > settings.probability) {
          pattern[i] = 0;
        }
      } else if (!isFill && hitVariation && Math.random() < 0.1) {
        pattern[i] = 1;
      }
    }

    this.generatedPatterns[instrumentName] = pattern;
  }
}


  /**
   * Downsamples a pattern by a given factor.
   * @param {Array} pattern - The high-resolution pattern.
   * @param {number} factor - The factor by which to downsample.
   * @returns {Array} - The downsampled pattern.
   */
  downsamplePattern(pattern, factor) {
    const downsampledPattern = [];
    for (let i = 0; i < pattern.length; i += factor) {
      downsampledPattern.push(pattern[Math.floor(i)]);
    }
    return downsampledPattern;
  }

  
}

/**
 * Retrieves samples by category and type.
 * @param {string} category - Sample category.
 * @param {string} type - Sample type.
 * @returns {Array} - List of matching samples.
 */
const getSamplesByType = (category, type) => {
  const standardizedType = type.toLowerCase();
  const tomTypes = ['floortom', 'hightom', 'tom'];

  return samples.filter((sample) => {
    if (sample.category !== category) return false;
    const sampleType = sample.type.toLowerCase();

    if (tomTypes.includes(standardizedType) && tomTypes.includes(sampleType)) return true;

    if (standardizedType === 'rimshot' && sampleType === 'rimshot') return true;

    return sampleType === standardizedType;
  });
};

/**
 * Plays a random sample from a list at a specific time.
 * @param {Array} sampleList - List of samples.
 * @param {number} time - Time to play the sample.
 * @returns {object|null} - The selected sample or null if none.
 */
const playRandomSampleAtTime = (sampleList, time) => {
  if (!Array.isArray(sampleList) || sampleList.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * sampleList.length);
  const sample = sampleList[randomIndex];
  playSampleAtTime(sample.category, sample.type, time);
  return sample;
};



/** Beat Generator Module Dev Notes:
 * 
 * ### Summary of `beatGenerator.js`

The `beatGenerator.js` file defines a **Beat Generator** class that can generate and schedule beat patterns for various instruments, with customization options for tempo, swing, and randomness. It is designed to integrate with other modules, such as `audioLoader.js`, `samples.js`, and `player.js`, to play the samples at specific times according to the generated patterns. The generator can be configured with default or user-defined settings, and it includes features like tempo variants for instruments, swing effects, and the ability to trigger fills at the end of cycles.

### Key Features:
- **Default Configuration**: Specifies the BPM, bars, beats per bar, instruments, and randomness settings.
- **Dynamic Pattern Generation**: Can generate standard and fill patterns for each instrument based on the configuration.
- **Tempo Modifiers**: Allows for dynamic tempo changes for instruments based on their tempo variants.
- **Swing**: Applies a swing effect to off-beats.
- **Randomization**: Includes probability-based randomization for instrument hits and pattern selection.
- **Fill Generation**: Includes functionality to trigger fills at certain points based on a defined probability.
- **Sample Selection**: Uses a function to pick random samples and play them at specific times.

### Functions and Methods:
1. **`mergeConfigs(userConfig = {})`**:
   - Merges the default configuration with the user's custom configuration.
   - Returns a merged configuration object.

2. **`constructor(userConfig = {})`**:
   - Initializes the BeatGenerator with a given configuration.
   - Calls methods to set up tempo modifiers and generate patterns.

3. **`start()`**:
   - Starts the Beat Generator, enabling beat scheduling.
   - Logs "BeatGenerator started."

4. **`stop()`**:
   - Stops the Beat Generator.
   - Logs "BeatGenerator stopped" and cancels scheduled beats if needed.

5. **`initializeTempoModifiers()`**:
   - Initializes tempo modifiers for each instrument based on its tempo variants.

6. **`generatePatterns(isFill = false)`**:
   - Generates the beat patterns for each instrument.
   - If `isFill` is `true`, it generates a fill pattern; otherwise, it generates the standard pattern.
   - Handles pattern selection and downsampling.

7. **`scheduleBeat(startTime = null)`**:
   - Schedules beats based on the generated patterns.
   - Takes into account swing, fill probability, and tempo changes.

8. **`setLoopDuration(duration)`**:
   - Sets the loop duration for the beat generator.

9. **`refreshPatterns()`**:
   - Refreshes the patterns, typically after configuration changes.

10. **`randomTempoChangeFrequency()`**:
    - Determines a random frequency for tempo changes, returning a value between 1 and 5.

11. **`downsamplePattern(pattern, factor)`**:
    - Downsamples a high-resolution pattern by a specified factor.

12. **`getSamplesByType(category, type)`**:
    - Retrieves a list of samples based on category and type.
    - Filters through the imported `samples` array.

13. **`playRandomSampleAtTime(sampleList, time)`**:
    - Plays a random sample from a given list at a specific time.
    - Calls `playSampleAtTime()` from the `player.js` module.

### Framework/Import Details:
- **`audioContext` and `getGlobalStartTime`** from `audioLoader.js`: Used to manage audio playback and track the global start time for scheduling beats.
- **`samples` from `samples.js`**: Contains the available audio samples for different instruments, which are selected randomly during beat generation.
- **`playSampleAtTime` from `player.js`**: Handles the actual playback of samples at the scheduled time.
- **`patterns` from `patterns.js`**: Provides the standard and fill patterns used by the Beat Generator to construct the beat sequences.

### Important Information for Developers Importing This Module:
- **Customization**: The module allows users to define custom configurations for beats, including BPM, swing, and instrument-specific settings.
- **Dependencies**: This module relies on the `audioLoader.js`, `samples.js`, and `player.js` modules for managing audio context and playing samples.
- **Randomization Features**: There are various randomization settings available, such as pattern selection and hit variation, which help generate dynamic and varied beats.
- **Instruments**: It supports multiple instruments (kick, snare, hihat, etc.), each with its own probability of being played and tempo variants for different playback speeds.
- **Fill Patterns**: The module includes logic for triggering fill patterns at the end of a cycle, with a configurable probability.

 */




/**### Condensed Version for AI Assistant (beatGenerator.js)

**`beatGenerator.js` Summary:**
Defines a **Beat Generator** class that generates and schedules customizable beat patterns, supporting tempo, swing, randomness, and fill triggers. Integrates with `audioLoader.js`, `samples.js`, and `player.js` for playback.

**Key Features:**
- **Default Configuration**: Sets BPM, bars, beats per bar, instruments, and randomness.
- **Dynamic Pattern Generation**: Creates standard and fill patterns for each instrument.
- **Tempo Modifiers**: Dynamic tempo changes based on tempo variants for instruments.
- **Swing**: Applies swing effect to off-beats.
- **Randomization**: Probability-based randomization for instrument hits and patterns.
- **Fill Generation**: Triggers fills at defined points with configurable probability.
- **Sample Selection**: Picks random samples to play at scheduled times.

**Core Functions:**
- **`mergeConfigs(userConfig = {})`**: Merges user config with defaults.
- **`constructor(userConfig = {})`**: Initializes BeatGenerator with user config.
- **`start()`**: Starts beat scheduling, logs start.
- **`stop()`**: Stops the Beat Generator and cancels scheduled beats.
- **`initializeTempoModifiers()`**: Sets up tempo modifiers for instruments.
- **`generatePatterns(isFill = false)`**: Generates standard or fill patterns.
- **`scheduleBeat(startTime = null)`**: Schedules beats with swing, fill probability, and tempo.
- **`setLoopDuration(duration)`**: Sets loop duration for beat generation.
- **`refreshPatterns()`**: Refreshes patterns after configuration changes.
- **`randomTempoChangeFrequency()`**: Determines random tempo change frequency.
- **`downsamplePattern(pattern, factor)`**: Downsamples high-res patterns.
- **`getSamplesByType(category, type)`**: Retrieves samples by category/type.
- **`playRandomSampleAtTime(sampleList, time)`**: Plays a random sample at a specific time.

**Framework/Import Details:**
- **`audioContext` and `getGlobalStartTime`** from `audioLoader.js`: Manage playback and global sync.
- **`samples` from `samples.js`**: Provides available audio samples for beat generation.
- **`playSampleAtTime` from `player.js`**: Plays samples at the scheduled time.
- **`patterns` from `patterns.js`**: Provides beat patterns for sequences.

**Developer Notes:**
- **Customization**: Users can configure BPM, swing, and instrument settings.
- **Dependencies**: Relies on `audioLoader.js`, `samples.js`, `player.js`.
- **Randomization**: Includes features for dynamic beats with random selection and variation.
- **Instruments**: Supports multiple instruments with tempo variants and hit probability.
- **Fill Patterns**: Includes fill trigger functionality based on a configurable probability.

This module is crucial for generating dynamic, customizable beats with various instruments, tempo effects, and fill patterns for web-based audio applications. */