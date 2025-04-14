'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Textarea} from '@/components/ui/textarea';
import {toast} from '@/hooks/use-toast';
import {useRouter} from 'next/navigation';

export default function Home() {
  const [songFile, setSongFile] = useState<File | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
    try {
      // Implement the logic to send the files to the server
      // and process the voice morphing.
      // This is a placeholder for the actual implementation.
      console.log('Song file:', songFile);
      console.log('Voice file:', voiceFile);

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));

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
            {isLoading ? 'Processing...' : 'Morph Voice'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

