'use server';
/**
 * @fileOverview Converts the isolated vocal track to the user's voice using a trained model.
 *
 * - voiceConversion - A function that handles the voice conversion process.
 * - VoiceConversionInput - The input type for the voiceConversion function.
 * - VoiceConversionOutput - The return type for the voiceConversion function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {convertVoice} from '@/services/voice-conversion';

const VoiceConversionInputSchema = z.object({
  vocalTrack: z.string().describe('The isolated vocal track as a base64 encoded string.'),
  voiceModelId: z.string().describe('The ID of the trained voice model.'),
});
export type VoiceConversionInput = z.infer<typeof VoiceConversionInputSchema>;

const VoiceConversionOutputSchema = z.object({
  convertedVocalTrack: z.string().describe('The converted vocal track as a base64 encoded string.'),
});
export type VoiceConversionOutput = z.infer<typeof VoiceConversionOutputSchema>;

export async function voiceConversion(input: VoiceConversionInput): Promise<VoiceConversionOutput> {
  try {
    const convertedVocalTrack = await convertVoice(input.vocalTrack, input.voiceModelId);
    return {
      convertedVocalTrack: convertedVocalTrack.toString('base64'),
    };
  } catch (error: any) {
    console.error('Error during voice conversion:', error);
    throw new Error(error.message || 'Voice conversion failed');
  }
}

const voiceConversionFlow = ai.defineFlow<
  {vocalTrack: string, voiceModelId: string},
  typeof VoiceConversionOutputSchema
>({
  name: 'voiceConversionFlow',
  inputSchema: z.object({
    vocalTrack: z.string().describe('The isolated vocal track as a base64 encoded string.'),
    voiceModelId: z.string().describe('The ID of the trained voice model.'),
  }),
  outputSchema: VoiceConversionOutputSchema,
}, async input => {
  const vocalTrackBuffer = Buffer.from(input.vocalTrack, 'base64');
  const convertedVocalTrackBuffer = await convertVoice(input.vocalTrack, input.voiceModelId);
  const convertedVocalTrack = convertedVocalTrackBuffer.toString('base64');
  return {
    convertedVocalTrack: convertedVocalTrack,
  };
});
