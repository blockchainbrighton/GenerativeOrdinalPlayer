// beatGenerator.js
import { audioContext } from './audioLoader.js';
import { samples } from './samples.js';
import { playSampleAtTime } from './player.js';
import { patterns } from './patterns.js';

/**
 * Default configuration for the beat generator.
 */
const defaultConfig = {
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
   * Initializes tempo modifiers for instruments that have tempo variants.
   */
  initializeTempoModifiers() {
    this.tempoModifiers = {};
    for (const [instrument, settings] of Object.entries(this.config.instruments)) {
      if (settings.tempoVariants && settings.tempoVariants.length > 1) {
        this.tempoModifiers[instrument] = {
          currentVariantIndex: 0, // Start with the first variant
          stepsUntilChange: this.randomTempoChangeFrequency(),
        };
      }
    }
  }

  /**
   * Generates a random frequency for tempo changes.
   * @returns {number} - Steps until the next tempo change.
   */
  randomTempoChangeFrequency() {
    // Change tempo variant every 8 to 16 steps
    return Math.floor(Math.random() * 9) + 8;
  }

  /**
   * Generates patterns for each instrument based on the configuration.
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

  /**
   * Schedules the beat based on the generated patterns.
   * @param {number} startTime - The time to start scheduling from.
   */
  scheduleBeat(startTime = audioContext.currentTime + 0.1) {
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
    const playFill = this.cycleCount % 4 === 3; // Play a fill every 4 cycles (on the 4th)
  
    // Generate fill patterns if needed
    if (playFill) {
      this.generatePatterns(true); // Generate fill patterns
    }
  
    // Determine the maximum pattern length among all instruments
    const maxPatternLength = Math.max(...Object.values(this.generatedPatterns).map((p) => p.length));
  
    let firstBeatTimeLogged = false;
  
    for (const [instrumentName, pattern] of Object.entries(this.generatedPatterns)) {
      const stepDuration = this.instrumentStepDurations[instrumentName];
  
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
   * Returns the length of the pattern in steps.
   * @returns {number} - The maximum pattern length.
   */
  getPatternLength() {
    return Math.max(...Object.values(this.generatedPatterns).map((p) => p.length));
  }

  /**
   * Refreshes the patterns, useful when configuration changes.
   */
  refreshPatterns() {
    this.initializeTempoModifiers();
    this.generatePatterns();
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