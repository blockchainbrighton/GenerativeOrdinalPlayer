// patterns.js

export const patterns = {
    kick: [
      // Four-on-the-floor (Quarter Notes)
      [1, 1, 1, 1],
      // Rock Beat
      [1, 0, 0, 0],
      // Syncopated Kick (Eighth Notes)
      [1, 0, 0, 1, 1, 0, 1, 0],
      // Funk Groove (Sixteenth Notes)
      [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
      // Double Kick
      [1, 1, 0, 0],
      // Off-beat Kick
      [0, 0, 1, 0],
      // Jazz Swing (Triplets)
      [1, 0, 0, 1, 0, 0],
      // Latin Groove
      [1, 0, 1, 0, 0, 1, 0, 0],
      // Hip-Hop Pattern
      [1, 0, 0, 1, 0, 1, 0, 0],
      // Drum and Bass Pattern
      [1, 0, 1, 1, 0, 0, 1, 0],
      // More patterns can be added here
    ],
    snare: [
      // Standard Backbeat (On 2 and 4)
      [0, 1, 0, 1],
      // Off-beat Snare
      [0, 0, 1, 0],
      // Syncopated Snare (Eighth Notes)
      [0, 1, 0, 0, 1, 0, 0, 0],
      // Funk Snare
      [0, 0, 1, 0, 0, 1, 0, 0],
      // Jazz Snare
      [0, 0, 1, 0, 0, 1, 1, 0],
      // Drum and Bass Snare
      [0, 1, 0, 1, 0, 1, 0, 1],
      // Reggae Snare (On 3)
      [0, 0, 1, 0],
      // Latin Snare Pattern
      [0, 1, 0, 0, 1, 0, 1, 0],
      // Additional patterns can be added here
    ],
    hihat: [
        // High-resolution 16th-note pattern
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        // High-resolution 32nd-note pattern
        Array(32).fill(1),
        // Triplet Feel (12 steps per bar)
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        // Additional high-resolution patterns can be added here
    //   [1, 1, 1, 1, 1, 1, 1, 1],
    //   // Sixteenth Notes
    //   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    //   // Off-beat Hi-Hat
    //   [0, 1, 0, 1, 0, 1, 0, 1],
    //   // Swing Pattern (Shuffle)
    //   [1, 0, 1, 0, 1, 0, 1, 0],
    //   // Open Hi-Hat on "And" of 4
    //   [1, 1, 1, 1, 1, 1, 1, 0],
    //   // Broken Hi-Hat Pattern
    //   [1, 0, 1, 1, 0, 1, 0, 1],
    //   // Jazz Ride Pattern
    //   [1, 0, 0, 1, 0, 1, 0, 1],

      // More patterns can be added here
    ],
    rimshot: [
      // Simple Rimshot Patterns
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 1],
      // Syncopated Rimshot
      [0, 1, 0, 1],
      // Latin Rimshot
      [0, 1, 0, 0, 1, 0, 1, 0],
      // Additional patterns can be added here
    ],
    floortom: [
      // Tom Fill at the End of the Bar
      [0, 0, 0, 1],
      // Tom Hits on 2 and 4
      [0, 1, 0, 1],
      // Tom Groove
      [1, 0, 1, 0],
      // Tom Fill Over 8 Beats
      [0, 0, 0, 0, 0, 0, 1, 1],
      // Extended Tom Pattern
      [1, 0, 0, 1, 0, 1, 0, 0],
      // More patterns can be added here
    ],
    hightom: [
      // Tom Hits on 1 and 3
      [1, 0, 1, 0],
      // Syncopated Tom Pattern
      [0, 1, 1, 0],
      // Tom Fill
      [1, 1, 1, 1],
      // Tom Roll
      [1, 1, 1, 1, 1, 1, 1, 1],
      // Complex Tom Pattern
      [1, 0, 1, 1, 0, 1, 1, 0],
      // Additional patterns can be added here
    ],
    // Additional instruments and patterns can be added here
  };