'use client';

import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {toast} from '@/hooks/use-toast';
import {useRouter} from 'next/navigation';
import {isolateVocals} from '@/services/demucs';
import {trainVoiceModel, TrainVoiceModelInput, TrainVoiceModelOutput} from '@/ai/flows/voice-model-training';
import {voiceConversion, VoiceConversionInput, VoiceConversionOutput} from '@/ai/flows/voice-conversion';
import {mergeAudio} from '@/services/audio-merger';
import {Progress} from "@/components/ui/progress";

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove the data:audio/xxx;base64, part
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [songFile, setSongFile] = useState<File | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Define progress state
  const [progress, setProgress] = useState<string>('Idle');
  const [progressValue, setProgressValue] = useState<number>(0);

  const handleSongUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSongFile(event.target.files[0]);
    }
  };

  const handleVoiceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setVoiceFile(event.target.files[0]);
    }
  };

  const handleVoiceMorph = async () => {
    if (!songFile || !voiceFile) {
      toast({
        title: 'Error',
        description: 'Please upload both a song and a voice track.',
      });
      return;
    }

    setIsLoading(true);
    setProgress('Starting...');
    setProgressValue(0);

    try {
      // Convert files to ArrayBuffers
      setProgress('Converting files to base64');
      setProgressValue(5);
      const songBase64 = await fileToBase64(songFile);
      const voiceTrackBase64 = await fileToBase64(voiceFile);

      // Isolate vocals from the song
      setProgress('Isolating vocals from the song');
      setProgressValue(20);
      const {vocalTrack, instrumentalTrack} = await isolateVocals(songBase64);

      // Train voice model
      setProgress('Training voice model');
      setProgressValue(40);
      const trainVoiceModelInput: TrainVoiceModelInput = {voiceTrack: voiceTrackBase64};
      const trainVoiceModelResult: TrainVoiceModelOutput = await trainVoiceModel(trainVoiceModelInput);
      const {modelId} = trainVoiceModelResult;

      // Perform voice conversion
      setProgress('Performing voice conversion');
      setProgressValue(60);
      const vocalTrackBase64ForConversion = vocalTrack.toString('base64');
      const voiceConversionInput: VoiceConversionInput = {
        vocalTrack: vocalTrackBase64ForConversion,
        voiceModelId: modelId,
      };
      const voiceConversionResult: VoiceConversionOutput = await voiceConversion(voiceConversionInput);
      const {convertedVocalTrack} = voiceConversionResult;

      // Merge the converted vocal track with the instrumental track
      setProgress('Merging the converted vocal track with the instrumental track');
      setProgressValue(80);
      const mergedAudio = await mergeAudio(convertedVocalTrack, instrumentalTrack);

      // Convert the merged audio (Buffer) to a Blob
      setProgress('Converting the merged audio (Buffer) to a Blob');
      setProgressValue(90);
      const blob = new Blob([mergedAudio], {type: 'audio/mpeg'});

      // Create a URL for the Blob
      setProgress('Creating a URL for the Blob');
      setProgressValue(95);
      const newSongUrl = URL.createObjectURL(blob);

      // Log the URL to the console for debugging
      console.log('New Song URL:', newSongUrl);

      // Store the URL in local storage
      localStorage.setItem('newSongUrl', newSongUrl);

      toast({
        title: 'Success',
        description: 'Voice morphing completed!',
      });

      // Redirect to the new song.
      router.push('/new-song');
    } catch (error: any) {
      console.error('Voice morphing error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process voice morphing.',
      });
    } finally {
      setIsLoading(false);
      setProgress('Idle'); // Reset progress
      setProgressValue(0);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-light-gray">
      <Card className="w-full max-w-md bg-white rounded-lg shadow-md p-4">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-deep-purple">VoiceMorph</CardTitle>
          <CardDescription className="text-gray-500">
            Upload a song and your voice track to morph the voice in the song.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <div>
            <label htmlFor="song" className="block text-sm font-medium text-gray-700">
              Upload Song:
            </label>
            <Input
              id="song"
              type="file"
              accept="audio/*"
              onChange={handleSongUpload}
              className="mt-1 p-2 border rounded-md w-full"
            />
          </div>
          <div>
            <label htmlFor="voice" className="block text-sm font-medium text-gray-700">
              Upload Voice Track (m4a):
            </label>
            <Input
              id="voice"
              type="file"
              accept=".m4a"
              onChange={handleVoiceUpload}
              className="mt-1 p-2 border rounded-md w-full"
            />
          </div>
          <Button
            className="bg-deep-purple text-white rounded-md py-2 hover:bg-purple-700 disabled:bg-gray-400"
            onClick={handleVoiceMorph}
            disabled={isLoading}
          >
            {isLoading ? 'Processing... ' + progress : 'Morph Voice'}
          </Button>
          {progress !== 'Idle' && (
              <>
                <p>Status: {progress}</p>
                <Progress value={progressValue} />
              </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

