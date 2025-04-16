#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import argparse
import shutil
import subprocess

def train_voice_model(voice_file, model_name, so_vits_svc_dir):
    """Train a voice conversion model using so-vits-svc.
    
    Args:
        voice_file (str): Path to the voice file to train on.
        model_name (str): Name for the trained model.
        so_vits_svc_dir (str): Path to the so-vits-svc directory.
    
    Returns:
        str: Path to the trained model.
    """
    # Ensure so-vits-svc directory exists
    if not os.path.exists(so_vits_svc_dir):
        print(f"ERROR: so-vits-svc directory not found at {so_vits_svc_dir}")
        print(f"Current working directory: {os.getcwd()}")
        print(f"Directory contents: {os.listdir('.')}")
        raise FileNotFoundError(f"so-vits-svc directory not found at {so_vits_svc_dir}")
    
    # Create dataset_raw directory if it doesn't exist
    dataset_raw_dir = os.path.join(so_vits_svc_dir, 'dataset_raw', model_name)
    os.makedirs(dataset_raw_dir, exist_ok=True)
    
    # Copy the voice file to the dataset_raw directory
    voice_file_name = os.path.basename(voice_file)
    voice_file_dest = os.path.join(dataset_raw_dir, voice_file_name)
    shutil.copy(voice_file, voice_file_dest)
    
    # Convert to WAV if needed
    if not voice_file_dest.lower().endswith('.wav'):
        wav_file = os.path.splitext(voice_file_dest)[0] + '.wav'
        subprocess.run(['ffmpeg', '-i', voice_file_dest, wav_file], check=True)
        os.remove(voice_file_dest)  # Remove the original file
        voice_file_dest = wav_file
    
    # Change to so-vits-svc directory
    original_dir = os.getcwd()
    os.chdir(so_vits_svc_dir)
    
    try:
        # Step 1: Resample audio to 44kHz
        print("Resampling audio...")
        subprocess.run(['python', 'resample.py'], check=True)
        
        # Step 2: Preprocess flist and config
        print("Preprocessing flist and config...")
        subprocess.run(['python', 'preprocess_flist_config.py'], check=True)
        
        # Step 3: Preprocess hubert and f0
        print("Preprocessing hubert and f0...")
        subprocess.run(['python', 'preprocess_hubert_f0.py'], check=True)
        
        # Step 4: Train the model
        print("Training the model...")
        subprocess.run(['python', 'train.py', '--config', 'configs/config.json'], check=True)
        
        # Get the path to the trained model
        model_path = os.path.join(so_vits_svc_dir, 'logs', '44k', f"{model_name}.pth")
        
        # Verify that the model file exists
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Trained model not found at expected location: {model_path}")
        
        print(f"Model trained successfully and saved to: {model_path}")
        return model_path
    
    finally:
        # Change back to the original directory
        os.chdir(original_dir)

def main():
    parser = argparse.ArgumentParser(description='Train a voice conversion model using so-vits-svc')
    parser.add_argument('voice_file', help='Path to the voice file to train on')
    parser.add_argument('-n', '--model-name', default='my_voice_model', help='Name for the trained model')
    parser.add_argument('-d', '--so-vits-svc-dir', default='/content/so-vits-svc', help='Path to the so-vits-svc directory')
    
    args = parser.parse_args()
    
    try:
        model_path = train_voice_model(args.voice_file, args.model_name, args.so_vits_svc_dir)
        # Print the model path to stdout for the TypeScript code to capture
        # Use double quotes to ensure proper parsing in TypeScript
        print(f'MODEL_PATH="{model_path.replace("\\", "/")}"')
        return 0
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())