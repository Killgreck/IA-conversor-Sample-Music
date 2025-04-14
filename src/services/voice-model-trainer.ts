import {spawn} from 'child_process';
import fs from 'fs';

export async function trainModel(voiceTrack: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Decode base64 voice track
    const voiceTrackBuffer = Buffer.from(voiceTrack, 'base64');

    // Create temporary file paths
    const voiceTrackPath = 'voice.wav';

    // Write the voice track buffer to a temporary file
    fs.writeFileSync(voiceTrackPath, voiceTrackBuffer);

    // so-vits-svc data preparation and training commands
    const pythonCommand = 'python';
    const resampleScriptPath = '/content/so-vits-svc/resample.py'; // Adjust path
    const preprocessFlistConfigScriptPath = '/content/so-vits-svc/preprocess_flist_config.py'; // Adjust path
    const preprocessHubertF0ScriptPath = '/content/so-vits-svc/preprocess_hubert_f0.py'; // Adjust path
    const trainScriptPath = '/content/so-vits-svc/train.py'; // Adjust path
    const configPath = '/content/so-vits-svc/configs/config.json'; // Adjust path

    // 1. Prepare data by resampling
    const resampleProcess = spawn(pythonCommand, [resampleScriptPath]);

    resampleProcess.on('close', (resampleCode) => {
      if (resampleCode !== 0) {
        reject(new Error(`Resample failed with code ${resampleCode}`));
        return;
      }

      // 2. Preprocess flist config
      const preprocessFlistConfigProcess = spawn(pythonCommand, [preprocessFlistConfigScriptPath]);

      preprocessFlistConfigProcess.on('close', (preprocessFlistConfigCode) => {
        if (preprocessFlistConfigCode !== 0) {
          reject(new Error(`Preprocess flist config failed with code ${preprocessFlistConfigCode}`));
          return;
        }

        // 3. Preprocess hubert f0
        const preprocessHubertF0Process = spawn(pythonCommand, [preprocessHubertF0ScriptPath]);

        preprocessHubertF0Process.on('close', (preprocessHubertF0Code) => {
          if (preprocessHubertF0Code !== 0) {
            reject(new Error(`Preprocess hubert f0 failed with code ${preprocessHubertF0Code}`));
            return;
          }

          // 4. Train model
          const trainProcess = spawn(pythonCommand, [trainScriptPath, '--config', configPath]);

          trainProcess.on('close', (trainCode) => {
            // Clean up temporary input file
            fs.unlinkSync(voiceTrackPath);

            if (trainCode === 0) {
              // Model training completed successfully
              // Resolve with a dummy model ID (replace with actual logic if needed)
              const modelId = 'your_model'; // Replace with the actual model ID
              resolve(modelId);
            } else {
              reject(new Error(`Training failed with code ${trainCode}`));
            }
          });
        });
      });
    });
  });
}
