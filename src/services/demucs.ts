/**
 * Represents the result of vocal isolation, containing the vocal track and the instrumental track.
 */
export interface VocalIsolationResult {
  /**
   * The isolated vocal track as a Buffer.
   */
  vocalTrack: Buffer;
  /**
   * The instrumental track as a Buffer.
   */
  instrumentalTrack: Buffer;
}

import path from 'path';
import {VocalIsolationResult} from "@/services/audio-merger";

/**
 * Asynchronously isolates the vocal track from a song using Demucs.
 *
 * @param song The song (any format) as a Buffer.
 * @returns A promise that resolves to a VocalIsolationResult object containing the vocal and instrumental tracks.
 */
export async function isolateVocals(song: Buffer): Promise<VocalIsolationResult> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      // Import 'child_process' only on the server side
      const {spawn} = require('child_process');
      const fs = require('fs');

      // Create a temporary input file
      const inputFilePath = 'input.wav';
      fs.writeFileSync(inputFilePath, song);

      // Output directory for Demucs
      const outputDir = 'separated';
      const demucsCommand = 'demucs';
      const demucsArgs = [inputFilePath, '-o', outputDir];

      const demucsProcess = spawn(demucsCommand, demucsArgs);

      let errorOutput = '';

      demucsProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      demucsProcess.on('close', (code) => {
        if (code === 0) {
          // Construct the paths to the vocal and instrumental tracks
          const songName = path.basename(inputFilePath, path.extname(inputFilePath));
          const vocalsPath = path.join(outputDir, 'htdemucs', songName, 'vocals.wav');
          const accompanimentPath = path.join(outputDir, 'htdemucs', songName, 'accompaniment.wav');

          // Read the vocal and instrumental tracks
          try {
            const vocalTrack = fs.readFileSync(vocalsPath);
            const instrumentalTrack = fs.readFileSync(accompanimentPath);

            // Clean up temporary files and directories
            fs.unlinkSync(inputFilePath);
            // Function to delete directory recursively
            function deleteFolderRecursive(folderPath: string) {
              if (fs.existsSync(folderPath)) {
                fs.readdirSync(folderPath).forEach((file) => {
                  const curPath = path.join(folderPath, file);
                  if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                  } else { // delete file
                    fs.unlinkSync(curPath);
                  }
                });
                fs.rmdirSync(folderPath);
              }
            }
            deleteFolderRecursive(outputDir);

            resolve({vocalTrack, instrumentalTrack});
          } catch (err: any) {
            reject(new Error(`Failed to read vocal or instrumental tracks: ${err.message}`));
          }
        } else {
          console.error(`Demucs process exited with code ${code} and signal ${demucsProcess.signalCode}`);
          console.error(`Demucs stderr output:\n${errorOutput}`);
          reject(new Error(`Demucs failed with code ${code}`));
        }
      });

      demucsProcess.on('error', (err) => {
        console.error('Failed to start Demucs process.', err);
        reject(err);
      });
    } else {
      reject(new Error('This function should only be called on the server.'));
    }
  });
}
