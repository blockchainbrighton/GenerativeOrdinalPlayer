// uiGenerator.js
import { summaryData } from './summary.js';

/**
 * Capitalizes the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Dynamically generates instrument settings based on summary data.
 */
export function generateInstrumentSettings() {
  const instrumentSettingsDiv = document.getElementById('instrumentSettings');
  if (!instrumentSettingsDiv) return;

  // Get all instruments from summary data
  const allInstruments = Object.values(summaryData.instrumentsByCategory).flat();

  // Remove duplicates, if any
  const uniqueInstruments = [...new Set(allInstruments)];

  uniqueInstruments.forEach(instrument => {
    const capitalized = capitalize(instrument);

    // Create enable checkbox
    const enableLabel = document.createElement('label');
    const enableCheckbox = document.createElement('input');
    enableCheckbox.type = 'checkbox';
    enableCheckbox.id = `enable${capitalized}`;
    enableCheckbox.checked = true;
    enableLabel.appendChild(enableCheckbox);
    enableLabel.appendChild(document.createTextNode(` Enable ${capitalized}`));
    instrumentSettingsDiv.appendChild(enableLabel);

    // Create probability input
    const probabilityLabel = document.createElement('label');
    probabilityLabel.textContent = `${capitalized} Probability: `;
    const probabilityInput = document.createElement('input');
    probabilityInput.type = 'number';
    probabilityInput.id = `${instrument.toLowerCase()}Probability`;
    probabilityInput.value = '0.5'; // Default value, can be adjusted
    probabilityInput.min = '0';
    probabilityInput.max = '1';
    probabilityInput.step = '0.1';
    probabilityLabel.appendChild(probabilityInput);
    instrumentSettingsDiv.appendChild(probabilityLabel);
  });
}

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  generateInstrumentSettings();
});