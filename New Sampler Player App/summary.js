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