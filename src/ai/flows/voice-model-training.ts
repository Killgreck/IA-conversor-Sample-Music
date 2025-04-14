'use server';
/**
 * @fileOverview Voice model training flow for voice conversion.
 *
 * - trainVoiceModel - Trains a voice conversion model using the provided voice track.
 * - TrainVoiceModelInput - The input type for the trainVoiceModel function.
 * - TrainVoiceModelOutput - The return type for the trainVoiceModel function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {trainModel} from '@/services/voice-model-trainer';

const TrainVoiceModelInputSchema = z.object({
  voiceTrack: z.string().describe('The m4a voice track to train the voice model, as a base64 encoded string.'),
});
export type TrainVoiceModelInput = z.infer<typeof TrainVoiceModelInputSchema>;

const TrainVoiceModelOutputSchema = z.object({
  modelId: z.string().describe('The ID of the trained voice model.'),
});
export type TrainVoiceModelOutput = z.infer<typeof TrainVoiceModelOutputSchema>;

export async function trainVoiceModel(input: TrainVoiceModelInput): Promise<TrainVoiceModelOutput> {
  try {
    const modelId = await trainModel(input.voiceTrack);
    return {
      modelId: modelId,
    };
  } catch (error: any) {
    console.error('Error during voice model training:', error);
    throw new Error(error.message || 'Voice model training failed');
  }
}

const trainVoiceModelFlow = ai.defineFlow<
  {voiceTrack: string},
  typeof TrainVoiceModelOutputSchema
>(
  {
    name: 'trainVoiceModelFlow',
    inputSchema: z.object({
      voiceTrack: z.string().describe('The m4a voice track to train the voice model, as a base64 encoded string.'),
    }),
    outputSchema: TrainVoiceModelOutputSchema,
  },
  async input => {
    // TODO: Implement voice model training logic here.
    // This is a placeholder implementation.
    const voiceTrackBuffer = Buffer.from(input.voiceTrack, 'base64');
    console.log('Training voice model with input:', voiceTrackBuffer);

    // Return a dummy model ID for now.
    const modelId = 'dummy-model-id-' + Math.random().toString(36).substring(7);

    return {
      modelId: modelId,
    };
  }
);
