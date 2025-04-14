'use server';
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
import {promises as fsPromises} from 'fs';

/**
 * Asynchronously isolates the vocal track from a song using Demucs.
 *
 * @param song The song (any format) as a Buffer.
 * @returns A promise that resolves to a VocalIsolationResult object containing the vocal and instrumental tracks.
 */
export async function isolateVocals(song: Buffer): Promise<VocalIsolationResult> {
  return new Promise(async (resolve, reject) => {
    if (typeof window === 'undefined') {
      // Import 'child_process' only on the server side
      const {spawn} = require('child_process');
      const fs = require('fs');

      // Create a temporary input file
      const inputFilePath = path.join(process.cwd(), 'input.wav');

      // Output directory for Demucs
      const outputDir = path.join(process.cwd(), 'separated');
      const demucsCommand = 'demucs';
      const demucsArgs = [inputFilePath, '-o', outputDir];

	  try {
        await fsPromises.writeFile(inputFilePath, song);
      } catch (error: any) {
          console.error('Failed to write input file:', error);
          return reject(new Error(`Failed to write input file: ${error.message}`));
      }

      const demucsProcess = spawn(demucsCommand, demucsArgs);

      let errorOutput = '';

      demucsProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      demucsProcess.on('close', async (code) => {
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
            await fsPromises.unlink(inputFilePath);
            // Function to delete directory recursively
            async function deleteFolderRecursive(folderPath: string) {
              if (fs.existsSync(folderPath)) {
                fs.readdirSync(folderPath).forEach(async (file) => {
                  const curPath = path.join(folderPath, file);
                  if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    await deleteFolderRecursive(curPath);
                  } else { // delete file
                    await fsPromises.unlink(curPath);
                  }
                });
                await fsPromises.rmdir(folderPath);
              }
            }
            await deleteFolderRecursive(outputDir);

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

	  demucsProcess.on('spawn', () => {
        console.log('Demucs process started.');
      });

      demucsProcess.on('error', (err:Error) => {
		console.error('Failed to start Demucs process.', err.message);
		if ((err as any).code === 'ENOENT') {
		  reject(new Error('Demucs executable not found. Please ensure Demucs is installed and available in your system PATH.'));
		} else {
		  reject(err);
		}
      });
    } else {
      reject(new Error('This function should only be called on the server.'));
    }
  });
}
