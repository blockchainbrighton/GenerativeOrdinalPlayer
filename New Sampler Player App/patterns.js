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

  /** Dev notes for patterns.js
   * ### Summary of `patterns.js`

The `patterns.js` file defines a collection of **drum patterns** for various percussion instruments, such as kick, snare, hi-hat, and toms. These patterns are arrays representing the sequence of beats that each instrument will play over a set period, typically one bar or one cycle of music. Each instrument has a series of predefined patterns that can be used in music composition or beat generation, along with additional fill patterns for variation.

### Key Features:
- **Instrument Patterns**: Defines a set of patterns for each instrument (kick, snare, hi-hat, etc.) to be used in the beat generation.
- **Fill Patterns**: Each instrument also has a corresponding set of fill patterns that add dynamic variations to the main patterns.
- **High-Resolution and Low-Resolution Patterns**: Some patterns are high-resolution (e.g., 16th notes or 32nd notes), allowing for more intricate timing and detail in rhythm.
- **Grooves and Styles**: Various patterns represent different musical genres, such as funk, jazz, Latin, hip-hop, and drum and bass.

### Patterns for Each Instrument:
1. **Kick Patterns (`kick`)**:
   - A series of patterns for the kick drum, including common patterns like **Four-on-the-floor**, **Rock Beat**, **Funk Groove**, and **Drum and Bass Pattern**.
   - Includes both low-resolution patterns (e.g., quarter notes) and high-resolution patterns (e.g., 32nd notes).

2. **Snare Patterns (`snare`)**:
   - A variety of snare drum patterns, including the **Standard Backbeat**, **Syncopated Snare**, **Funk Snare**, and **Reggae Snare**.
   - Contains high-resolution patterns and fills for different styles.

3. **Hi-Hat Patterns (`hihat`)**:
   - Includes standard hi-hat patterns like **16th-note patterns**, **Triplet Feel**, **Swing Pattern**, and **Off-beat Hi-Hat**.
   - There are additional variations like the **Jazz Ride Pattern** and **Open Hi-Hat on "And" of 4**.

4. **Rimshot Patterns (`rimshot`)**:
   - Simple rimshot patterns like **Simple Rimshot Patterns** and **Syncopated Rimshot**.
   - Also includes high-resolution rimshot patterns for faster rhythms.

5. **Floor Tom Patterns (`floortom`)**:
   - Includes patterns like **Tom Groove**, **Tom Fill at the End of the Bar**, and **Extended Tom Pattern**.

6. **High Tom Patterns (`hightom`)**:
   - Includes patterns like **Tom Hits on 1 and 3**, **Syncopated Tom Pattern**, and **Tom Roll**.

7. **Fill Patterns**: 
   - Each instrument also has corresponding fill patterns (e.g., `kick_fills`, `snare_fills`, etc.), which can be triggered to add variation or transitions during beat generation. These fills range from simple variations to complex rolls with varying resolutions (16th or 32nd notes).

### Key Elements:
- **Resolution**: Some patterns have higher resolution (e.g., 32nd notes), which allows for more intricate rhythms. These can be used for fast or syncopated beats.
- **Grooves**: Many of the patterns represent specific musical styles, like **Funk Groove**, **Latin Groove**, **Hip-Hop Pattern**, and **Drum and Bass Pattern**, each of which offers distinct rhythmic feels.
- **Versatility**: The patterns can be used in various compositions, offering flexibility for different music genres or styles.

### Additional Features:
- **Expandable**: More patterns can be added to each instrument or as new instruments are introduced.
- **Fills**: The fill patterns provide dynamic variations, often used to transition between sections of a song or break up repetitive rhythms.
- **Syncopation**: Several patterns incorporate syncopated rhythms, which are characteristic of genres like funk, jazz, and Latin music.

### Important Information for Developers Importing This Module:
- **Instrument Patterns**: Developers can access the predefined patterns for each instrument (kick, snare, hi-hat, etc.) to be used in a **beat generator** or any other rhythmic audio application.
- **Pattern Selection**: The patterns for each instrument are stored in arrays. Developers can randomly select or iterate through these patterns to generate varied beats.
- **Fill Variations**: The fill patterns for each instrument can be used to add dynamic transitions and variations within a beat sequence.
- **Extensibility**: New patterns can be added as needed, whether for new genres, tempos, or specific musical styles.
- **Tempo Compatibility**: Patterns are designed to work within a standard 4/4 time signature but can be adapted to different time signatures or subdivided for more complex rhythms (e.g., triplets, 32nd notes).
  
This module is ideal for applications requiring randomized or pattern-based drum sequencing, such as a drum machine, beat generator, or interactive music composition tool.
   */