'use server';

/**
 * @fileOverview Installs Demucs if it is not already installed.
 */

interface InstallDemucsOptions {
  // onProgress?: (message: string, value: number) => void; // Removed onProgress
}

export async function installDemucsAction(options: InstallDemucsOptions = {}) {
  // const {onProgress} = options; // Removed onProgress

  if (process.env.NODE_ENV === 'development') {
    if (typeof window === 'undefined') {
      try {
        // Check if demucs is already installed
        const {execSync} = require('child_process');
        execSync('demucs --version');
        console.log('Demucs is already installed.');
        // onProgress?.('Demucs is already installed.', 100); // Removed onProgress
      } catch (error: any) {
        // Install demucs if not installed
        console.log('Installing demucs...');
        // onProgress?.('Installing Demucs...', 10); // Removed onProgress
        const {spawn} = require('child_process');
        const demucsInstallProcess = spawn('pip', ['install', 'demucs']);

        demucsInstallProcess.stdout.on('data', (data: Buffer) => {
          console.log(`Demucs install stdout: ${data}`);
          // onProgress?.(`Demucs install stdout: ${data}`, 20); // Update progress Removed onProgress
        });

        demucsInstallProcess.stderr.on('data', (data: Buffer) => {
          console.error(`Demucs install stderr: ${data}`);
          // onProgress?.(`Demucs install stderr: ${data}`, 30); // Update progress Removed onProgress
        });

        demucsInstallProcess.on('close', (code) => {
          if (code === 0) {
            console.log('Demucs installed successfully.');
            // onProgress?.('Demucs installed successfully.', 100); // Removed onProgress
          } else {
            console.error(`Demucs install process exited with code ${code}`);
            // onProgress?.(`Demucs install process exited with code ${code}`, 0); // Removed onProgress
          }
        });

        demucsInstallProcess.on('error', (err: any) => {
          console.error('Failed to start Demucs install process.', err);
        });
      }
    }
  } else {
    console.log('Demucs installation skipped in production environment.');
  }
}

