# -*- coding: utf-8 -*-
"""Voice Conversion System

This script provides a complete workflow for voice conversion:
1. Separates vocals from a song
2. Trains a voice model or uses an existing one
3. Converts the vocals to match your voice
4. Merges the converted vocals with the instrumental
5. Saves all intermediate files for further use
"""

import os
import sys
import argparse
from scripts.full_conversion_workflow import full_conversion_workflow

def main():
    parser = argparse.ArgumentParser(description='Run the full voice conversion workflow')
    parser.add_argument('input_song', help='Path to the input song file')
    parser.add_argument('--voice-sample', required=True, help='Path to your voice sample file')
    parser.add_argument('-m', '--model-path', help='Path to an existing trained model (if not provided, a new model will be trained)')
    parser.add_argument('-c', '--config-path', default='so-vits-svc/configs/config.json', help='Path to the model configuration file')
    parser.add_argument('-o', '--output-dir', default='output', help='Directory where all output files will be saved')
    parser.add_argument('-d', '--so-vits-svc-dir', default='so-vits-svc', help='Path to the so-vits-svc directory')
    
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    # If no model path is provided, train a new model
    if not args.model_path:
        print("\n===== TRAINING NEW VOICE MODEL =====\n")
        from scripts.train_model import train_voice_model
        try:
            model_name = os.path.splitext(os.path.basename(args.voice_sample))[0]
            args.model_path = train_voice_model(args.voice_sample, model_name, args.so_vits_svc_dir)
            print(f"Trained new model: {args.model_path}")
        except Exception as e:
            print(f"Error during model training: {str(e)}")
            print("Please provide a pre-trained model using the -m option.")
            return 1
    
    try:
        # Run the full workflow
        track_paths = full_conversion_workflow(
            args.input_song,
            args.voice_sample,
            args.model_path,
            args.config_path,
            args.output_dir,
            args.so_vits_svc_dir
        )
        
        # Print summary of all output files
        print("\n===== CONVERSION COMPLETE =====\n")
        print("The following files have been created:")
        for name, path in track_paths.items():
            print(f"- {name}: {path}")
        
        print("\nYou can find all the generated audio files in the output directory:")
        print(f"  {os.path.abspath(args.output_dir)}")
        
        return 0
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())