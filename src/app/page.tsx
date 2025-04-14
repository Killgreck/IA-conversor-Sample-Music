'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Textarea} from '@/components/ui/textarea';
import {toast} from '@/hooks/use-toast';
import {useRouter} from 'next/navigation';
import {isolateVocals} from '@/services/demucs';
import {trainVoiceModel} from '@/ai/flows/voice-model-training';
import {voiceConversion} from '@/ai/flows/voice-conversion';
import {mergeAudio} from '@/services/audio-merger';
import {Progress} from "@/components/ui/progress";

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
      setProgress('Converting files to ArrayBuffers');
      setProgressValue(5);
      const songBuffer = await songFile.arrayBuffer();
      const voiceBuffer = await voiceFile.arrayBuffer();

      // Convert ArrayBuffers to Buffers
      setProgress('Converting ArrayBuffers to Buffers');
      setProgressValue(10);
      const song = Buffer.from(songBuffer);
      const voiceTrack = Buffer.from(voiceBuffer);

      // Isolate vocals from the song
      setProgress('Isolating vocals from the song');
      setProgressValue(20);
      const {vocalTrack, instrumentalTrack} = await isolateVocals(song);

      // Train voice model
      setProgress('Training voice model');
      setProgressValue(40);
      const voiceTrackBase64 = voiceTrack.toString('base64');
      const {modelId} = await trainVoiceModel({voiceTrack: voiceTrackBase64});

      // Perform voice conversion
      setProgress('Performing voice conversion');
      setProgressValue(60);
      const vocalTrackBase64ForConversion = vocalTrack.toString('base64');
      const {convertedVocalTrack} = await voiceConversion({
        vocalTrack: vocalTrackBase64ForConversion,
        voiceModelId: modelId,
      });

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
