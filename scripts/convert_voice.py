#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import argparse
import subprocess

def convert_voice(vocal_file, model_path, config_path, output_file, so_vits_svc_dir):
    """Convert vocals using a trained so-vits-svc model.
    
    Args:
        vocal_file (str): Path to the vocal file to convert.
        model_path (str): Path to the trained model.
        config_path (str): Path to the model configuration file.
        output_file (str): Path where the converted vocals will be saved.
        so_vits_svc_dir (str): Path to the so-vits-svc directory.
    
    Returns:
        str: Path to the converted vocal file.
    """
    # Ensure so-vits-svc directory exists
    if not os.path.exists(so_vits_svc_dir):
        raise FileNotFoundError(f"so-vits-svc directory not found at {so_vits_svc_dir}")
    
    # Ensure model file exists
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")
    
    # Ensure config file exists
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config file not found at {config_path}")
    
    # Change to so-vits-svc directory
    original_dir = os.getcwd()
    os.chdir(so_vits_svc_dir)
    
    try:
        # Run inference
        print(f"Converting vocals using model {model_path}...")
        subprocess.run([
            'python', 'inference_main.py',
            '-m', model_path,
            '-c', config_path,
            '-n', vocal_file,
            '-o', output_file
        ], check=True)
        
        # Verify that the output file exists
        if not os.path.exists(output_file):
            raise FileNotFoundError(f"Converted vocals not found at expected location: {output_file}")
        
        print(f"Vocals converted successfully and saved to: {output_file}")
        return output_file
    
    finally:
        # Change back to the original directory
        os.chdir(original_dir)

def main():
    parser = argparse.ArgumentParser(description='Convert vocals using a trained so-vits-svc model')
    parser.add_argument('vocal_file', help='Path to the vocal file to convert')
    parser.add_argument('-m', '--model-path', required=True, help='Path to the trained model')
    parser.add_argument('-c', '--config-path', default='/content/so-vits-svc/configs/config.json', help='Path to the model configuration file')
    parser.add_argument('-o', '--output-file', default='converted_vocals.wav', help='Path where the converted vocals will be saved')
    parser.add_argument('-d', '--so-vits-svc-dir', default='/content/so-vits-svc', help='Path to the so-vits-svc directory')
    
    args = parser.parse_args()
    
    try:
        output_file = convert_voice(args.vocal_file, args.model_path, args.config_path, args.output_file, args.so_vits_svc_dir)
        # Print the output file path to stdout for the TypeScript code to capture
        print(f"OUTPUT_FILE:{output_file}")
        return 0
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())