'use server';
/**
 * Represents the result of vocal isolation, containing the vocal track and the instrumental track.
 */
export interface VocalIsolationResult {
  /**
   * The isolated vocal track as a base64 encoded string.
   */
  vocalTrack: string;
  /**
   * The instrumental track as a base64 encoded string.
   */
  instrumentalTrack: string;
}

import path from 'path';
import {promises as fsPromises} from 'fs';
import {access} from 'fs/promises'; // Import access

/**
 * Asynchronously isolates the vocal track from a song using Demucs.
 *
 * @param song The song (any format) as a base64 encoded string.
 * @returns A promise that resolves to a VocalIsolationResult object containing the vocal and instrumental tracks.
 */
export async function isolateVocals(song: string): Promise<VocalIsolationResult> {
  return new Promise(async (resolve, reject) => {
    if (typeof window === 'undefined') {
      const {spawn} = require('child_process');
      const fs = require('fs');

      // Convert base64 song to buffer
      const songBuffer = Buffer.from(song, 'base64');

      // Create a temporary input file
      const inputFilePath = path.join(process.cwd(), 'input.wav');
	  const outputDir = path.join(process.cwd(), 'separated');
	  // Use a hardcoded path to demucs executable
      const demucsCommand = '/app/demucs';
      const demucsArgs = [inputFilePath, '-o', outputDir];

	  try {
        await fsPromises.writeFile(inputFilePath, songBuffer);
      } catch (error: any) {
          console.error('Failed to write input file:', error);
          return reject(new Error(`Failed to write input file: ${error.message}`));
      }

      // Check if Demucs executable exists
      try {
        await access(demucsCommand);
      } catch (error) {
        console.error('Demucs executable not found:', error);
        return reject(new Error('Demucs executable not found. Please ensure Demucs is installed and available at /app/demucs.'));
      }

      const demucsProcess = spawn(demucsCommand, demucsArgs);

      let errorOutput = '';

      demucsProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      demucsProcess.on('close', async (code) => {
        if (code === 0) {
          const songName = path.basename(inputFilePath, path.extname(inputFilePath));
          const vocalsPath = path.join(outputDir, 'htdemucs', songName, 'vocals.wav');
          const accompanimentPath = path.join(outputDir, 'htdemucs', songName, 'accompaniment.wav');

          try {
            const vocalTrackBuffer = fs.readFileSync(vocalsPath);
            const instrumentalTrackBuffer = fs.readFileSync(accompanimentPath);

            // Convert buffers to base64 strings
            const vocalTrack = vocalTrackBuffer.toString('base64');
            const instrumentalTrack = instrumentalTrackBuffer.toString('base64');

            await fsPromises.unlink(inputFilePath);
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
		  reject(new Error('Demucs executable not found. Please ensure Demucs is installed and available at /app/demucs.'));
		} else {
		  reject(err);
		}
      });
    } else {
      reject(new Error('This function should only be called on the server.'));
    }
  });
}
