import {spawn} from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Trains a voice model using a voice track via Python script.
 * 
 * @param voiceTrack The voice track as a base64 encoded string.
 * @returns A promise that resolves to the ID of the trained model.
 */
export async function trainModel(voiceTrack: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Decode base64 voice track
    const voiceTrackBuffer = Buffer.from(voiceTrack, 'base64');

    // Create temporary file paths
    const voiceTrackPath = path.join(process.cwd(), 'voice.wav');
    const modelName = 'your_model'; // This will be the model ID
    const soVitsSvcDir = '/content/so-vits-svc';

    // Write the voice track buffer to a temporary file
    fs.writeFileSync(voiceTrackPath, voiceTrackBuffer);

    // Call the Python script to train the model
    const pythonScript = path.join(process.cwd(), 'scripts', 'train_model.py');
    const pythonProcess = spawn('python', [
      pythonScript,
      voiceTrackPath,
      '-n', modelName,
      '-d', soVitsSvcDir
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
      // Clean up temporary input file
      fs.unlinkSync(voiceTrackPath);

      if (code === 0) {
        // Parse the output to get the path to the trained model
        let modelPath = '';
        
        const lines = stdoutData.split('\n');
        for (const line of lines) {
          if (line.startsWith('MODEL_PATH:')) {
            modelPath = line.substring('MODEL_PATH:'.length);
            break;
          }
        }

        if (!modelPath) {
          // If we couldn't parse the model path, just return the model name
          resolve(modelName);
        } else {
          // Extract the model ID from the path
          const modelId = path.basename(modelPath, '.pth');
          resolve(modelId);
        }
      } else {
        console.error(`Python process exited with code ${code}`);
        console.error(`Python stderr output:\n${errorOutput}`);
        reject(new Error(`Model training failed with code ${code}`));
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process.', err);
      reject(err);
    });
  });
}
