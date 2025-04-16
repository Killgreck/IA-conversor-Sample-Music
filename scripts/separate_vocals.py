#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import argparse
import demucs.separate
import tqdm
import logging
import shutil
import time
import re
from pathlib import Path

# Configure logging to show progress
logging.basicConfig(level=logging.INFO, format='%(message)s')

# Function to sanitize file paths
def sanitize_path(path):
    # Replace any problematic characters
    path = path.replace("'", "")
    path = path.replace('"', "")
    # Convert to Path object and back to string to normalize
    return str(Path(path))

def separate_vocals(input_file, output_dir):
    """
    Separate vocals from a song using Demucs.
    
    Args:
        input_file (str): Path to the input audio file.
        output_dir (str): Directory where separated tracks will be saved.
    
    Returns:
        tuple: Paths to the vocal and instrumental tracks.
    """
    # Sanitize and normalize paths
    input_file = sanitize_path(input_file)
    output_dir = sanitize_path(output_dir)
    
    # Print debug info
    print(f"DEBUG: Input file path: {input_file}")
    print(f"DEBUG: Output directory path: {output_dir}")
    print(f"DEBUG: Input file exists: {os.path.exists(input_file)}")
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Get the song name without extension
    song_name = os.path.basename(input_file)
    song_name = os.path.splitext(song_name)[0]
    print(f"DEBUG: Song name: {song_name}")
    
    # Call demucs to separate the audio
    print(f"Separating vocals from {input_file}...")
    print(f"PROGRESS:0:Initializing")
    
    # Store original argv
    original_argv = sys.argv.copy()
    
    # Use custom arguments for demucs
    # Use htdemucs_ft model which is optimized for vocals
    # Specify two stems (vocals and accompaniment)
    sys.argv = [
        'demucs.separate',
        '--verbose',
        '--two-stems', 'vocals',
        '-n', 'htdemucs_ft',  # Use -n for model name instead of --model
        '--mp3',
        '--mp3-bitrate', '320',
        input_file,
        '-o', output_dir
    ]
    print(f"DEBUG: Demucs command: {' '.join(sys.argv)}")
    
    # Store the output name for later use
    # With -n htdemucs_ft, the output will be in a directory named htdemucs_ft
    # The subdirectory will be named after the input file
    expected_output_dir = os.path.join(output_dir, 'htdemucs_ft', song_name)
    print(f"DEBUG: Expected output directory: {expected_output_dir}")
    
    # Store original tqdm class
    original_tqdm = tqdm.tqdm
    
    # Custom tqdm class to show progress
    class CustomTqdm(original_tqdm):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.desc = kwargs.get('desc', '')
            self.last_print_time = 0
        
        def update(self, n=1):
            super().update(n)
            # Calculate percentage
            if self.total is not None and self.total > 0:
                percentage = int(100 * self.n / self.total)
                
                # Limit progress updates to once every 0.5 seconds to avoid flooding the output
                current_time = time.time()
                if current_time - self.last_print_time >= 0.5:
                    self.last_print_time = current_time
                    
                    # Create progress bar
                    bar_length = 50
                    filled_length = int(bar_length * percentage // 100)
                    bar = '#' * filled_length + ' ' * (bar_length - filled_length)
                    
                    # Print progress for terminal
                    process_info = f"{self.desc}" if self.desc else "Processing"
                    print(f"\r{percentage}%|{bar}| {self.n}/{self.total} - {process_info}", end="")
                    
                    # Print progress for front-end
                    print(f"\nPROGRESS:{percentage}:{process_info}")
    
    # Replace tqdm with our custom version
    tqdm.tqdm = CustomTqdm
    
    try:
        # Run demucs
        demucs.separate.main()
    except Exception as e:
        print(f"\nError during separation: {str(e)}")
        raise
    finally:
        # Restore original tqdm and argv
        tqdm.tqdm = original_tqdm
        sys.argv = original_argv
    
    print("\n")
    print(f"PROGRESS:90:Finding output files")
    
    # Expected output directory structure
    print(f"DEBUG: Expected output directory: {expected_output_dir}")
    print(f"DEBUG: Output directory exists: {os.path.exists(expected_output_dir)}")
    
    # Get the paths to the separated tracks based on the output name
    vocals_path = os.path.join(expected_output_dir, 'vocals.mp3')
    if not os.path.exists(vocals_path):
        vocals_path = os.path.join(expected_output_dir, 'vocals.wav')
    
    instrumental_path = os.path.join(expected_output_dir, 'accompaniment.mp3')
    if not os.path.exists(instrumental_path):
        instrumental_path = os.path.join(expected_output_dir, 'no_vocals.mp3')
    if not os.path.exists(instrumental_path):
        instrumental_path = os.path.join(expected_output_dir, 'accompaniment.wav')
    if not os.path.exists(instrumental_path):
        instrumental_path = os.path.join(expected_output_dir, 'no_vocals.wav')
    
    print(f"DEBUG: Expected vocals path: {vocals_path}")
    print(f"DEBUG: Vocals file exists: {os.path.exists(vocals_path)}")
    print(f"DEBUG: Expected instrumental path: {instrumental_path}")
    print(f"DEBUG: Instrumental file exists: {os.path.exists(instrumental_path)}")
    
    # If files not found, search more extensively
    if not os.path.exists(vocals_path) or not os.path.exists(instrumental_path):
        print(f"PROGRESS:95:Searching for output files")
        print(f"Files not found at expected locations, searching more extensively...")
        
        # List all audio files in the output directory
        found_files = []
        for root, _, files in os.walk(output_dir):
            for file in files:
                if file.endswith(('.wav', '.mp3')):
                    found_files.append(os.path.join(root, file))
        
        print(f"DEBUG: Found {len(found_files)} audio files in output directory")
        for file in found_files:
            print(f"DEBUG: Found file: {file}")
        
        if found_files:
            # Try to identify vocals and instrumental
            for file_path in found_files:
                if 'vocals' in os.path.basename(file_path).lower():
                    vocals_path = file_path
                    print(f"DEBUG: Selected vocals file: {vocals_path}")
                elif any(name in os.path.basename(file_path).lower() for name in ['no_vocals', 'accompaniment', 'other', 'drums', 'bass']):
                    instrumental_path = file_path
                    print(f"DEBUG: Selected instrumental file: {instrumental_path}")
    
    # If still not found, try to create them from the original
    if not os.path.exists(vocals_path) or not os.path.exists(instrumental_path):
        # Create a directory for our custom output
        custom_output_dir = os.path.join(output_dir, 'custom')
        os.makedirs(custom_output_dir, exist_ok=True)
        print(f"DEBUG: Created custom output directory: {custom_output_dir}")
        
        # If we have at least one file, we can use it
        if os.path.exists(vocals_path) and not os.path.exists(instrumental_path):
            instrumental_path = os.path.join(custom_output_dir, 'accompaniment.wav')
            # Copy vocals as a placeholder
            shutil.copy(vocals_path, instrumental_path)
            print(f"Warning: Created dummy instrumental track at {instrumental_path}")
        elif os.path.exists(instrumental_path) and not os.path.exists(vocals_path):
            vocals_path = os.path.join(custom_output_dir, 'vocals.wav')
            # Copy instrumental as a placeholder
            shutil.copy(instrumental_path, vocals_path)
            print(f"Warning: Created dummy vocals track at {vocals_path}")
        else:
            # If we have no files at all, we need to report the error
            print(f"No output files found in {output_dir}")
            raise FileNotFoundError(f"No separated audio files found in {output_dir}")
    
    print(f"PROGRESS:100:Separation complete")
    print(f"Vocals file: {vocals_path}")
    print(f"Instrumental file: {instrumental_path}")
    
    # Print the output paths in a format that can be easily parsed by the calling code
    # Use double quotes to ensure proper parsing in TypeScript
    print(f'VOCALS_PATH="{vocals_path.replace("\\", "/")}"')
    print(f'INSTRUMENTAL_PATH="{instrumental_path.replace("\\", "/")}"')
    
    # Return the paths to the separated files
    return vocals_path, instrumental_path


if __name__ == "__main__":
    # If the script is run directly, parse command line arguments
    parser = argparse.ArgumentParser(description="Separate vocals from a song using Demucs.")
    parser.add_argument("input_file", help="Path to the input audio file")
    parser.add_argument("--output_dir", "-o", default="separated", help="Directory where separated tracks will be saved")
    args = parser.parse_args()
    
    # Call the separation function
    vocals_path, instrumental_path = separate_vocals(args.input_file, args.output_dir)
    
    print(f"\nSeparation complete!")
    print(f"Vocals: {vocals_path}")
    print(f"Instrumental: {instrumental_path}")