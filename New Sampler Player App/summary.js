// summary.js
import { samples } from './samples.js';

/**
 * Generates a summary of the samples.
 * @returns {Object} Summary data including categories, types, and instruments.
 */
export function generateSummary() {
  // Total number of samples
  const totalSamples = samples.length;

  // Extract unique categories and types
  const categories = [...new Set(samples.map(sample => sample.category))];
  const types = [...new Set(samples.map(sample => sample.type))];

  // Extract instruments per category
  const instrumentsByCategory = categories.reduce((acc, category) => {
    acc[category] = samples
      .filter(sample => sample.category === category)
      .map(sample => sample.type);
    acc[category] = [...new Set(acc[category])]; // Ensure uniqueness
    return acc;
  }, {});

  // Additional summaries can be added here as needed

  return {
    totalSamples,
    categories,
    types,
    instrumentsByCategory,
  };
}

// Automatically generate the summary when this module is imported
const summaryData = generateSummary();

// Log the summary to the console
console.log('=== Samples Summary ===');
console.log(`Total Samples: ${summaryData.totalSamples}\n`);

console.log('Categories:');
summaryData.categories.forEach(category => {
  console.log(`- ${category}`);
});
console.log('');

console.log('Types:');
summaryData.types.forEach(type => {
  console.log(`- ${type}`);
});
console.log('');

console.log('Instruments by Category:');
for (const [category, instruments] of Object.entries(summaryData.instrumentsByCategory)) {
  console.log(`- ${category}: ${instruments.join(', ')}`);
}
console.log('========================\n');

// Export the summary data for use in other modules
export { summaryData };

/** Dev notes for summary.js
 * Notes for summary.js
Overview:
The summary.js module processes the list of audio samples imported from samples.js to generate a summary of the available samples. It organizes the samples by categories and types and also groups them by instrument within each category. This summary data is used to provide insights into the sample collection, which can be helpful for dynamically generating instrument settings or managing the sample library.

Key Features:

Generates Summary: The generateSummary function creates a summary object containing:

Total number of samples.
Unique categories of samples (e.g., drum, melodicLoop, sfx).
Unique types within each category (e.g., kick, snare, hihat).
Instruments grouped by category (e.g., which instruments belong to the drum category).
Automatically Generates Summary: Upon importing this module, the summary data is automatically generated and logged to the console.

Exports Summary: The generated summary data is exported as summaryData, making it available for use in other modules (e.g., uiGenerator.js).

Functionality:

generateSummary():

Purpose: Loops through the samples array, extracts unique categories and types, and organizes them into a structured object.
Returns: An object containing:
totalSamples: The total number of samples.
categories: A list of unique sample categories.
types: A list of unique sample types.
instrumentsByCategory: An object mapping each category to its respective instruments.
Logging:

The summary information is logged to the console, displaying:
The total number of samples.
A list of categories and their instruments.
A list of all types of samples.
Notes:

This module provides an easy way to analyze and visualize the structure of the sample library by extracting relevant metadata.
The summary can be used to dynamically generate UI elements or help in processing samples based on their categories and types.
Usage:

Integration: The module can be imported into other parts of the application to access the summaryData for UI generation, sample management, or statistical analysis.
Custom Extensions: Developers can extend this module to provide additional summary data or modify the structure of the summary as needed.

 */



/** ### Condensed Version for AI Assistant (summary.js)

**`summary.js` Summary:**
Processes and organizes audio samples into a structured summary, categorizing them by type and instrument. The generated summary is used for managing samples and generating UI elements.

**Key Features:**
- **Generates Summary**: Creates an object containing:
  - Total sample count.
  - Unique sample categories (e.g., drum, melodicLoop, sfx).
  - Types within each category (e.g., kick, snare, hihat).
  - Instruments grouped by category.
- **Automatic Summary Generation**: Summary is generated upon importing the module and logged to the console.
- **Exports Summary**: The `summaryData` object is exported for use in other modules.

**Core Functionality:**
- **`generateSummary()`**:
  - Loops through `samples` array, extracting categories, types, and instruments.
  - Returns an object with:
    - `totalSamples`: Total count of samples.
    - `categories`: List of unique categories.
    - `types`: List of unique types within categories.
    - `instrumentsByCategory`: Instruments grouped by category.

- **Logging**: Logs summary data, including sample count, categories, instruments, and types.

**Developer Notes:**
- **Usage**: Can be imported for generating UI elements or processing samples based on their categories.
- **Customization**: Can be extended for additional summary data or modified as needed.

This module provides an organized view of the sample library, essential for dynamically generating UI, managing samples, and performing statistical analysis. */