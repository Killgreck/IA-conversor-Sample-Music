import {spawn} from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Converts a vocal track using a trained voice model via Python script.
 * 
 * @param vocalTrack The vocal track as a base64 encoded string.
 * @param modelId The ID of the voice model to use for conversion.
 * @returns A promise that resolves to a Buffer containing the converted vocal track.
 */
export async function convertVoice(vocalTrack: string, modelId: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Decode base64 vocal track
    const vocalTrackBuffer = Buffer.from(vocalTrack, 'base64');

    // Create temporary file paths
    const vocalTrackPath = path.join(process.cwd(), 'vocals.wav');
    const outputPath = path.join(process.cwd(), 'converted_vocals.wav');
    const modelPath = path.join('/content/so-vits-svc/logs/44k', `${modelId}.pth`);
    const configPath = path.join('/content/so-vits-svc/configs/config.json');
    const soVitsSvcDir = '/content/so-vits-svc';

    // Write the vocal track buffer to a temporary file
    fs.writeFileSync(vocalTrackPath, vocalTrackBuffer);

    // Call the Python script to convert the voice
    const pythonScript = path.join(process.cwd(), 'scripts', 'convert_voice.py');
    const pythonProcess = spawn('python', [
      pythonScript,
      vocalTrackPath,
      '-m', modelPath,
      '-c', configPath,
      '-o', outputPath,
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
      fs.unlinkSync(vocalTrackPath);

      if (code === 0) {
        // Parse the output to get the path to the converted vocal track
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
          // Read the converted vocals file
          const convertedVocals = fs.readFileSync(outputFilePath);
          fs.unlinkSync(outputFilePath); // Clean up the converted vocals file
          resolve(convertedVocals);
        } catch (err: any) {
          reject(new Error(`Failed to read converted vocals: ${err.message}`));
        }
      } else {
        console.error(`Python process exited with code ${code}`);
        console.error(`Python stderr output:\n${errorOutput}`);
        reject(new Error(`Voice conversion failed with code ${code}`));
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process.', err);
      reject(err);
    });
  });
}
