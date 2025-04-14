'use client';

import {useEffect, useState} from 'react';

export default function NewSong() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve the audio URL from local storage
    const url = localStorage.getItem('newSongUrl');
    if (url) {
      setAudioUrl(url);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-light-gray">
      <h1>New Song</h1>
      {audioUrl ? (
        <audio controls src={audioUrl}>
          Your browser does not support the audio element.
        </audio>
      ) : (
        <p>No song available.</p>
      )}
    </div>
  );
}

