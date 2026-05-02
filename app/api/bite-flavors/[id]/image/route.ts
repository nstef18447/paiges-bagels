import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${id}.${ext}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('bites')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('bites')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Update the flavor record with the image URL
    const { error: updateError } = await supabase
      .from('bite_flavors')
      .update({ image_url: imageUrl })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update flavor image' },
        { status: 500 }
      );
    }

    return NextResponse.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Error uploading bite image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
