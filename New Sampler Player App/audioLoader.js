// audioLoader.js

export const audioContext = new (window.AudioContext || window.webkitAudioContext)();
export const masterGainNode = audioContext.createGain();
masterGainNode.gain.value = 1.0;
masterGainNode.connect(audioContext.destination);

/**
 * Loads an audio sample.
 * @param {Object} sample - The sample object containing URL and properties.
 * @returns {Promise<AudioBuffer|null>}
 */
export async function loadSample(sample) {
  try {
    const response = await fetch(sample.url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } catch (error) {
    console.error(`Error loading sample ${sample.name}:`, error);
    return null;
  }
}