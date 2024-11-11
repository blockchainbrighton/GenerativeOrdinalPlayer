// summary.js
import { samples } from './samples.js';

/**
 * Generates and logs a summary of the samples.
 */
export function generateSummary() {
  // Total number of samples
  const totalSamples = samples.length;

  // Extract unique categories
  const categories = [...new Set(samples.map(sample => sample.category))];

  // Extract unique types
  const types = [...new Set(samples.map(sample => sample.type))];

  // List of all sample names
  const names = samples.map(sample => sample.name);

  // Additional summaries can be added here as needed

  // Log the summary to the console
  console.log('=== Samples Summary ===');
  console.log(`Total Samples: ${totalSamples}\n`);

  console.log('Categories:');
  categories.forEach(category => {
    console.log(`- ${category}`);
  });
  console.log('');

  console.log('Types:');
  types.forEach(type => {
    console.log(`- ${type}`);
  });
  console.log('');

  console.log('Sample Names:');
  names.forEach(name => {
    console.log(`- ${name}`);
  });
  console.log('========================\n');
}

// Count per category
const categoryCounts = samples.reduce((acc, sample) => {
    acc[sample.category] = (acc[sample.category] || 0) + 1;
    return acc;
  }, {});
  
  // Count per type
  const typeCounts = samples.reduce((acc, sample) => {
    acc[sample.type] = (acc[sample.type] || 0) + 1;
    return acc;
  }, {});
  
  // Log counts
  console.log('Category Counts:');
  for (const [category, count] of Object.entries(categoryCounts)) {
    console.log(`- ${category}: ${count}`);
  }
  console.log('');
  
  console.log('Type Counts:');
  for (const [type, count] of Object.entries(typeCounts)) {
    console.log(`- ${type}: ${count}`);
  }
  console.log('');

// Automatically generate the summary when this module is imported
generateSummary();