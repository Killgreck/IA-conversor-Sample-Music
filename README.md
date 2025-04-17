# Voice Conversion System

This system allows you to convert the vocals in a song to match your voice. It uses Demucs for vocal separation and so-vits-svc for voice conversion.

## Features

- Separates vocals from a song using Demucs with the htdemucs_ft model
- Trains a voice model based on your voice sample
- Converts the vocals to match your voice
- Merges the converted vocals with the instrumental
- Saves all intermediate files for further use

## Requirements

- Python 3.8 or higher
- FFmpeg
- Demucs
- so-vits-svc

## Installation

1. Clone this repository
2. Install the required packages:
   ```
   pip install demucs pydub
   git clone https://github.com/svc-develop-team/so-vits-svc
   cd so-vits-svc
   pip install -r requirements.txt
   cd ..
   ```

## Usage

```
python Conversor.py input_song.mp3 --voice-sample your_voice.wav
```

### Arguments

- `input_song`: Path to the input song file
- `--voice-sample`: Path to your voice sample file
- `-m, --model-path`: Path to an existing trained model (if not provided, a new model will be trained)
- `-c, --config-path`: Path to the model configuration file (default: so-vits-svc/configs/config.json)
- `-o, --output-dir`: Directory where all output files will be saved (default: output)
- `-d, --so-vits-svc-dir`: Path to the so-vits-svc directory (default: so-vits-svc)

### Output Files

The system will create the following files in the output directory:

- `original_vocals.wav`: The original vocals separated from the song
- `original_instrumental.wav`: The instrumental track separated from the song
- `original_drums.wav`: The drums track separated from the song (if available)
- `original_bass.wav`: The bass track separated from the song (if available)
- `original_other.wav`: Other instruments separated from the song (if available)
- `converted_vocals.wav`: The vocals converted to match your voice
- `final_song.wav`: The final song with your voice
- `voice_sample.wav`: A copy of your voice sample

## Troubleshooting

If you encounter any errors, check the console output for detailed error messages. The most common issues are:

- **File not found errors**: Make sure all the paths are correct
- **Model training errors**: Make sure your voice sample is clear and long enough (at least 10 seconds)
- **Separation errors**: Make sure the input song is in a supported format (WAV, MP3, etc.)

## License

This project is licensed under the MIT License - see the LICENSE file for details.