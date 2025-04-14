'use server';
/**
 * Asynchronously merges the converted vocal track with the original song's instrumental track.
 *
 * @param vocalTrack The converted vocal track as a base64 encoded string.
 * @param instrumentalTrack The instrumental track as a Buffer.
 * @returns A promise that resolves to the merged audio as a Buffer.
 */

export async function mergeAudio(vocalTrack: string, instrumentalTrack: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      // Import 'child_process' only on the server side
      const { spawn } = require('child_process');
      const fs = require('fs');

      // Convert base64 vocal track to Buffer
      const vocalTrackBuffer = Buffer.from(vocalTrack, 'base64');

      // Temporary file paths
      const vocalTrackPath = 'vocal.wav';
      const instrumentalTrackPath = 'instrumental.wav';
      const outputPath = 'merged.wav';

      // Write buffers to temporary files
      fs.writeFileSync(vocalTrackPath, vocalTrackBuffer);
      fs.writeFileSync(instrumentalTrackPath, instrumentalTrack);

      // ffmpeg command to merge audio files
      const ffmpeg = spawn('ffmpeg', [
        '-i', vocalTrackPath,
        '-i', instrumentalTrackPath,
        '-filter_complex', 'amix=inputs=2:duration=longest',
        outputPath
      ]);

      let outputBuffer = Buffer.alloc(0);
      let errorOutput = '';

      ffmpeg.stdout.on('data', (data: Buffer) => {
        outputBuffer = Buffer.concat([outputBuffer, data]);
      });

      ffmpeg.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        // Clean up temporary files
        fs.unlinkSync(vocalTrackPath);
        fs.unlinkSync(instrumentalTrackPath);

        if (code === 0) {
          // Read the merged audio file
          const mergedAudio = fs.readFileSync(outputPath);
          fs.unlinkSync(outputPath); // Clean up the merged audio file
          resolve(mergedAudio);
        } else {
          console.error(`ffmpeg process exited with code ${code} and signal ${ffmpeg.signalCode}`);
          console.error(`ffmpeg stderr output:\n${errorOutput}`);
          reject(new Error(`Failed to merge audio. ffmpeg process exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (err) => {
        console.error('Failed to start ffmpeg process.', err);
        reject(err);
      });
    } else {
      reject(new Error('This function should only be called on the server.'));
    }
  });
}
