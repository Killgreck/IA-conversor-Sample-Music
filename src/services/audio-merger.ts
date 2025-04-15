'use server';
/**
 * Asynchronously merges the converted vocal track with the original song's instrumental track using Python script.
 *
 * @param vocalTrack The converted vocal track as a base64 encoded string.
 * @param instrumentalTrack The instrumental track as a Buffer.
 * @returns A promise that resolves to the merged audio as a Buffer.
 */

export async function mergeAudio(vocalTrack: string, instrumentalTrack: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      // Import modules only on the server side
      const { spawn } = require('child_process');
      const fs = require('fs');
      const path = require('path');

      // Convert base64 vocal track to Buffer
      const vocalTrackBuffer = Buffer.from(vocalTrack, 'base64');

      // Temporary file paths
      const vocalTrackPath = path.join(process.cwd(), 'vocal.wav');
      const instrumentalTrackPath = path.join(process.cwd(), 'instrumental.wav');
      const outputPath = path.join(process.cwd(), 'merged.wav');

      // Write buffers to temporary files
      fs.writeFileSync(vocalTrackPath, vocalTrackBuffer);
      fs.writeFileSync(instrumentalTrackPath, instrumentalTrack);

      // Call the Python script to merge the audio
      const pythonScript = path.join(process.cwd(), 'scripts', 'merge_audio.py');
      const pythonProcess = spawn('python', [
        pythonScript,
        vocalTrackPath,
        instrumentalTrackPath,
        '-o', outputPath,
        '-vv', '-2',  // Vocal volume adjustment
        '-iv', '-1'   // Instrumental volume adjustment
      ]);

      let stdoutData = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Clean up temporary files
        fs.unlinkSync(vocalTrackPath);
        fs.unlinkSync(instrumentalTrackPath);

        if (code === 0) {
          // Parse the output to get the path to the merged audio file
          let outputFilePath = '';
          
          const lines = stdoutData.split('\n');
          for (const line of lines) {
            if (line.startsWith('OUTPUT_FILE:')) {
              outputFilePath = line.substring('OUTPUT_FILE:'.length);
              break;
            }
          }

          if (!outputFilePath) {
            outputFilePath = outputPath; // Fallback to the expected path
          }

          try {
            // Read the merged audio file
            const mergedAudio = fs.readFileSync(outputFilePath);
            fs.unlinkSync(outputFilePath); // Clean up the merged audio file
            resolve(mergedAudio);
          } catch (err: any) {
            reject(new Error(`Failed to read merged audio: ${err.message}`));
          }
        } else {
          console.error(`Python process exited with code ${code}`);
          console.error(`Python stderr output:\n${errorOutput}`);
          reject(new Error(`Audio merging failed with code ${code}`));
        }
      });

      pythonProcess.on('error', (err) => {
        console.error('Failed to start Python process.', err);
        reject(err);
      });
    } else {
      reject(new Error('This function should only be called on the server.'));
    }
  });
}
