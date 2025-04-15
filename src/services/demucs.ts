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

/**
 * Asynchronously isolates the vocal track from a song using Demucs via Python script.
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
      
      try {
        await fsPromises.writeFile(inputFilePath, songBuffer);
      } catch (error: any) {
        console.error('Failed to write input file:', error);
        return reject(new Error(`Failed to write input file: ${error.message}`));
      }

      // Call the Python script to separate vocals
      const pythonScript = path.join(process.cwd(), 'scripts', 'separate_vocals.py');
      const pythonProcess = spawn('python', [pythonScript, inputFilePath, '-o', outputDir]);

      let stdoutData = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        if (code === 0) {
          // Parse the output to get the paths to the vocal and instrumental tracks
          let vocalsPath = '';
          let instrumentalPath = '';
          
          const lines = stdoutData.split('\n');
          for (const line of lines) {
            if (line.startsWith('VOCALS_PATH:')) {
              vocalsPath = line.substring('VOCALS_PATH:'.length);
            } else if (line.startsWith('INSTRUMENTAL_PATH:')) {
              instrumentalPath = line.substring('INSTRUMENTAL_PATH:'.length);
            }
          }

          if (!vocalsPath || !instrumentalPath) {
            return reject(new Error('Failed to get paths to vocal or instrumental tracks from Python script output'));
          }

          try {
            const vocalTrackBuffer = fs.readFileSync(vocalsPath);
            const instrumentalTrackBuffer = fs.readFileSync(instrumentalPath);

            // Convert buffers to base64 strings
            const vocalTrack = vocalTrackBuffer.toString('base64');
            const instrumentalTrack = instrumentalTrackBuffer.toString('base64');

            // Clean up temporary files
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
          console.error(`Python process exited with code ${code}`);
          console.error(`Python stderr output:\n${errorOutput}`);
          reject(new Error(`Vocal separation failed with code ${code}`));
        }
      });

      pythonProcess.on('error', (err: Error) => {
        console.error('Failed to start Python process.', err.message);
        reject(err);
      });
    } else {
      reject(new Error('This function should only be called on the server.'));
    }
  });
}
