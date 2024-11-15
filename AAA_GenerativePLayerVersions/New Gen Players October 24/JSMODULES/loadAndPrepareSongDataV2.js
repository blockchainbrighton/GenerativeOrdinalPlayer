// loadAndPrepareSongDataV2.js
(async () => {
    console.log("[Initialization] Script started.");

    // Define the list of loop sample IDs
    const loopSampleIds = new Set([
        "7c42769c1763cc8f045aada7914e8158223e45e7a4f197b49f918b1c005d36fci0", // Minty Fresh - Channel F
        "3364803cb3032ce95f4138a214c15a9b36dcb70f574a477f27615d448e1cdeb8i0", // I love cheese - Channel 4/E
    ]);

    const keyNames = [
        "projectName",
        "artistName",
        "projectBPM",
        "currentSequence",
        "channelURLs",
        "channelVolume",
        "channelPlaybackSpeed",
        "trimSettings",
        "projectChannelNames",
        "startSliderValue",
        "endSliderValue",
        "totalSampleDuration",
        "start",
        "end",
        "projectSequences",
        "steps"
    ];

    const keyMap = keyNames.reduce((map, key, index) => {
        map[key] = index;
        return map;
    }, {});

    const channelIds = Array.from({ length: 16 }, (_, index) => String.fromCharCode(65 + index));
    const channelIdMap = channelIds.reduce((map, id, index) => {
        map[id] = index;
        return map;
    }, {});

    /**
     * Fetches, decompresses, and processes song data from a given URL.
     * @param {string} url - The URL to fetch the song data from.
     * @returns {object} - The processed song data.
     */
    const fetchAndProcessSongData = async (url) => {
        console.log(`[Initialization] Fetching and processing data from URL: ${url}`);

        try {
            const response = await fetch(url);

            if (!response.ok) throw new Error(`Network error for ${url}`);

            const compressedData = new Uint8Array(await response.arrayBuffer());
            const inflatedData = window.pako.inflate(compressedData);

            const jsonString = new TextDecoder("utf-8").decode(inflatedData);
            const parsedData = JSON.parse(jsonString);

            const processParsedData = (data) => {
                const recurse = (obj) => {
                    if (Array.isArray(obj)) {
                        return obj.map(recurse);
                    } else if (obj && typeof obj === "object") {
                        return Object.entries(obj).reduce((accumulator, [key, value]) => {
                            const mappedKey = keyNames[key] || key;
                            accumulator[mappedKey] = mappedKey === "projectSequences"
                                ? Object.fromEntries(
                                    Object.entries(value).map(([seqKey, seqValue]) => {
                                        const sequenceName = `Sequence${seqKey.replace(/^s/, "")}`;
                                        const channels = Object.fromEntries(
                                            Object.entries(seqValue).map(([channelKey, channelValue]) => {
                                                const steps = channelValue[keyMap.steps] || [];
                                                const processedSteps = steps.flatMap((step) => {
                                                    if (typeof step === "number") {
                                                        return step;
                                                    } else if (step?.r) {
                                                        const [start, end] = step.r;
                                                        return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
                                                    } else if (typeof step === "string" && step.endsWith("r")) {
                                                        return { index: parseInt(step.slice(0, -1), 10), reverse: true };
                                                    } else {
                                                        return [];
                                                    }
                                                });
                                                return [`ch${channelIdMap[channelKey]}`, { steps: processedSteps }];
                                            })
                                        );
                                        return [sequenceName, channels];
                                    })
                                )
                                : recurse(value);
                            return accumulator;
                        }, {});
                    } else {
                        return obj;
                    }
                };
                return recurse(data);
            };

            const processedData = processParsedData(parsedData);

            return processedData;

        } catch (error) {
            console.error(`[Initialization] Error fetching/deserializing ${url}:`, error);
            throw error;
        }
    };

    /**
     * Prepares the initial sample order for the song.
     * @param {object} songData - The song data object.
     * @returns {Array} - The initial sample order array.
     */
    const prepareInitialSampleOrder = (songData) => {
        const { projectSequences } = songData;
        const sampleOrder = [];

        Object.keys(projectSequences)
            .sort((a, b) => {
                const numA = parseInt(a.replace('Sequence', ''), 10);
                const numB = parseInt(b.replace('Sequence', ''), 10);
                return numA - numB;
            })
            .forEach((sequenceKey) => {
                const sequence = projectSequences[sequenceKey];

                Object.entries(sequence)
                    .forEach(([channelId, channelData]) => {
                        const { steps } = channelData;

                        steps.forEach((step) => {
                            if (typeof step === "number" || (typeof step === "object" && step.index !== undefined)) {
                                const identifier = `${channelId}_${step.reverse ? "r" : "f"}`;
                                if (!sampleOrder.some((item) => `${item.channelId}_${item.reverse ? "r" : "f"}` === identifier)) {
                                    sampleOrder.push({
                                        channelId: channelId,
                                        reverse: step.reverse || false
                                    });
                                }
                            }
                        });
                    });
            });

        return sampleOrder;
    };

    /**
     * Sets the artwork image on the page.
     * @param {string} url - The URL of the artwork image.
     */
    const setArtworkImage = (url) => {
        const artworkElement = document.getElementById("artworkImage");
        if (artworkElement) {
            artworkElement.src = url;
            artworkElement.parentElement.style.display = "flex";
            console.log("[Initialization] Artwork image set and displayed.");
        } else {
            console.warn("[Initialization] Artwork cover elements not found.");
        }
    };


    // --- Effects Configuration ---
    const effectsConfig = { 
        pitchShift: { // pitchShift sounds great set to 1 on its own.
            enabled: true, // Enabled for testing
            defaultProbability: 1, // Always apply for testing
            shifts: [0.25, 0.5, 1, 2, 4],
            sequenceConfig: {}
        },
        harmonize: { // Harmonize seems more like a delay. needs to be low probability 0.01 - 0.02 seems good on its own.
            enabled: true, // Enabled for testing
            defaultProbability: 0.02, // Set to 0.02 as per comment
            intervals: [1.2599, 1.4983],
            maxHarmonyChannels: 2,
            sequenceConfig: {}
        },
        delay: {
            enabled: true, // Keeping disabled as per original configuration
            defaultProbability: 1, // set to 1 - not very audible tbh
            noteValue: 'sixteenth',
            maxDelayRepeats: 3,
            sequenceConfig: {}
        },
        delay: {
            enabled: true, // Keeping disabled as per original configuration
            defaultProbability: 1, // set to 1 - not very audible tbh
            noteValue: 'eighth',
            maxDelayRepeats: 8,
            sequenceConfig: {}
        },
        delay: {
            enabled: true, // Keeping disabled as per original configuration
            defaultProbability: 1, // set to 1 - not very audible tbh
            noteValue: 'quarter',
            maxDelayRepeats: 16,
            sequenceConfig: {}
        },
        reverse: {
            enabled: true, // Can't hear this effect at all
            defaultProbability: 1,
            sequenceConfig: {}
        },
        volumeChange: {
            enabled: false,
            defaultProbability: 0.0,
            range: [0.5, 1.5],
            sequenceConfig: {}
        },
        pan: {
            enabled: true,
            defaultProbability: 1,
            positions: [-1, 1],
            sequenceConfig: {}
        },
        reverb: {
            enabled: true, // Can't hear this effect either!
            defaultProbability: 1, // Increased probability for testing
            decayTimeRange: [2, 7], // Increased decay time for more noticeable reverb
            mixRange: [0.3, 0.9],   // Increased mix range for more prominent wet signal
            sequenceConfig: {}
        },
        filter: {
            enabled: true, // Can't hear this either
            defaultProbability: 0.7, // Adjusted probability
            types: ['lowpass', 'highpass', 'bandpass'], // Added 'bandpass' for more variety
            frequencyRange: [300, 8000], // Expanded frequency range for more noticeable filtering
            QRange: [1, 10], // Added Q factor for resonance
            sequenceConfig: {}
        },
        tremolo: {
            enabled: true, // Can't hear this
            defaultProbability: 0.6, // Adjusted probability
            rateRange: [4, 12],   // Increased rate range for more noticeable modulation
            depthRange: [0.6, 1], // Increased depth range
            sequenceConfig: {}
        },
        distortion: {
            enabled: true, // I don't think I can hear this either
            defaultProbability: 0.5, // Adjusted probability
            amountRange: [1, 15], // Increased amount range for more noticeable distortion
            sequenceConfig: {}
        },
        bitcrusher: {
            enabled: true, // Can't hear this effect either
            defaultProbability: 0.3, // Reduced probability to prevent excessive artifacts
            bitDepthRange: [2, 6],    // Reduced bit depth range for more noticeable effect
            sampleRateRange: [8000, 22050], // Lowered sample rate range for clearer bitcrushing
            sequenceConfig: {}
        },
        // Add more effects as needed
    };

    /**
     * Helper function to get effect parameters based on current sequence.
     * @param {string} effectName - Name of the effect.
     * @param {number} currentSequence - The current sequence number.
     * @returns {object|null} - Effect parameters or null if not applied.
     */
    function getEffectParams(effectName, currentSequence) {
        const effect = effectsConfig[effectName];
        if (!effect.enabled) return null;

        let seqConfig = effect.sequenceConfig && effect.sequenceConfig[currentSequence];
        let probability = seqConfig ? seqConfig.probability : effect.defaultProbability;

        if (Math.random() < probability) {
            return { ...effect, ...seqConfig };
        }
        return null;
    }

/**
* Applies a random pitch shift to the channel based on the effect parameters.
*/
function applyRandomPitchShift(channel, effectParams) {
const shifts = effectParams.shifts;
const shift = shifts[Math.floor(Math.random() * shifts.length)];
const originalSpeed = channel.metadata.playbackSpeed;
channel.metadata.playbackSpeed *= shift;
console.log(`[effectsDebug] Pitch shifted channel ${channel.id} from ${originalSpeed.toFixed(2)}x to ${channel.metadata.playbackSpeed.toFixed(2)}x`);
}


/* Adds harmony channels by duplicating the original channel and applying pitch shifts.
*/
function addHarmony(originalChannel, index, newSong, effectParams, effectsContext) {
if (effectsContext.harmonyChannelsAdded >= effectParams.maxHarmonyChannels) {
    console.log(`[effectsDebug] Maximum harmony channels reached for song ${newSong.id}`);
    return;
}

effectParams.intervals.forEach(interval => {
    if (effectsContext.harmonyChannelsAdded >= effectParams.maxHarmonyChannels) return;

    const harmonyChannel = JSON.parse(JSON.stringify(originalChannel)); // Deep clone
    harmonyChannel.id = `${originalChannel.id}_harmony_${index}_${interval}`; // Unique ID
    const originalSpeed = harmonyChannel.metadata.playbackSpeed;
    harmonyChannel.metadata.playbackSpeed *= interval;
    harmonyChannel.metadata.volume = (harmonyChannel.metadata.volume || 1) * 0.8; // Reduce volume to prevent overdrive
    newSong.channels.push(harmonyChannel);
    effectsContext.harmonyChannelsAdded++;

    console.log(`[effectsDebug] Added harmony channel ${harmonyChannel.id} with playback speed changed from ${originalSpeed.toFixed(2)}x to ${harmonyChannel.metadata.playbackSpeed.toFixed(2)}x (Interval factor: ${interval})`);
});
}

/**
* Applies delay to the channel based on the effect parameters.
*/
function applyIntermittentDelay(channel, effectParams, bpm) {
const delayTime = calculateDelayTime(bpm, effectParams.noteValue);
channel.metadata.delay = {
    time: delayTime,
    repeats: effectParams.maxDelayRepeats
};
console.log(`[effectsDebug] Applied delay to channel ${channel.id} with time ${delayTime}ms and repeats ${effectParams.maxDelayRepeats}`);
}

/**
* Calculates delay time based on BPM and note value.
*/
function calculateDelayTime(bpm, noteValue = 'quarter') {
const beatDuration = 60000 / bpm; // Duration of one beat in ms
const delayMap = {
    'quarter': beatDuration,
    'eighth': beatDuration / 2,
    'sixteenth': beatDuration / 4
};
return delayMap[noteValue] || beatDuration;
}

/**
* Applies reverse effect to the channel.
*/
function applyReverseEffect(channel, effectParams) {
channel.metadata.requiresReversal = true;
console.log(`[effectsDebug] Reversed channel ${channel.id}`);
}

/**
* Applies volume change to the channel.
*/
function applyVolumeChange(channel, effectParams) {
const [minVolume, maxVolume] = effectParams.range;
const volumeMultiplier = Math.random() * (maxVolume - minVolume) + minVolume;
const originalVolume = channel.metadata.volume || 1;
channel.metadata.volume = originalVolume * volumeMultiplier;
console.log(`[effectsDebug] Changed volume of channel ${channel.id} from ${originalVolume.toFixed(2)} to ${channel.metadata.volume.toFixed(2)}`);
}

/**
* Applies panning to the channel.
*/
function applyPanEffect(channel, effectParams) {
const positions = effectParams.positions;
const panPosition = positions[Math.floor(Math.random() * positions.length)];
channel.metadata.pan = panPosition;
console.log(`[effectsDebug] Applied pan of ${panPosition} to channel ${channel.id}`);
}

/**
* Applies reverb effect to the channel.
*/
function applyReverbEffect(channel, effectParams) {
const [minDecay, maxDecay] = effectParams.decayTimeRange;
const decayTime = Math.random() * (maxDecay - minDecay) + minDecay;
const [minMix, maxMix] = effectParams.mixRange;
const mix = Math.random() * (maxMix - minMix) + minMix;
channel.metadata.reverb = {
    decayTime: decayTime,
    mix: mix
};
console.log(`[effectsDebug] Applied reverb to channel ${channel.id} with decay time ${decayTime.toFixed(2)}s and mix ${mix.toFixed(2)}`);
}

/**
* Applies filter effect to the channel.
*/
function applyFilterEffect(channel, effectParams) {
const filterType = effectParams.types[Math.floor(Math.random() * effectParams.types.length)];
const [minFreq, maxFreq] = effectParams.frequencyRange;
const cutoffFrequency = Math.random() * (maxFreq - minFreq) + minFreq;
const [minQ, maxQ] = effectParams.QRange;
const Q = Math.random() * (maxQ - minQ) + minQ;
channel.metadata.filter = {
    type: filterType,
    frequency: cutoffFrequency,
    Q: Q
};
console.log(`[effectsDebug] Applied ${filterType} filter to channel ${channel.id} with cutoff frequency ${cutoffFrequency.toFixed(2)}Hz and Q factor ${Q.toFixed(2)}`);
}

/**
* Applies tremolo effect to the channel.
*/
function applyTremoloEffect(channel, effectParams) {
const [minRate, maxRate] = effectParams.rateRange;
const rate = Math.random() * (maxRate - minRate) + minRate;
const [minDepth, maxDepth] = effectParams.depthRange;
const depth = Math.random() * (maxDepth - minDepth) + minDepth;
channel.metadata.tremolo = {
    rate: rate,
    depth: depth
};
console.log(`[effectsDebug] Applied tremolo to channel ${channel.id} with rate ${rate.toFixed(2)}Hz and depth ${depth.toFixed(2)}`);
}

/**
* Applies distortion effect to the channel.
*/
function applyDistortionEffect(channel, effectParams) {
const [minAmount, maxAmount] = effectParams.amountRange;
const amount = Math.random() * (maxAmount - minAmount) + minAmount;
channel.metadata.distortion = {
    amount: amount
};
console.log(`[effectsDebug] Applied distortion to channel ${channel.id} with amount ${amount.toFixed(2)}`);
}

/**
* Applies bitcrusher effect to the channel.
*/
function applyBitcrusherEffect(channel, effectParams) {
const [minBitDepth, maxBitDepth] = effectParams.bitDepthRange;
const bitDepth = Math.floor(Math.random() * (maxBitDepth - minBitDepth + 1)) + minBitDepth;
const [minSampleRate, maxSampleRate] = effectParams.sampleRateRange;
const sampleRate = Math.random() * (maxSampleRate - minSampleRate) + minSampleRate;
channel.metadata.bitcrusher = {
    bitDepth: bitDepth,
    sampleRate: sampleRate
};
console.log(`[effectsDebug] Applied bitcrusher to channel ${channel.id} with bit depth ${bitDepth} and sample rate ${sampleRate.toFixed(0)}Hz`);
}

/**
* Applies enabled effects to the channel based on current sequence and BPM.
* Includes checks to prevent overdriving and infinite loops.
*/
function applyEffects(channel, index, newSong, currentSequence, bpm, effectsContext) {
let effectParams;

// Apply Pitch Shift
effectParams = getEffectParams('pitchShift', currentSequence);
if (effectParams) {
    applyRandomPitchShift(channel, effectParams);
}

// Apply Harmonization
effectParams = getEffectParams('harmonize', currentSequence);
if (effectParams) {
    addHarmony(channel, index, newSong, effectParams, effectsContext);
}

// Apply Delay
effectParams = getEffectParams('delay', currentSequence);
if (effectParams) {
    applyIntermittentDelay(channel, effectParams, bpm);
}

// Apply Reverse
effectParams = getEffectParams('reverse', currentSequence);
if (effectParams) {
    applyReverseEffect(channel, effectParams);
}

// Apply Volume Change
effectParams = getEffectParams('volumeChange', currentSequence);
if (effectParams) {
    applyVolumeChange(channel, effectParams);
}

// Apply Pan
effectParams = getEffectParams('pan', currentSequence);
if (effectParams) {
    applyPanEffect(channel, effectParams);
}

// Apply Reverb
effectParams = getEffectParams('reverb', currentSequence);
if (effectParams) {
    applyReverbEffect(channel, effectParams);
}

// Apply Filter
effectParams = getEffectParams('filter', currentSequence);
if (effectParams) {
    applyFilterEffect(channel, effectParams);
}

// Apply Tremolo
effectParams = getEffectParams('tremolo', currentSequence);
if (effectParams) {
    applyTremoloEffect(channel, effectParams);
}

// Apply Distortion
effectParams = getEffectParams('distortion', currentSequence);
if (effectParams) {
    applyDistortionEffect(channel, effectParams);
}

// Apply Bitcrusher
effectParams = getEffectParams('bitcrusher', currentSequence);
if (effectParams) {
    applyBitcrusherEffect(channel, effectParams);
}

// Adjust overall volume if cumulative gain exceeds threshold
if (effectsContext.totalGain > effectsContext.maxTotalGain) {
    const reductionFactor = effectsContext.maxTotalGain / effectsContext.totalGain;
    channel.metadata.volume = (channel.metadata.volume || 1) * reductionFactor;
    console.log(`[effectsDebug] Adjusted volume of channel ${channel.id} to prevent overdrive.`);
}

// Update total gain
effectsContext.totalGain += channel.metadata.volume || 1;
}


    // [applyEffects function remains unchanged]

    try {
        const validSongDataUrls = songDataUrls.filter((url) => url.trim() && !url.trim().startsWith("//"));
        console.log(`[Initialization] Valid song data URLs count: ${validSongDataUrls.length}`);

        if (validSongDataUrls.length) {
            // Load Pako library
            await (async function loadPako() {
                try {
                    const response = await fetch("/content/2109694f44c973892fb8152cf5c68607fb19288c045af1abc1716c1c3b4d69e6i0");
                    const textContent = await response.text();
                    const scriptElement = new DOMParser().parseFromString(textContent, "text/html").querySelector("script");

                    if (!scriptElement || !scriptElement.textContent.includes("pako")) {
                        throw new Error("Pako library not found.");
                    }

                    document.head.append(
                        Object.assign(document.createElement("script"), { textContent: scriptElement.textContent })
                    );
                    console.log("[Initialization] Pako library loaded successfully.");
                } catch (error) {
                    console.error("[Initialization] Error loading Pako:", error);
                }
            })();

            // Fetch and process song data from all URLs
            const songDataArray = await (async (urls) => {
                const dataArray = await Promise.all(
                    urls.map((url, index) =>
                        fetchAndProcessSongData(url)
                            .then((data) => ({ data, index }))
                            .catch((error) => {
                                console.error(`[Initialization] Failed ${url}:`, error);
                                return null;
                            })
                    )
                );
                const validDataArray = dataArray.filter(Boolean);
                if (!validDataArray.length) throw new Error("[Initialization] No valid data.");
                return validDataArray;
            })(validSongDataUrls);

            // Process the song data into 'originalSongs'
            const originalSongs = songDataArray
                .sort((a, b) => a.index - b.index)
                .map(({ data, index }) => {
                    const {
                        projectName = `Song_${index + 1}`, // Ensuring original song name
                        artistName = "Unknown Artist",
                        projectBPM = 120, // Ensuring original BPM
                        projectSequences = {},
                        channelURLs = [],
                        channelVolume = [],
                        channelPlaybackSpeed = [],
                        trimSettings = {}
                    } = data;

                    const channels = channelIds.map((id, idx) => {
                        const channelSequence = Object.entries(projectSequences).reduce((acc, [sequenceName, sequenceData]) => {
                            const channelData = sequenceData[`ch${idx}`];
                            if (channelData) {
                                acc.push({
                                    sequenceName,
                                    steps: channelData.steps
                                });
                            }
                            return acc;
                        }, []);

                        const metadata = {
                            volume: channelVolume[idx] ?? 1,
                            playbackSpeed: channelPlaybackSpeed[idx] ?? 1,
                            trimStartTime_Percentage: trimSettings[idx]?.start || 0,
                            trimEndTime_Percentage: trimSettings[idx]?.end || 100,
                            requiresReversal: channelSequence.some((seq) =>
                                seq.steps.some((step) => typeof step === "object" && step.reverse)
                            ),
                            channelSequence,
                            originalBPM: projectBPM
                        };

                        const sampleId = channelURLs[idx];
                        if (loopSampleIds.has(sampleId)) {
                            metadata.isLoop = true;
                            // **Enhanced Logging: Loop Sample Included in Original Song**
                            const songId = `Song ${index + 1}: ${projectName}`;
                            console.log(`[effectsDebug] ID ${sampleId} is identified as a loop and has been included in song ${songId}`);
                        }

                        return {
                            id: id, // Channel ID (A-P)
                            url: sampleId || "URL_not_found",
                            metadata
                        };
                    });

                    const songId = `Song ${index + 1}: ${projectName}`;
                    const song = {
                        id: songId, // Including original song name in ID
                        artist: artistName,
                        bpm: projectBPM, // Including original BPM
                        totalSequences: Object.keys(projectSequences).length,
                        totalChannels: channels.length,
                        channels,
                        projectSequences
                    };

                    // **Log Each Original Song's Details Immediately After Processing**
                    console.log(`[Original Song Processed] ${song.id}`);
                    console.log(`Artist: ${song.artist}`);
                    console.log(`BPM: ${song.bpm}`);
                    console.log(`Total Sequences: ${song.totalSequences}`);
                    console.log(`Total Channels: ${song.totalChannels}`);
                    console.log("Channels and Metadata:");
                    song.channels.forEach(channel => {
                        console.log(`  Channel ID: ${channel.id}`);
                        console.log(`    URL: ${channel.url}`);
                        console.log(`    Metadata:`, channel.metadata);
                    });
                    console.log("---------------------------------------------------");

                    return song;
                });

            // Collect all channels from original songs
            const allChannels = [];
            originalSongs.forEach(song => {
                song.channels.forEach(channel => {
                    allChannels.push(channel);
                });
            });

            // Function to get random channels
            function getRandomChannels(channelsArray, num) {
                const shuffled = channelsArray.slice().sort(() => 0.5 - Math.random());
                return shuffled.slice(0, num);
            }

            /**
             * Generates random mixes with dynamic BPM selection and custom rules for specific songs.
             * Includes checks to prevent overdriving and infinite loops.
             * @param {number} numMixes - The number of mixes to generate.
             * @returns {Array} - The array of generated song objects.
             */
            function generateRandomMixes(numMixes) {
                const newSongs = [];
                const bpmOptions = [60, 120, 140, 160, 180, 240];

                for (let songIndex = 0; songIndex < numMixes; songIndex++) {
                    // Randomly select a BPM for this song
                    const selectedBPM = bpmOptions[Math.floor(Math.random() * bpmOptions.length)];

                    // Select 28 random channels
                    const randomChannels = getRandomChannels(allChannels, 28);

                    // Define activation points for general channels
                    const activationPoints = [
                        { startSeq: 1, count: 16 },   // Channels 1-16 active from sequence 1
                        { startSeq: 5, count: 4 },   // Channels 17-20 activate at sequence 5
                        { startSeq: 17, count: 4 },  // Channels 21-24 activate at sequence 17
                        { startSeq: 25, count: 4 }   // Channels 25-28 activate at sequence 25
                    ];

                    // Assign activation sequences to channels
                    const channelsWithActivation = [];
                    let channelOffset = 0;
                    activationPoints.forEach(point => {
                        for (let i = 0; i < point.count; i++) {
                            if (channelOffset < randomChannels.length) {
                                channelsWithActivation.push({
                                    channel: JSON.parse(JSON.stringify(randomChannels[channelOffset])), // Deep clone to prevent mutation
                                    activationSeq: point.startSeq
                                });
                                channelOffset++;
                            }
                        }
                    });

                    // Collect all sequences from the selected channels
                    const sequenceSet = new Set();
                    channelsWithActivation.forEach(({ channel }) => {
                        if (channel.metadata.channelSequence) {
                            channel.metadata.channelSequence.forEach(sequenceData => {
                                sequenceSet.add(sequenceData.sequenceName);
                            });
                        }
                    });

                    // Convert sequenceSet to an array and sort numerically
                    const sequences = Array.from(sequenceSet).sort((a, b) => {
                        const numA = parseInt(a.replace('Sequence', ''), 10);
                        const numB = parseInt(b.replace('Sequence', ''), 10);
                        return numA - numB;
                    });

                    // Create new song with sequences
                    const newSong = {
                        id: `Generated Song ${songIndex + 1}`, // Unique ID for the remix
                        artist: `Generated Artist ${songIndex + 1}`,
                        bpm: selectedBPM, // Dynamically assign BPM
                        totalSequences: sequences.length,
                        totalChannels: channelsWithActivation.length,
                        channels: [],
                        projectSequences: {}
                    };

                    // Initialize projectSequences with the sequences
                    sequences.forEach(sequenceName => {
                        newSong.projectSequences[sequenceName] = {};
                    });

                    // Create an effects context to keep track of effects applied per song
                    const effectsContext = {
                        harmonyChannelsAdded: 0,
                        maxHarmonyChannels: effectsConfig.harmonize.maxHarmonyChannels || 2,
                        totalGain: 0,
                        maxTotalGain: 10 // Arbitrary threshold for total gain
                    };

                    // Assign new channel IDs and replicate steps with activation logic
                    channelsWithActivation.forEach(({ channel, activationSeq }, index) => {
                        const chId = `ch${index}`;
                        const newChannel = {
                            id: chId,
                            url: channel.url,
                            metadata: {
                                ...channel.metadata,
                                originalBPM: newSong.bpm, // Update BPM in metadata
                                activationSeq: activationSeq // Embed activation sequence
                            }
                        };

                        // Apply Effects
                        applyEffects(newChannel, index, newSong, activationSeq, newSong.bpm, effectsContext);

                        // Log if the channel is a loop sample
                        if (newChannel.metadata.isLoop) {
                            // **Enhanced Logging: Loop Sample Included in Remix**
                            console.log(`[effectsDebug] ID ${newChannel.url} is identified as a loop and has been included in remix ${newSong.id}`);
                        }

                        newSong.channels.push(newChannel);

                        // Check if the channel belongs to a special song
                        const isSpecialChannel = isChannelFromSpecialSong(channel);

                        if (channel.metadata.channelSequence) {
                            channel.metadata.channelSequence.forEach(sequenceData => {
                                const sequenceName = sequenceData.sequenceName;
                                const steps = sequenceData.steps;

                                if (!newSong.projectSequences[sequenceName]) {
                                    newSong.projectSequences[sequenceName] = {};
                                }

                                newSong.projectSequences[sequenceName][chId] = { steps: steps };
                            });
                        }

                        // If it's a special channel, assign a custom activation rule
                        if (isSpecialChannel) {
                            const activationRule = getRandomActivationRule();
                            newChannel.metadata.activationRule = activationRule;
                            newChannel.metadata.customActivationEvents = generateActivationEvents(activationRule, newSong.totalSequences);
                        }
                    });

                    newSongs.push(newSong);

                    // **Logging the Remix Data**
                    console.log(`[Remix Generated] ${newSong.id}`);
                    console.log(`Artist: ${newSong.artist}`);
                    console.log(`BPM: ${newSong.bpm}`);
                    console.log(`Total Sequences: ${newSong.totalSequences}`);
                    console.log(`Total Channels: ${newSong.totalChannels}`);
                    console.log("Channels and Metadata:");
                    newSong.channels.forEach(channel => {
                        console.log(`  Channel ID: ${channel.id}`);
                        console.log(`    URL: ${channel.url}`);
                        console.log(`    Metadata:`, channel.metadata);
                    });
                    console.log("---------------------------------------------------");
                }

                return newSongs;
            }

            // Helper function to determine if a channel is from "Fiat Money" or "Did You Know"
            function isChannelFromSpecialSong(channel) {
                const specialSongIds = [
                    "/content/5ee46b8f645a65b0ec8ae749a28f88e364347f89137bb79986355bf5fb94cbebi0", // Fiat Money
                    "/content/c41de57f1e062a440a9fc96d54baaccd7ec40049f48e9f3880559afc60b1b09ai0"  // Did You Know
                ];
                return specialSongIds.includes(channel.url);
            }

            // Helper function to randomly select one of the four activation rules
            function getRandomActivationRule() {
                const rules = [1, 2, 3, 4];
                return rules[Math.floor(Math.random() * rules.length)];
            }

            // Helper function to generate activation events based on the selected rule
            function generateActivationEvents(rule, totalSequences) {
                const events = [];
                switch (rule) {
                    case 1:
                        // Rule 1: Active in the first 2 sequences
                        events.push({ type: 'activate', seq: 1 });
                        events.push({ type: 'deactivate', seq: 3 });
                        break;
                    case 2:
                        // Rule 2: In for 2 sequences, out for 2 sequences throughout
                        for (let seq = 1; seq <= totalSequences; seq += 4) {
                            events.push({ type: 'activate', seq: seq });
                            if (seq + 2 <= totalSequences) {
                                events.push({ type: 'deactivate', seq: seq + 2 });
                            }
                        }
                        break;
                    case 3:
                        // Rule 3: In at sequence 9, in for 2, out for 2 until 20, then back in at 41
                        // Activate at 9
                        events.push({ type: 'activate', seq: 9 });
                        // From 9 to 20: In for 2, out for 2
                        for (let seq = 9; seq <= 20; seq += 4) {
                            events.push({ type: 'activate', seq: seq });
                            if (seq + 2 <= 20) {
                                events.push({ type: 'deactivate', seq: seq + 2 });
                            }
                        }
                        // Activate again at 41
                        events.push({ type: 'activate', seq: 41 });
                        break;
                    case 4:
                        // Rule 4: Randomly play for 2 sequences at sequence 1 or 5, 9, 16 etc.
                        const possibleStarts = [1, 5, 9, 16, 21, 25, 29, 33, 37, 41, 45];
                        const selectedStarts = getRandomSubset(possibleStarts, Math.floor(Math.random() * 3) + 1); // Select 1 to 3 starts

                        selectedStarts.forEach(startSeq => {
                            if (startSeq <= totalSequences) {
                                events.push({ type: 'activate', seq: startSeq });
                                if (startSeq + 2 <= totalSequences) {
                                    events.push({ type: 'deactivate', seq: startSeq + 2 });
                                }
                            }
                        });
                        break;
                    default:
                        // Default to Rule 1 if an unknown rule is encountered
                        events.push({ type: 'activate', seq: 1 });
                        events.push({ type: 'deactivate', seq: 3 });
                        break;
                }
                return events;
            }

            // Helper function to get a random subset from an array
            function getRandomSubset(array, size) {
                const shuffled = array.slice().sort(() => 0.5 - Math.random());
                return shuffled.slice(0, size);
            }

            // **Generate initial 100 mixes**
            const generatedSongs = generateRandomMixes(100);

            // **Set globalData.songsArray to generated songs only**
            globalData.songsArray = generatedSongs;

            // Initialize current song and sequence indices
            globalData.currentSongIndex = 0;
            globalData.currentSequenceIndex = 0;

     
            // Prepare initial sample order for the first generated song
            if (globalData.songsArray.length > 0) {
                globalData.initialSampleOrder = prepareInitialSampleOrder(globalData.songsArray[0]);
            }

            // Set artwork image if applicable
            if (globalData.isArtworkCover && artworkUrl.length) {
                setArtworkImage(artworkUrl[0]);
            }

            // Update flags
            globalData.isSingleSong = globalData.songsArray.length === 1;
            globalData.isMultipleSongs = globalData.songsArray.length > 1;

            // Dispatch event indicating data loading is complete
            document.dispatchEvent(
                new CustomEvent("dataLoadingComplete", {
                    detail: {
                        success: true,
                        totalSongs: globalData.songsArray.length,
                        songs: globalData.songsArray.map(({ id, totalSequences }) => ({ id, totalSequences }))
                    }
                })
            );
            console.log("[Initialization] Data loading complete event dispatched.");

            // **Log the Original Songs Array with Names and BPMs**
            console.log("Original Songs Data:");
            originalSongs.forEach(song => {
                console.log(`ID: ${song.id}`);
                console.log(`Artist: ${song.artist}`);
                console.log(`BPM: ${song.bpm}`);
                console.log(`Total Sequences: ${song.totalSequences}`);
                console.log(`Total Channels: ${song.totalChannels}`);
                console.log("Channels and Metadata:");
                song.channels.forEach(channel => {
                    console.log(`  Channel ID: ${channel.id}`);
                    console.log(`    URL: ${channel.url}`);
                    console.log(`    Metadata:`, channel.metadata);
                });
                console.log("---------------------------------------------------");
            });

        } else {
            console.log("[Initialization] No valid song data URLs to process.");
        }
    } catch (error) {
        console.error("[Initialization] Initialization error:", error);
    }
})();