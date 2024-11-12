// samples.js
export const samples = [
  {
      id: 'kick1',
      name: 'Kick Drum 1',
      url: 'https://ordinals.com/content/83407a1c9637e53e76e3d4de711b971f557e7876ad96b9b520a8202109521ba1i3',
      category: 'drum',
      type: 'kick',
      properties: {
          loop: false,
          trim: false,
          trimStart: 0,
          trimEnd: 0,
          volume: 1.0,
          playbackRate: 1.0,
          loopPoints: { bars: 0, beats: 0 },
      },
      note: null,
      userNotes: 'Produces a deep, resonant kick sound suitable for driving beats.',
      description: 'A deep kick drum suitable for hip-hop beats.',
  },
  {
      id: 'rimshot1',
      name: 'Rimshot',
      url: 'https://ordinals.com/content/83407a1c9637e53e76e3d4de711b971f557e7876ad96b9b520a8202109521ba1i5',
      category: 'drum',
      type: 'rimshot',
      properties: {
          loop: false,
          trim: false,
          trimStart: 0,
          trimEnd: 0,
          volume: 1.0,
          playbackRate: 1.0,
          loopPoints: { bars: 0, beats: 0 },
      },
      note: null,
      userNotes: 'Snare Rimshot.',
      description: '',
  },
  {
      id: 'floortom1',
      name: 'Floor Tom 1',
      url: 'https://ordinals.com/content/83407a1c9637e53e76e3d4de711b971f557e7876ad96b9b520a8202109521ba1i4',
      category: 'drum',
      type: 'floortom',
      properties: {
          loop: false,
          trim: false,
          trimStart: 0,
          trimEnd: 0,
          volume: 1.0,
          playbackRate: 1.0,
          loopPoints: { bars: 0, beats: 0 },
      },
      note: null,
      userNotes: 'Floor Tom.',
      description: '',
  },
  {
      id: 'floortom2',
      name: 'Floor Tom 2',
      url: 'https://ordinals.com/content/83407a1c9637e53e76e3d4de711b971f557e7876ad96b9b520a8202109521ba1i1',
      category: 'drum',
      type: 'floortom',
      properties: {
          loop: false,
          trim: false,
          trimStart: 0,
          trimEnd: 0,
          volume: 1.0,
          playbackRate: 1.0,
          loopPoints: { bars: 0, beats: 0 },
      },
      note: null,
      userNotes: 'Floor Tom.',
      description: '',
  },
  {
      id: 'hightom1',
      name: 'High Tom 1',
      url: 'https://ordinals.com/content/83407a1c9637e53e76e3d4de711b971f557e7876ad96b9b520a8202109521ba1i2',
      category: 'drum',
      type: 'hightom',
      properties: {
          loop: false,
          trim: false,
          trimStart: 0,
          trimEnd: 0,
          volume: 1.0,
          playbackRate: 1.0,
          loopPoints: { bars: 0, beats: 0 },
      },
      note: null,
      userNotes: 'High Tom.',
      description: '',
  },
  {
      id: 'snare1',
      name: 'Snare Drum 1',
      url: 'https://ordinals.com/content/83407a1c9637e53e76e3d4de711b971f557e7876ad96b9b520a8202109521ba1i6',
      category: 'drum',
      type: 'snare',
      properties: {
          loop: false,
          trim: false,
          trimStart: 0,
          trimEnd: 0,
          volume: 1.0,
          playbackRate: 1.0,
          loopPoints: { bars: 0, beats: 0 },
      },
      note: null,
      userNotes: 'Provides a sharp attack and crisp snare tone.',
      description: 'A crisp snare with a sharp attack.',
  },
  {
      id: 'hihat1',
      name: 'Hi-Hat 1',
      url: 'https://ordinals.com/content/83407a1c9637e53e76e3d4de711b971f557e7876ad96b9b520a8202109521ba1i0',
      category: 'drum',
      type: 'hihat',
      properties: {
          loop: false,
          trim: true,
          trimStart: 0.05,
          trimEnd: 0.02,
          volume: 0.8,
          playbackRate: 1.0,
          loopPoints: { bars: 0, beats: 0 },
      },
      note: 'F#5',
      userNotes: 'Has a slight delay before the hit, useful for subtle rhythm layering.',
      description: 'A closed hi-hat with a slight delay before the hit.',
  },
  {
      id: 'dogBark1',
      name: 'Dog Bark',
      url: 'https://ordinals.com/content/a48ba6b6e1d3f5a3efde56b07ffabb12ec697d907a9dfd6e8cfa9491f0587ab8i0',
      category: 'sfx',
      type: 'instrument',
      properties: {
          loop: false,
          trim: false,
          trimStart: 0,
          trimEnd: 0,
          volume: 1,
          playbackRate: 1.0,
          loopPoints: { bars: 0, beats: 0 },
      },
      note: 'F#5',
      userNotes: 'Has a slight delay before the hit, useful for subtle rhythm layering.',
      description: 'A closed hi-hat with a slight delay before the hit.',
  },
  {
      id: 'rhythmLoop1',
      name: 'Amen Break',
      url: 'https://ordinals.com/content/d52fe368443e3103bfad0f44968e1d9d893c07ca15f608e8e44804afe1484f88i0',
      category: 'percussionLoop',
      type: 'rhythm',
      properties: {
          loop: true,
          trim: false,
          trimStart: 0,
          trimEnd: 0.02,
          volume: 1.0,
          playbackRate: 0.33,
          loopBars: 4, // This loop is 4 bars long

      },
      note: null,
      key: 'D Minor',
      tempo: 138,
      userNotes: 'Works well with steady basslines and melodic layers.',
      description: 'A 4-second rhythm loop with seamless looping points.',
  },
  {
      id: 'melodyLoop1',
      name: 'Melody Loop 1',
      url: 'https://ordinals.com/content/5da3c0aab997e63adbbdb4243d215cec6450b5f1e2cc9b918772ea4e35baffefi0',
      category: 'melodicLoop',
      type: 'melody',
      properties: {
          loop: true,
          trim: false,
          trimStart: 0,
          trimEnd: 0.035,
          volume: 1.0,
          playbackRate: 1.0,
          loopPoints: { bars: 2, beats: 0 },
          bpm: 80,
      },
      note: null,
      key: 'G Major',
      tempo: 80,
      userNotes: 'Ideal for harmonic progression and background textures.',
      description: 'An 8-second melody loop for harmonic progression.',
  },
  {
      id: 'loop1',
      name: 'Fast Melody Loop',
      url: 'https://example.com/fast_melody_loop.wav',
      category: 'melodicLoop',
      type: 'melody',
      properties: {
          loop: true,
          trim: false,
          trimStart: 0,
          trimEnd: 0,
          volume: 1.0,
          playbackRate: 0.33,
          loopPoints: { bars: 1, beats: 0 },
          bpm: 120,
      },
      note: null,
      key: 'C Major',
      tempo: 120,
      userNotes: 'Best for building ambient or melodic textures.',
      description: 'A melody loop uploaded at 300% speed, needs to be slowed down.',
  },
  // Additional samples can follow the same structure
];

/** Dev notes for samples.js
 * ### Summary of `samples.js`

The `samples.js` file defines an array of **sample objects** used for audio playback in a music application. These samples cover a range of categories, including drums, loops, and sound effects, and each sample has properties that control its playback, such as volume, playback rate, looping, and trimming. This module provides a central place to manage and retrieve audio samples used throughout the application.

### Key Features:
- **Sample Definitions**: Each sample is an object containing metadata like `id`, `name`, `category`, `type`, and audio-specific properties like `volume`, `playbackRate`, and `loopPoints`.
- **Categories and Types**: The samples are categorized (e.g., `drum`, `percussionLoop`, `melodicLoop`, `sfx`), and each category can contain multiple types (e.g., `kick`, `snare`, `hihat`).
- **Looping and Trim Settings**: Some samples are defined as loops (`loop: true`), with properties to control the trimming of the sample (e.g., `trimStart`, `trimEnd`).
- **Tempo and Key Information**: Some loop samples include tempo (`bpm`) and key (`key`), which help synchronize the samples with the global tempo and key of the composition.
- **User Notes and Descriptions**: Each sample can include user notes and a description, providing additional context for its use or characteristics.

### Sample Objects:
Each sample object has the following structure:
- **`id`**: A unique identifier for the sample.
- **`name`**: The name of the sample.
- **`url`**: The URL where the audio file is located.
- **`category`**: The category of the sample (e.g., `drum`, `melodicLoop`, `percussionLoop`, `sfx`).
- **`type`**: The specific type of the sample within the category (e.g., `kick`, `snare`, `hihat`, `rhythm`, `melody`).
- **`properties`**: An object that defines playback properties like:
  - **`loop`**: Whether the sample should loop (true or false).
  - **`trim`**: Whether the sample should be trimmed (true or false).
  - **`trimStart`**: The start point for trimming the sample (in seconds).
  - **`trimEnd`**: The end point for trimming the sample (in seconds).
  - **`volume`**: The volume of the sample (default is 1.0).
  - **`playbackRate`**: The speed of playback (default is 1.0).
  - **`loopPoints`**: Defines where the loop starts and ends (in bars and beats).
  - **`bpm`**: The tempo of the sample (in beats per minute), typically used for loops.
  - **`key`**: The musical key of the sample (e.g., `D Minor`, `G Major`).

### Sample Examples:
1. **Kick Drum** (`kick1`):
   - **Category**: `drum`
   - **Type**: `kick`
   - **Description**: A deep kick drum suitable for hip-hop beats.
   - **Properties**: Non-looping, no trimming, volume at 1.0, playback rate at 1.0.

2. **Rimshot** (`rimshot1`):
   - **Category**: `drum`
   - **Type**: `rimshot`
   - **Properties**: Non-looping, no trimming, volume at 1.0, playback rate at 1.0.

3. **Floor Tom** (`floortom1` and `floortom2`):
   - **Category**: `drum`
   - **Type**: `floortom`
   - **Properties**: Non-looping, no trimming, volume at 1.0, playback rate at 1.0.

4. **Hi-Hat** (`hihat1`):
   - **Category**: `drum`
   - **Type**: `hihat`
   - **Properties**: Non-looping, trimming applied (`trimStart: 0.05`, `trimEnd: 0.02`), volume at 0.8, playback rate at 1.0.

5. **Amen Break Rhythm Loop** (`rhythmLoop1`):
   - **Category**: `percussionLoop`
   - **Type**: `rhythm`
   - **Properties**: Looping, 4 bars long, tempo at 138 BPM, volume at 1.0, playback rate at 0.33.

6. **Melody Loop** (`melodyLoop1`):
   - **Category**: `melodicLoop`
   - **Type**: `melody`
   - **Properties**: Looping, 2 bars long, tempo at 80 BPM, volume at 1.0, playback rate at 1.0.

7. **Dog Bark** (`dogBark1`):
   - **Category**: `sfx`
   - **Type**: `instrument`
   - **Properties**: Non-looping, no trimming, volume at 1.0, playback rate at 1.0.

8. **Fast Melody Loop** (`loop1`):
   - **Category**: `melodicLoop`
   - **Type**: `melody`
   - **Properties**: Looping, trim settings not applied, playback rate at 0.33 (slowed down), BPM set to 120.

### Key Features:
- **Sample Metadata**: Each sample includes metadata like `description`, `note`, and `userNotes`, which provide additional context on how to use the sample.
- **Flexible Playback**: Each sample has properties that allow it to be played with specific settings like trimming, volume, playback rate, and looping.
- **Diverse Categories**: The samples are organized into categories such as `drum`, `percussionLoop`, `melodicLoop`, and `sfx`, making it easy to manage and retrieve different types of sounds.
- **Tempo and Key**: Loops include information about the tempo (BPM) and key, ensuring they can be synchronized with other elements in the composition.

### Important Information for Developers Importing This Module:
- **Sample Access**: Samples are accessed via their `id`, and developers can filter by `category` and `type` to find the sample they need.
- **Playback Customization**: Each sample includes customizable properties such as `loop`, `trimStart`, `trimEnd`, `volume`, and `playbackRate`, allowing developers to fine-tune the playback behavior.
- **Looping and Timing**: Loops have specific properties like `loopPoints` and `bpm` that can be used for accurate timing and seamless looping.
- **Extensibility**: More samples can be added to the array following the same structure, allowing easy expansion of the sample library.

This module is ideal for music or sound-related applications where users need to access and play a variety of pre-defined audio samples, such as drum hits, loops, and sound effects. It provides all the necessary properties to manage audio samples and customize their playback.
 */