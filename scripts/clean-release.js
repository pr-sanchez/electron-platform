/**
 * Clean the release directory before packaging
 * Handles Windows file locking issues gracefully
 */

const fs = require('fs');
const path = require('path');

const releaseDir = path.join(__dirname, '../release');

if (fs.existsSync(releaseDir)) {
  console.log('Cleaning release directory...');
  try {
    // Try to remove with retries
    let retries = 3;
    while (retries > 0) {
      try {
        fs.rmSync(releaseDir, { recursive: true, force: true });
        console.log('Release directory cleaned successfully');
        process.exit(0);
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.warn('Could not clean release directory (files may be locked)');
          console.warn('This is usually fine - electron-builder will overwrite files.');
          console.warn('If packaging fails, close any running app instances and try again.');
          // Exit successfully - let electron-builder handle it
          process.exit(0);
        }
        console.log(`Retry cleaning... (${3 - retries}/3)`);
        // Wait a bit before retrying
        const start = Date.now();
        while (Date.now() - start < 500) {
          // Wait 500ms
        }
      }
    }
  } catch (error) {
    console.warn('Error cleaning release directory:', error.message);
    console.warn('Continuing anyway - electron-builder will handle overwriting files.');
    process.exit(0);
  }
} else {
  console.log('Release directory does not exist, skipping clean');
  process.exit(0);
}
