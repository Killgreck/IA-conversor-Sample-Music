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
   // Convert the base64 encoded string back to a Buffer
  // const vocalTrackBuffer = Buffer.from(input.vocalTrack, 'base64');
  return voiceConversionFlow({vocalTrack: input.vocalTrack, voiceModelId: input.voiceModelId});
}

const convertVoice = ai.defineTool({
  name: 'convertVoice',
  description: 'Converts the provided vocal track using the specified voice model.',
  inputSchema: z.object({
    vocalTrack: z.string().describe('The isolated vocal track as a base64 encoded string.'),
    voiceModelId: z.string().describe('The ID of the trained voice model.'),
  }),
  outputSchema: z.instanceof(Buffer),
},
async input => {
  // TODO: Implement this by calling the voice conversion API.
  // This is a placeholder implementation.
  return Buffer.from('stubbed converted vocal track data');
});

const prompt = ai.definePrompt({
  name: 'voiceConversionPrompt',
  tools: [convertVoice],
  prompt: `Use the convertVoice tool to convert the vocal track using the voice model. Then respond that the voice has been converted.`,  
});

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
  const convertedVocalTrackBuffer = await convertVoice({vocalTrack: input.vocalTrack, voiceModelId: input.voiceModelId});
  const convertedVocalTrack = convertedVocalTrackBuffer.toString('base64');
  return {
    convertedVocalTrack: convertedVocalTrack,
  };
});
