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
function barsBeatsToSeconds(bars, beats, bpm, beatsPerBar = 4) {
  const beatDuration = 60 / bpm;
  return (bars * beatsPerBar + beats) * beatDuration;
}

/**
 * Retrieve a sample by category and type.
 * @param {string} category - The category of the sample (e.g., 'drum', 'loop').
 * @param {string} type - The type within the category (e.g., 'kick', 'snare').
 * @returns {object|null} - The sample object or null if not found.
 */
export function getSample(category, type) {
  console.log(`Looking for sample with category: ${category}, type: ${type}`);

  return samples.find(sample => sample.category === category && sample.type === type.toLowerCase()) || null;
}

/**
 * Play a sample at a specific time.
 * @param {string} category - The category of the sample.
 * @param {string} type - The type of the sample.
 * @param {number} time - The time in audioContext time to play the sample.
 */
export async function playSampleAtTime(category, type, time) {
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

  // Set playback rate
  let playbackRate = sample.properties.playbackRate || 1.0;
  source.playbackRate.value = playbackRate;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = sample.properties.volume || 1.0;

  source.connect(gainNode).connect(masterGainNode);

  // Handle trimming
  const trimStart = sample.properties.trimStart || 0;
  const trimEnd = sample.properties.trimEnd || 0;
  const duration = audioBuffer.duration - trimStart - trimEnd;

  // Handle looping if necessary
  if (sample.properties.loop) {
    source.loop = true;
    source.loopStart = trimStart;
    source.loopEnd = audioBuffer.duration - trimEnd;
  }

  // Log the sample's scheduled start time
  console.log(`Sample '${sample.name}' scheduled to start at audio time: ${time.toFixed(3)} seconds`);

  source.start(time, trimStart, duration);
}

/**
 * Play a sample with optional processing based on its properties.
 * @param {object} sample - The sample object.
 * @param {number|null} globalBpm - Optional global BPM to override sample BPM.
 */
export async function playSample(sample, globalBpm = null) {
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

  // Adjust playback rate based on global BPM for looped samples
  if (sample.properties.loop) {
    const sampleBpm = sample.properties.bpm || sample.tempo || 120;
    if (globalBpm && sampleBpm) {
      playbackRate *= globalBpm / sampleBpm;
    }
  }

  if (playbackRate <= 0) {
    console.warn(`Invalid playback rate for sample ${sample.id}. Using default value of 1.0.`);
    playbackRate = 1.0;
  }
  source.playbackRate.value = playbackRate;

  // Handle trimming
  let startOffset = sample.properties.trimStart || 0;
  let endOffset = audioBuffer.duration - (sample.properties.trimEnd || 0);
  let duration = endOffset - startOffset;

  // Handle looping
  if (sample.properties.loop) {
    source.loop = true;

    let loopStart = startOffset;
    let loopEnd = endOffset;

    // If loopPoints are specified, calculate loopEnd accordingly
    if (sample.properties.loopPoints && sample.properties.bpm) {
      const { bars, beats } = sample.properties.loopPoints;
      const sampleBpm = sample.properties.bpm;
      const beatsPerBar = sample.properties.timeSignature ? sample.properties.timeSignature[0] : 4;

      const loopDuration = barsBeatsToSeconds(bars, beats, sampleBpm, beatsPerBar);
      loopEnd = loopStart + loopDuration;

      if (loopEnd > endOffset) {
        console.warn(`Calculated loop end (${loopEnd}s) exceeds buffer end (${endOffset}s). Adjusting loop end to buffer end.`);
        loopEnd = endOffset;
      }
    }

    if (loopEnd > audioBuffer.duration) {
      console.warn(`Loop end (${loopEnd}s) exceeds buffer duration (${audioBuffer.duration}s). Adjusting loop end to buffer end.`);
      loopEnd = audioBuffer.duration;
    }

    source.loopStart = loopStart;
    source.loopEnd = loopEnd;

    // Log loop details
    console.log(`Playing loop: ${sample.name}`);
    console.log(`Playback Rate: ${playbackRate}`);
    console.log(`Loop Start: ${source.loopStart} sec, Loop End: ${source.loopEnd} sec`);

    // Start the source immediately (or at a scheduled time if needed)
    source.start(0, startOffset);
  } else {
    // Log sample start time
    console.log(`Playing sample: ${sample.name} at current time`);
    source.start(0, startOffset, duration);
  }
}

/**
 * Play a random sample from a specified category and type.
 * @param {string} category - The category of the sample.
 * @param {string} type - The type within the category.
 * @param {number|null} globalBpm - Optional global BPM to override sample BPM.
 */
export async function playRandomSample(category, type, globalBpm = null) {
  const filteredSamples = samples.filter(sample => sample.category === category && sample.type === type.toLowerCase());

  if (filteredSamples.length === 0) {
    console.warn(`No samples found for category: ${category}, type: ${type}`);
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredSamples.length);
  const sample = filteredSamples[randomIndex];

  await playSample(sample, globalBpm);
}

/**
 * Example functions for playing specific types of samples.
 * These functions accept an optional global BPM parameter.
 */
export async function playKick(globalBpm = null) {
  await playRandomSample('drum', 'kick', globalBpm);
}

export async function playSnare(globalBpm = null) {
  await playRandomSample('drum', 'snare', globalBpm);
}

export async function playHiHat(globalBpm = null) {
  await playRandomSample('drum', 'hihat', globalBpm);
}

export async function playRimshot(globalBpm = null) {
  await playRandomSample('drum', 'rimshot', globalBpm);
}

export async function playRhythmLoop(globalBpm = null) {
  await playRandomSample('loop', 'rhythm', globalBpm);
}

export async function playMelodyLoop(globalBpm = null) {
  await playRandomSample('loop', 'melody', globalBpm);
}