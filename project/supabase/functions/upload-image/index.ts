import { Storage } from "npm:@google-cloud/storage@7.9.0";
import { compress } from "npm:sharp@0.33.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: 'kostopia',
  credentials: JSON.parse(Deno.env.get('GOOGLE_CLOUD_CREDENTIALS') || '{}')
});

const bucket = storage.bucket('kostopia');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method === 'POST') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const type = formData.get('type') as string; // 'common' or 'parking'
      
      if (!file) {
        throw new Error('No file provided');
      }

      // Read file buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Compress image using sharp
      const compressedBuffer = await compress({
        quality: 80,
        format: 'jpeg'
      })(buffer);

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${type}-${timestamp}-${file.name}`;
      const filepath = `property-images/${filename}`;

      // Upload to Google Cloud Storage
      const blob = bucket.file(filepath);
      await blob.save(compressedBuffer, {
        contentType: 'image/jpeg',
        public: true
      });

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/kostopia/${filepath}`;

      return new Response(
        JSON.stringify({ url: publicUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (req.method === 'DELETE') {
      const { url } = await req.json();
      
      // Extract filename from URL
      const filename = url.split('/').pop();
      const filepath = `property-images/${filename}`;

      // Delete from Google Cloud Storage
      await bucket.file(filepath).delete();

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});