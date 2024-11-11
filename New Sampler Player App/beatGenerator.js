// beatGenerator.js
import { audioContext } from './audioLoader.js';
import { getSample, playSampleAtTime } from './player.js';

/**
 * Schedules a simple beat using the kick, snare, and hi-hat.
 * @param {number} bpm - The tempo in beats per minute.
 * @param {number} bars - The number of bars to play.
 */
export function generateBeat(bpm, bars = 4) {
  const beatsPerBar = 4; // Assuming 4/4 time signature
  const totalBeats = beatsPerBar * bars;
  const beatDuration = 60 / bpm; // Duration of one beat in seconds

  // Start time
  let startTime = audioContext.currentTime + 0.1; // Slight delay to start

  // Schedule the beat
  for (let i = 0; i < totalBeats; i++) {
    const time = startTime + i * beatDuration;

    // Schedule kick on beats 1 and 3
    if (i % beatsPerBar === 0 || i % beatsPerBar === 2) {
      playSampleAtTime('drum', 'kick', time);
    }

    // Schedule snare on beats 2 and 4
    if (i % beatsPerBar === 1 || i % beatsPerBar === 3) {
      playSampleAtTime('drum', 'snare', time);
    }

    // Schedule hi-hat on every beat
    playSampleAtTime('drum', 'hihat', time);
  }
}