#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import argparse
import demucs.separate

def separate_vocals(input_file, output_dir):
    """Separate vocals from a song using Demucs.
    
    Args:
        input_file (str): Path to the input audio file.
        output_dir (str): Directory where separated tracks will be saved.
    
    Returns:
        tuple: Paths to the vocal and instrumental tracks.
    """
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Call demucs to separate the audio
    print(f"Separating vocals from {input_file}...")
    sys.argv = ['demucs', input_file, '-o', output_dir]
    demucs.separate.main()
    
    # Get the paths to the separated tracks
    song_name = os.path.basename(input_file)
    song_name = os.path.splitext(song_name)[0]
    
    vocals_path = os.path.join(output_dir, 'htdemucs', song_name, 'vocals.wav')
    instrumental_path = os.path.join(output_dir, 'htdemucs', song_name, 'accompaniment.wav')
    
    # Verify that the files exist
    if not os.path.exists(vocals_path) or not os.path.exists(instrumental_path):
        raise FileNotFoundError(f"Separated tracks not found at expected locations: {vocals_path}, {instrumental_path}")
    
    print(f"Vocals saved to: {vocals_path}")
    print(f"Instrumental saved to: {instrumental_path}")
    
    return vocals_path, instrumental_path

def main():
    parser = argparse.ArgumentParser(description='Separate vocals from a song using Demucs')
    parser.add_argument('input_file', help='Path to the input audio file')
    parser.add_argument('-o', '--output-dir', default='separated', help='Directory where separated tracks will be saved')
    
    args = parser.parse_args()
    
    try:
        vocals_path, instrumental_path = separate_vocals(args.input_file, args.output_dir)
        # Print paths to stdout for the TypeScript code to capture
        print(f"VOCALS_PATH:{vocals_path}")
        print(f"INSTRUMENTAL_PATH:{instrumental_path}")
        return 0
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())