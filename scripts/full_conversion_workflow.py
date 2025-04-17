#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import argparse
import shutil
from pathlib import Path

# Import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.separate_vocals import separate_vocals
from scripts.convert_voice import convert_voice
from scripts.merge_audio import merge_audio

def full_conversion_workflow(input_song, voice_sample, model_path, config_path, output_dir, so_vits_svc_dir):
    """
    Run the full voice conversion workflow and save all intermediate files.
    
    Args:
        input_song (str): Path to the input song file.
        voice_sample (str): Path to the voice sample file (if None, skip conversion).
        model_path (str): Path to the trained model (if None, skip conversion).
        config_path (str): Path to the model configuration file.
        output_dir (str): Directory where all output files will be saved.
        so_vits_svc_dir (str): Path to the so-vits-svc directory.
        
    Returns:
        dict: Paths to all output files.
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Step 1: Separate vocals from the song
    print("\n===== STEP 1: SEPARATING VOCALS =====\n")
    separation_dir = os.path.join(output_dir, "separated")
    os.makedirs(separation_dir, exist_ok=True)
    
    try:
        all_tracks = separate_vocals(input_song, separation_dir)
        
        # Copy all separated tracks to the output directory with descriptive names
        track_paths = {}
        for track_name, track_path in all_tracks.items():
            # Get file extension
            ext = os.path.splitext(track_path)[1]
            # Create new path with descriptive name
            new_path = os.path.join(output_dir, f"original_{track_name}{ext}")
            # Copy the file
            shutil.copy(track_path, new_path)
            # Store the new path
            track_paths[f"original_{track_name}"] = new_path
            print(f"Saved {track_name} to {new_path}")
        
        # Get the vocals path for conversion
        vocals_path = all_tracks.get("vocals")
        if not vocals_path:
            raise ValueError("No vocals track found in separated tracks")
    except Exception as e:
        print(f"Error during vocal separation: {str(e)}")
        raise
    
    # Step 2: Convert vocals if model and voice sample are provided
    if model_path and voice_sample:
        print("\n===== STEP 2: CONVERTING VOCALS =====\n")
        try:
            # Path for converted vocals
            converted_vocals_path = os.path.join(output_dir, "converted_vocals.wav")
            
            # Convert vocals
            convert_voice(vocals_path, model_path, config_path, converted_vocals_path, so_vits_svc_dir)
            
            # Store the path
            track_paths["converted_vocals"] = converted_vocals_path
            print(f"Saved converted vocals to {converted_vocals_path}")
        except Exception as e:
            print(f"Error during vocal conversion: {str(e)}")
            print("Skipping conversion, will use original vocals for merging")
            converted_vocals_path = vocals_path
            track_paths["converted_vocals"] = vocals_path
    else:
        print("\nSkipping vocal conversion (no model or voice sample provided)")
        converted_vocals_path = vocals_path
        track_paths["converted_vocals"] = vocals_path
    
    # Step 3: Merge converted vocals with instrumental
    print("\n===== STEP 3: MERGING AUDIO =====\n")
    try:
        # Get the instrumental path
        instrumental_path = all_tracks.get("instrumental", all_tracks.get("accompaniment"))
        if not instrumental_path:
            raise ValueError("No instrumental track found in separated tracks")
        
        # Path for merged audio
        merged_audio_path = os.path.join(output_dir, "final_song.wav")
        
        # Merge audio
        merge_audio(converted_vocals_path, instrumental_path, merged_audio_path)
        
        # Store the path
        track_paths["final_song"] = merged_audio_path
        print(f"Saved final song to {merged_audio_path}")
    except Exception as e:
        print(f"Error during audio merging: {str(e)}")
        raise
    
    # Step 4: Copy the voice sample to the output directory
    if voice_sample:
        try:
            # Get file extension
            ext = os.path.splitext(voice_sample)[1]
            # Path for voice sample
            voice_sample_path = os.path.join(output_dir, f"voice_sample{ext}")
            # Copy the file
            shutil.copy(voice_sample, voice_sample_path)
            # Store the path
            track_paths["voice_sample"] = voice_sample_path
            print(f"Saved voice sample to {voice_sample_path}")
        except Exception as e:
            print(f"Error copying voice sample: {str(e)}")
    
    # Print summary of all output files
    print("\n===== WORKFLOW COMPLETE =====\n")
    print("The following files have been created:")
    for name, path in track_paths.items():
        print(f"- {name}: {path}")
    
    return track_paths

def main():
    parser = argparse.ArgumentParser(description='Run the full voice conversion workflow')
    parser.add_argument('input_song', help='Path to the input song file')
    parser.add_argument('--voice-sample', help='Path to the voice sample file')
    parser.add_argument('-m', '--model-path', help='Path to the trained model')
    parser.add_argument('-c', '--config-path', default='configs/config.json', help='Path to the model configuration file')
    parser.add_argument('-o', '--output-dir', default='output', help='Directory where all output files will be saved')
    parser.add_argument('-d', '--so-vits-svc-dir', default='so-vits-svc', help='Path to the so-vits-svc directory')
    
    args = parser.parse_args()
    
    try:
        track_paths = full_conversion_workflow(
            args.input_song,
            args.voice_sample,
            args.model_path,
            args.config_path,
            args.output_dir,
            args.so_vits_svc_dir
        )
        
        # Print the output file paths in a format that can be easily parsed
        for name, path in track_paths.items():
            print(f'{name.upper()}_PATH="{path.replace("\\", "/")}"')
        
        return 0
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())