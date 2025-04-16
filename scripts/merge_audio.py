#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import argparse
from pydub import AudioSegment

def merge_audio(vocal_file, instrumental_file, output_file, vocal_volume=-2, instrumental_volume=-1):
    """Merge vocal and instrumental tracks into a single audio file.
    
    Args:
        vocal_file (str): Path to the vocal audio file.
        instrumental_file (str): Path to the instrumental audio file.
        output_file (str): Path where the merged audio will be saved.
        vocal_volume (int): Volume adjustment for vocals in dB (negative values reduce volume).
        instrumental_volume (int): Volume adjustment for instrumental in dB (negative values reduce volume).
    
    Returns:
        str: Path to the merged audio file.
    """
    # Load the audio files
    print(f"Loading vocal track from {vocal_file}...")
    try:
        if vocal_file.lower().endswith('.mp3'):
            voz = AudioSegment.from_mp3(vocal_file)
        elif vocal_file.lower().endswith('.wav'):
            voz = AudioSegment.from_wav(vocal_file)
        else:
            voz = AudioSegment.from_file(vocal_file)
    except Exception as e:
        print(f"Error loading vocal file: {str(e)}")
        print(f"Trying alternative loading method...")
        voz = AudioSegment.from_file(vocal_file)
    
    print(f"Loading instrumental track from {instrumental_file}...")
    try:
        if instrumental_file.lower().endswith('.mp3'):
            musica = AudioSegment.from_mp3(instrumental_file)
        elif instrumental_file.lower().endswith('.wav'):
            musica = AudioSegment.from_wav(instrumental_file)
        else:
            musica = AudioSegment.from_file(instrumental_file)
    except Exception as e:
        print(f"Error loading instrumental file: {str(e)}")
        print(f"Trying alternative loading method...")
        musica = AudioSegment.from_file(instrumental_file)
    
    # Adjust volumes
    voz = voz + vocal_volume  # Reduce vocal volume by 2dB
    musica = musica + instrumental_volume  # Reduce instrumental volume by 1dB
    
    # Overlay the tracks
    print("Merging tracks...")
    final = musica.overlay(voz)
    
    # Export the merged audio
    print(f"Exporting merged audio to {output_file}...")
    final.export(output_file, format="wav")
    
    # Verify that the output file exists
    if not os.path.exists(output_file):
        raise FileNotFoundError(f"Merged audio not found at expected location: {output_file}")
    
    print(f"Audio merged successfully and saved to: {output_file}")
    return output_file

def main():
    parser = argparse.ArgumentParser(description='Merge vocal and instrumental tracks into a single audio file')
    parser.add_argument('vocal_file', help='Path to the vocal audio file')
    parser.add_argument('instrumental_file', help='Path to the instrumental audio file')
    parser.add_argument('-o', '--output-file', default='merged_audio.wav', help='Path where the merged audio will be saved')
    parser.add_argument('-vv', '--vocal-volume', type=int, default=-2, help='Volume adjustment for vocals in dB')
    parser.add_argument('-iv', '--instrumental-volume', type=int, default=-1, help='Volume adjustment for instrumental in dB')
    
    args = parser.parse_args()
    
    try:
        output_file = merge_audio(args.vocal_file, args.instrumental_file, args.output_file, args.vocal_volume, args.instrumental_volume)
        # Print the output file path to stdout for the TypeScript code to capture
        # Use double quotes to ensure proper parsing in TypeScript
        print(f'OUTPUT_FILE="{output_file.replace("\\", "/")}"')
        return 0
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())