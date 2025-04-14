'use server';

/**
 * @fileOverview Installs Demucs if it is not already installed.
 */

export async function installDemucsAction() {
  if (process.env.NODE_ENV === 'development') {
    if (typeof window === 'undefined') {
      try {
        // Check if demucs is already installed
        const {execSync} = require('child_process');
        execSync('demucs --version');
        console.log('Demucs is already installed.');
      } catch (error: any) {
        // Install demucs if not installed
        console.log('Installing demucs...');
        const {spawn} = require('child_process');
        const demucsInstallProcess = spawn('pip', ['install', 'demucs']);

        demucsInstallProcess.stdout.on('data', (data: Buffer) => {
          console.log(`Demucs install stdout: ${data}`);
        });

        demucsInstallProcess.stderr.on('data', (data: Buffer) => {
          console.error(`Demucs install stderr: ${data}`);
        });

        demucsInstallProcess.on('close', (code) => {
          if (code === 0) {
            console.log('Demucs installed successfully.');
          } else {
            console.error(`Demucs install process exited with code ${code}`);
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
