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
        dict: Paths to all separated tracks (vocals, instrumental, drums, bass, etc.).
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
    
    # Store the model name for later use
    model_name = 'htdemucs_ft'
    print(f"DEBUG: Demucs command: {' '.join(sys.argv)}")
    
    # Store the output name for later use
    # With -n htdemucs_ft, the output will be in a directory named htdemucs_ft
    # The subdirectory will be named after the input file
    expected_output_dir = os.path.join(output_dir, model_name, song_name)
    print(f"DEBUG: Expected output directory: {expected_output_dir}")
    
    # Make sure expected_output_dir is a valid path
    if not os.path.isabs(expected_output_dir):
        expected_output_dir = os.path.abspath(expected_output_dir)
    print(f"DEBUG: Absolute expected output directory: {expected_output_dir}")
    
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
    
    # Check if the expected output directory exists, if not, try to find the actual output directory
    if not os.path.exists(expected_output_dir):
        # Try to find the actual output directory
        print(f"Expected output directory not found, searching for alternatives...")
        # Check if there's a directory named with the model name in the output directory
        model_dir = os.path.join(output_dir, model_name)
        if os.path.exists(model_dir):
            print(f"Found {model_name} directory: {model_dir}")
            # List subdirectories
            subdirs = [d for d in os.listdir(model_dir) if os.path.isdir(os.path.join(model_dir, d))]
            print(f"Subdirectories in {model_name}: {subdirs}")
            if subdirs:
                # Use the first subdirectory
                expected_output_dir = os.path.join(model_dir, subdirs[0])
                print(f"Using alternative output directory: {expected_output_dir}")
        else:
            # Check if there's a directory named 'htdemucs' in the output directory
            htdemucs_dir = os.path.join(output_dir, 'htdemucs')
            if os.path.exists(htdemucs_dir):
                print(f"Found htdemucs directory: {htdemucs_dir}")
                # List subdirectories
                subdirs = [d for d in os.listdir(htdemucs_dir) if os.path.isdir(os.path.join(htdemucs_dir, d))]
                print(f"Subdirectories in htdemucs: {subdirs}")
                if subdirs:
                    # Use the first subdirectory
                    expected_output_dir = os.path.join(htdemucs_dir, subdirs[0])
                    print(f"Using alternative output directory: {expected_output_dir}")
    
    # Initialize paths
    vocals_path = None
    instrumental_path = None
    other_tracks = {}
    
    # Get the paths to the separated tracks based on the output name
    if os.path.exists(expected_output_dir) and os.path.isdir(expected_output_dir):
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
    print(f"DEBUG: Vocals file exists: {os.path.exists(vocals_path) if vocals_path else False}")
    print(f"DEBUG: Expected instrumental path: {instrumental_path}")
    print(f"DEBUG: Instrumental file exists: {os.path.exists(instrumental_path) if instrumental_path else False}")
    
    # If files not found, search more extensively
    if not vocals_path or not instrumental_path or not os.path.exists(vocals_path) or not os.path.exists(instrumental_path):
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
                file_name = os.path.basename(file_path).lower()
                if 'vocals' in file_name:
                    vocals_path = file_path
                    print(f"DEBUG: Selected vocals file: {vocals_path}")
                elif any(name in file_name for name in ['no_vocals', 'accompaniment']):
                    instrumental_path = file_path
                    print(f"DEBUG: Selected instrumental file: {instrumental_path}")
                elif 'drums' in file_name:
                    other_tracks['drums'] = file_path
                    print(f"DEBUG: Selected drums file: {file_path}")
                elif 'bass' in file_name:
                    other_tracks['bass'] = file_path
                    print(f"DEBUG: Selected bass file: {file_path}")
                elif 'other' in file_name:
                    other_tracks['other'] = file_path
                    print(f"DEBUG: Selected other file: {file_path}")
    
    # If still not found, try to create them from the original
    if not vocals_path or not instrumental_path or not os.path.exists(vocals_path) or not os.path.exists(instrumental_path):
        # Create a directory for our custom output
        custom_output_dir = os.path.join(output_dir, 'custom')
        os.makedirs(custom_output_dir, exist_ok=True)
        print(f"DEBUG: Created custom output directory: {custom_output_dir}")
        
        # If we have at least one file, we can use it
        if vocals_path and os.path.exists(vocals_path) and (not instrumental_path or not os.path.exists(instrumental_path)):
            instrumental_path = os.path.join(custom_output_dir, 'accompaniment.wav')
            # Copy vocals as a placeholder
            shutil.copy(vocals_path, instrumental_path)
            print(f"Warning: Created dummy instrumental track at {instrumental_path}")
        elif instrumental_path and os.path.exists(instrumental_path) and (not vocals_path or not os.path.exists(vocals_path)):
            vocals_path = os.path.join(custom_output_dir, 'vocals.wav')
            # Copy instrumental as a placeholder
            shutil.copy(instrumental_path, vocals_path)
            print(f"Warning: Created dummy vocals track at {vocals_path}")
        else:
            # If we have no files at all, we need to report the error
            print(f"No output files found in {output_dir}")
            raise FileNotFoundError(f"No output files found in {output_dir}")
    
    # Look for other tracks (drums, bass, etc.) if not already found
    possible_tracks = ['drums', 'bass', 'other']
    # Only search for other tracks if expected_output_dir exists and is accessible
    if os.path.exists(expected_output_dir) and os.path.isdir(expected_output_dir):
        for track in possible_tracks:
            if track not in other_tracks:
                track_path = os.path.join(expected_output_dir, f'{track}.mp3')
                if not os.path.exists(track_path):
                    track_path = os.path.join(expected_output_dir, f'{track}.wav')
                if os.path.exists(track_path):
                    other_tracks[track] = track_path
                    print(f"Found {track} track: {track_path}")
    
    # Create a dictionary with all tracks
    all_tracks = {}
    if vocals_path and os.path.exists(vocals_path):
        all_tracks['vocals'] = vocals_path
    if instrumental_path and os.path.exists(instrumental_path):
        all_tracks['instrumental'] = instrumental_path
    # Add other tracks
    for track_name, track_path in other_tracks.items():
        if track_path and os.path.exists(track_path):
            all_tracks[track_name] = track_path
    
    # Print all found tracks
    print("\nFound the following separated tracks:")
    for track_name, track_path in all_tracks.items():
        print(f"- {track_name}: {track_path}")
    
    # Check if we have any tracks at all
    if not all_tracks:
        raise FileNotFoundError(f"No separated audio files found in {output_dir}")
    
    print(f"PROGRESS:100:Separation complete")
    print(f"Vocals file: {all_tracks.get('vocals', 'Not found')}")
    print(f"Instrumental file: {all_tracks.get('instrumental', 'Not found')}")
    
    # Print the output paths in a format that can be easily parsed by the calling code
    # Use double quotes to ensure proper parsing in TypeScript
    if 'vocals' in all_tracks:
        print(f'VOCALS_PATH="{all_tracks["vocals"].replace("\\", "/")}"')
    if 'instrumental' in all_tracks:
        print(f'INSTRUMENTAL_PATH="{all_tracks["instrumental"].replace("\\", "/")}"')
    
    # Also print paths for other tracks if available
    for track_name, track_path in other_tracks.items():
        if os.path.exists(track_path):
            print(f'{track_name.upper()}_PATH="{track_path.replace("\\", "/")}"')
    
    # Return the paths to all separated files
    return all_tracks


if __name__ == "__main__":
    # If the script is run directly, parse command line arguments
    parser = argparse.ArgumentParser(description="Separate vocals from a song using Demucs.")
    parser.add_argument("input_file", help="Path to the input audio file")
    parser.add_argument("--output_dir", "-o", default="separated", help="Directory where separated tracks will be saved")
    args = parser.parse_args()
    
    # Call the separation function
    all_tracks = separate_vocals(args.input_file, args.output_dir)
    
    print(f"\nSeparation complete!")
    for track_name, track_path in all_tracks.items():
        print(f"{track_name.capitalize()}: {track_path}")