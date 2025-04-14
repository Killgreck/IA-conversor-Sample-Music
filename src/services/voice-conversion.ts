import {spawn} from 'child_process';
import fs from 'fs';

export async function convertVoice(vocalTrack: string, modelId: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Decode base64 vocal track
    const vocalTrackBuffer = Buffer.from(vocalTrack, 'base64');

    // Create temporary file paths
    const vocalTrackPath = 'vocals.wav';
    const outputPath = 'converted_vocals.wav';

    // Write the vocal track buffer to a temporary file
    fs.writeFileSync(vocalTrackPath, vocalTrackBuffer);

    // so-vits-svc command
    const pythonCommand = 'python';
    const inferenceScriptPath = '/content/so-vits-svc/inference_main.py'; // Adjust this path
    const soVitsArgs = [
      inferenceScriptPath,
      '-m', `/content/so-vits-svc/logs/44k/${modelId}.pth`, // Adjust this path
      '-c', '/content/so-vits-svc/configs/config.json', // Adjust this path
      '-n', vocalTrackPath,
      '-o', outputPath
    ];

    const soVitsProcess = spawn(pythonCommand, soVitsArgs);

    let errorOutput = '';

    soVitsProcess.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    soVitsProcess.on('close', (code) => {
      // Clean up temporary input file
      fs.unlinkSync(vocalTrackPath);

      if (code === 0) {
        // Read the converted vocals file
        try {
          const convertedVocals = fs.readFileSync(outputPath);
          fs.unlinkSync(outputPath); // Clean up the converted vocals file
          resolve(convertedVocals);
        } catch (err: any) {
          reject(new Error(`Failed to read converted vocals: ${err.message}`));
        }
      } else {
        console.error(`so-vits-svc process exited with code ${code} and signal ${soVitsProcess.signalCode}`);
        console.error(`so-vits-svc stderr output:\n${errorOutput}`);
        reject(new Error(`so-vits-svc failed with code ${code}`));
      }
    });

    soVitsProcess.on('error', (err) => {
      console.error('Failed to start so-vits-svc process.', err);
      reject(err);
    });
  });
}
