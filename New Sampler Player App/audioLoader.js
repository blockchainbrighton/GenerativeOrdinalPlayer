// audioLoader.js

export const audioContext = new (window.AudioContext || window.webkitAudioContext)();
export const masterGainNode = audioContext.createGain();
masterGainNode.gain.value = 1.0;
masterGainNode.connect(audioContext.destination);

// Global start time for synchronization
let globalStartTime = null;

// Function to initialize AudioContext and set globalStartTime
export const initializeAudioContext = () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  if (!globalStartTime) {
    globalStartTime = audioContext.currentTime;
    console.log(`Global start time set at ${globalStartTime.toFixed(3)} seconds`);
  }
};

// Function to get the global start time
export const getGlobalStartTime = () => {
  if (!globalStartTime) {
    initializeAudioContext();
  }
  return globalStartTime;
};

/**
 * Loads an audio sample.
 * @param {Object} sample - The sample object containing URL and properties.
 * @returns {Promise<AudioBuffer|null>}
 */
export async function loadSample(sample) {
  if (!sample || !sample.url) {
    console.warn(`Invalid sample or missing URL: ${sample}`);
    return null;
  }

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

/** Audio Loader Module Dev Notes:
 * ### Summary of `audioLoader.js`

The `audioLoader.js` file is responsible for managing the **AudioContext** and handling audio sample loading for use in a web-based audio environment. It sets up a global audio context, provides a master gain node to control the overall audio volume, and includes functionality to initialize the audio context, synchronize timing, and load audio samples.

### Key Features:
- **AudioContext**: Creates a global `AudioContext` used for managing and processing audio.
- **Master Gain**: Includes a master gain node (`masterGainNode`) to control overall audio volume.
- **Global Start Time**: Tracks a global start time for synchronization of audio playback.
- **Sample Loading**: Defines a function for asynchronously loading audio samples from a URL and decoding them into `AudioBuffer` objects.

### Functions and Methods:
1. **`audioContext`**:
   - A global **AudioContext** object for managing audio playback and processing in the browser. It is created as an instance of `window.AudioContext` or `window.webkitAudioContext`, depending on the browser's support.

2. **`masterGainNode`**:
   - A **GainNode** used to control the overall audio output volume. The gain is initially set to `1.0` (no change), and the node is connected to the audio context's destination (the speakers).

3. **`initializeAudioContext()`**:
   - Initializes the **AudioContext** and sets the `globalStartTime` if it is not already set.
   - If the audio context is in a suspended state (e.g., due to browser autoplay restrictions), it resumes the context.
   - Logs the global start time once it is set.

4. **`getGlobalStartTime()`**:
   - Returns the **global start time** for synchronization.
   - If the global start time has not been initialized, it calls `initializeAudioContext()` to set it up.

5. **`loadSample(sample)`**:
   - An asynchronous function that loads an audio sample from a provided URL.
   - Fetches the sample data, decodes it into an **AudioBuffer**, and returns the decoded audio data.
   - If the sample URL is invalid or there is an error loading the sample, it logs a warning or error, respectively.
   - Returns a promise that resolves to the decoded `AudioBuffer` or `null` if the sample could not be loaded.

### Important Information for Developers Importing This Module:
- **AudioContext Initialization**: The `AudioContext` is essential for creating, processing, and controlling audio playback. Developers must ensure that the `initializeAudioContext()` function is called before using any audio-related functionality to ensure proper synchronization.
- **Master Gain Control**: The `masterGainNode` provides a simple way to adjust the overall volume of all audio outputs in the application. Developers can modify the `gain.value` property if they need to adjust the master volume dynamically.
- **Global Timing**: The `globalStartTime` is used for synchronization of audio events. It ensures that audio elements can be scheduled to start at precise times relative to one another.
- **Sample Loading**: The `loadSample()` function is an asynchronous operation that requires a valid URL for the sample. Developers can use this function to load audio samples dynamically at runtime. The sample URL must be accessible and return a valid audio file.
- **Error Handling**: The module includes basic error handling for failed sample loading. Developers should be aware of potential issues such as network failures or unsupported file formats.

### Dependencies:
- **`audioContext` and `masterGainNode`**: These are created and managed within the module itself, so they are ready to be used by other modules that require audio management.
- **Asynchronous Operations**: The `loadSample()` function uses `fetch` and `decodeAudioData`, both of which are asynchronous, meaning developers will need to handle these operations with `await` or `.then()`.

This module is critical for managing the audio environment of any web-based audio application and can be easily integrated into other projects needing consistent audio handling and sample management.
 */