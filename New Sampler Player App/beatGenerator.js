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
  instruments: {
    kick: { enabled: true, probability: 0.9 },
    snare: { enabled: true, probability: 0.8 },
    hihat: { enabled: true, probability: 0.95 },
    rimshot: { enabled: false, probability: 0.5 },
    floortom: { enabled: true, probability: 0.3 },
    hightom: { enabled: true, probability: 0.3 },
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
function mergeConfigs(userConfig = {}) {
  return {
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
  };
}

/**
 * BeatGenerator class to manage beat patterns and scheduling.
 */
export class BeatGenerator {
  constructor(userConfig = {}) {
    this.config = mergeConfigs(userConfig);
    this.patterns = this.generatePatterns();
  }

  /**
   * Generates patterns for each instrument based on the configuration.
   * @returns {object} - Generated patterns for each instrument.
   */
  generatePatterns() {
    const {
      instruments,
      beatsPerBar,
      bars,
      randomness: { patternSelection, hitVariation },
      patterns: importedPatterns,
    } = this.config;
    const totalSteps = beatsPerBar * bars;

    const generatedPatterns = {};

    for (const [instrumentName, instrument] of Object.entries(instruments)) {
      if (!instrument.enabled) continue;

      const instrumentPatterns = importedPatterns[instrumentName] || [];
      let basePattern = instrumentPatterns.length
        ? patternSelection
          ? instrumentPatterns[Math.floor(Math.random() * instrumentPatterns.length)]
          : instrumentPatterns[0]
        : Array(beatsPerBar).fill(0);

      const patternLength = basePattern.length;
      const stepsPerBeat = patternLength / beatsPerBar;

      // Generate the pattern for the total number of steps
      const pattern = Array(totalSteps)
        .fill(0)
        .map((_, i) => {
          const stepInPattern = i % patternLength;
          let shouldPlay = basePattern[stepInPattern] === 1;

          // Apply probability during pattern generation
          if (shouldPlay && Math.random() > instrument.probability) {
            shouldPlay = false;
          }

          // Add random extra hits if enabled
          if (!shouldPlay && hitVariation && Math.random() < 0.1) {
            shouldPlay = true;
          }

          return shouldPlay ? 1 : 0;
        });

      generatedPatterns[instrumentName] = pattern;
    }

    return generatedPatterns;
  }

  /**
   * Schedules the beat based on the generated patterns.
   * @param {number} startTime - The time to start scheduling from.
   */
  scheduleBeat(startTime = audioContext.currentTime + 0.1) {
    const { bpm, swing, beatsPerBar, bars } = this.config;
    const beatDuration = 60 / bpm;
    const patternLength = this.getPatternLength();
    if (patternLength === 0) return;

    const stepDuration = beatDuration / (patternLength / (beatsPerBar * bars));

    const scheduledSounds = [];
    const uniqueSamples = new Set();

    for (const [instrumentName, pattern] of Object.entries(this.patterns)) {
      for (let i = 0; i < pattern.length; i++) {
        let time = startTime + i * stepDuration;

        // Apply swing to off-beats
        if (swing > 0 && (i % (2 * (patternLength / (beatsPerBar * bars)))) >= (patternLength / (beatsPerBar * bars))) {
          time += stepDuration * swing;
        }

        if (pattern[i] === 1) {
          const samplesList = getSamplesByType('drum', instrumentName);
          if (samplesList.length > 0) {
            const selectedSample = playRandomSampleAtTime(samplesList, time);
            if (selectedSample) {
              scheduledSounds.push({
                instrument: instrumentName,
                sample: selectedSample.type,
                time: time.toFixed(3), // Rounded for readability
              });
              uniqueSamples.add(selectedSample.type);
            }
          }
        }
      }
    }

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
   * @returns {number} - The length of the pattern.
   */
  getPatternLength() {
    // Assuming all patterns have the same length
    const instrumentNames = Object.keys(this.patterns);
    if (instrumentNames.length === 0) return 0;
    return this.patterns[instrumentNames[0]].length;
  }
}

/**
 * Retrieves samples by category and type.
 * @param {string} category - Sample category.
 * @param {string} type - Sample type.
 * @returns {Array} - List of matching samples.
 */
function getSamplesByType(category, type) {
  const standardizedType = type.toLowerCase();
  const tomTypes = ['floortom', 'hightom', 'tom'];

  return samples.filter(sample => {
    if (sample.category !== category) return false;
    const sampleType = sample.type.toLowerCase();

    if (tomTypes.includes(standardizedType) && tomTypes.includes(sampleType)) return true;

    if (standardizedType === 'rimshot' && sampleType === 'rimshot') return true;

    return sampleType === standardizedType;
  });
}

/**
 * Plays a random sample from a list at a specific time.
 * @param {Array} sampleList - List of samples.
 * @param {number} time - Time to play the sample.
 * @returns {object|null} - The selected sample or null if none.
 */
function playRandomSampleAtTime(sampleList, time) {
  if (!Array.isArray(sampleList) || sampleList.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * sampleList.length);
  const sample = sampleList[randomIndex];
  playSampleAtTime(sample.category, sample.type, time);
  return sample;
}
