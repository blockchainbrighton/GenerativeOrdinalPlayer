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
      Array(32).fill(1), // Kick hits on every 32nd note

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
      // Funk Snare (Sixteenth Notes)
      [0, 0, 1, 0, 0, 1, 0, 0],
      // Additional patterns can be added here
      // High-resolution 32nd-note pattern
    Array(32).fill(1), // Snare hits on every 32nd note
    ],
    hihat: [
        // High-resolution 16th-note pattern
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        // High-resolution 32nd-note pattern
        Array(32).fill(1),
        // Triplet Feel (12 steps per bar)
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        // Additional high-resolution patterns can be added here
      [1, 1, 1, 1, 1, 1, 1, 1],
      // Sixteenth Notes
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      // Off-beat Hi-Hat
      [0, 1, 0, 1, 0, 1, 0, 1],
      // Swing Pattern (Shuffle)
      [1, 0, 1, 0, 1, 0, 1, 0],
      // Open Hi-Hat on "And" of 4
      [1, 1, 1, 1, 1, 1, 1, 0],
      // Broken Hi-Hat Pattern
      [1, 0, 1, 1, 0, 1, 0, 1],
      // Jazz Ride Pattern
      [1, 0, 0, 1, 0, 1, 0, 1],

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
      Array(32).fill(1), // Rimshot hits on every 32nd note
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
      // High-resolution 32nd-note pattern
      Array(32).fill(1),
    ],

    // Drum Fill Patterns for Each Instrument
    kick_fills: [
        [1, 1, 1, 1], // Rapid kicks
        [1, 0, 1, 0, 1, 0, 1, 0], // Double-time kicks
        // More kick fills...
    ],
    snare_fills: [
        [0, 1, 1, 1], // Snare roll
        [0, 1, 0, 1, 0, 1, 0, 1], // Rapid snare hits
        // More snare fills...
            // Rapid snare fills up to 32nd notes
        Array(16).fill(1), // 16th-note snare roll
        Array(32).fill(1), // 32nd-note snare roll
        // Complex snare fill
        [1, 1, 0, 1, 1, 0, 1, 1],
    ],
    hihat_fills: [
        [1, 1, 1, 1, 1, 1, 1, 1], // Rapid hi-hats
        [1, 0, 1, 1, 0, 1, 1, 0], // Complex hi-hat fill
        // More hi-hat fills...
         // Rapid hi-hat fills up to 32nd notes
        Array(16).fill(1), // 16th-note hi-hat fill
        Array(32).fill(1), // 32nd-note hi-hat fill
        // Complex hi-hat fill
        [1, 0, 1, 1, 0, 1, 1, 0],
    ],
    floortom_fills: [
        [1, 1, 1, 1], // Tom roll
        [1, 0, 1, 0, 1, 0, 1, 0], // Alternating tom hits
        // More floor tom fills...
         // Rapid floor tom fills up to 32nd notes
        Array(16).fill(1), // 16th-note floor tom roll
        Array(32).fill(1), // 32nd-note floor tom roll
        // Complex floor tom fill
        [1, 1, 0, 1, 0, 1, 1, 1],
    ],
    hightom_fills: [
        [1, 1, 1, 1], // Tom roll
        [1, 1, 0, 1, 1, 0, 1, 1], // Complex tom fill
        // More high tom fills...
        // Rapid high tom fills up to 32nd notes
        Array(16).fill(1), // 16th-note high tom roll
        Array(32).fill(1), // 32nd-note high tom roll
        // Complex high tom fill
        [1, 1, 1, 0, 1, 1, 1, 0],
    ],
    // Additional instruments and patterns can be added here
  };