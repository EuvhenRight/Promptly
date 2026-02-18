'use server';

import Replicate from 'replicate';

/**
 * A hardcoded test function to run a specific prompt with "google/imagen-4".
 * This is for debugging purposes as requested by the user.
 */
export async function testImagen4(): Promise<{ imageUrl: string }> {
  // Explicitly initialize with the auth token.
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  const input = {
    prompt: "The photo: Create a cinematic, photorealistic medium shot capturing the nostalgic warmth of a late 90s indie film. The focus is a young woman with brightly dyed pink-gold hair and freckled skin, looking directly and intently into the camera lens with a hopeful yet slightly uncertain smile, she is slightly off-center. She wears an oversized, vintage band t-shirt that says \"Replicate\" (slightly worn) over a long-sleeved striped top and simple silver stud earrings. The lighting is soft, golden hour sunlight streaming through a slightly dusty window, creating lens flare and illuminating dust motes in the air. The background shows a blurred, cluttered bedroom with posters on the wall and fairy lights, rendered with a shallow depth of field. Natural film grain, a warm, slightly muted color palette, and sharp focus on her expressive eyes enhance the intimate, authentic feel",
    aspect_ratio: "16:9",
    image_size: "1K", 
    safety_filter_level: "block_medium_and_above"
  };

  try {
    const output = await replicate.run("google/imagen-4", { input });
    
    // Replicate can return a single URL or an array of URLs
    const imageUrl = Array.isArray(output) ? output[0] : output as string;

    if (!imageUrl) {
      throw new Error("Image generation failed to produce a URL.");
    }
    
    return { imageUrl };

  } catch (error: any) {
    console.error('[Flow: testImagen4] Error calling Replicate API:', error);
    // Replicate errors often have a title and detail. Let's pass that back.
    const errorMessage = error.detail ? `${error.title}: ${error.detail}` : error.message || 'An unknown error occurred with the AI model.';
    throw new Error(errorMessage);
  }
}
