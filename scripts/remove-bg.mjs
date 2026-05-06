import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jbcexrrwrarivnxdrsnb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiY2V4cnJ3cmFyaXZueGRyc25iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODAzNiwiZXhwIjoyMDg0ODc0MDM2fQ.bXqA6ef8_KEpIZh8m9FM0xVgyVa_OUqpW2_ZWk91KYc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Flood-fill from edges to remove connected white/near-white background
async function removeWhiteBackground(buffer, threshold = 30) {
  const image = sharp(buffer);
  const { width, height } = await image.metadata();

  const raw = await image.ensureAlpha().raw().toBuffer();
  const data = new Uint8Array(raw);

  const isNearWhite = (idx) =>
    data[idx] >= 255 - threshold &&
    data[idx + 1] >= 255 - threshold &&
    data[idx + 2] >= 255 - threshold;

  const visited = new Uint8Array(width * height);
  const queue = [];

  const enqueue = (pos) => {
    if (!visited[pos]) {
      const idx = pos * 4;
      if (isNearWhite(idx)) {
        visited[pos] = 1;
        queue.push(pos);
      }
    }
  };

  // Seed from all four edges
  for (let x = 0; x < width; x++) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    enqueue(y * width);
    enqueue(y * width + (width - 1));
  }

  // BFS flood fill
  let i = 0;
  while (i < queue.length) {
    const pos = queue[i++];
    data[pos * 4 + 3] = 0; // make transparent

    const x = pos % width;
    const y = Math.floor(pos / width);
    if (x > 0) enqueue(pos - 1);
    if (x < width - 1) enqueue(pos + 1);
    if (y > 0) enqueue(pos - width);
    if (y < height - 1) enqueue(pos + width);
  }

  // Trim transparent edges and add consistent padding
  return sharp(Buffer.from(data), { raw: { width, height, channels: 4 } })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 })
    .extend({ top: 20, bottom: 20, left: 20, right: 20, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function main() {
  const { data: flavors, error } = await supabase
    .from('bite_flavors')
    .select('id, name, image_url, menu_image_url');

  if (error) { console.error('Failed to fetch flavors:', error); return; }
  console.log(`Found ${flavors.length} flavor(s) with images.\n`);

  for (const flavor of flavors) {
    // Process order image
    if (flavor.image_url) {
      console.log(`Processing order image: ${flavor.name}...`);
      const res = await fetch(flavor.image_url);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        const processed = await removeWhiteBackground(buffer);
        const filePath = `${flavor.id}.png`;
        const { error: uploadError } = await supabase.storage
          .from('bites').upload(filePath, processed, { contentType: 'image/png', upsert: true });
        if (uploadError) { console.error(`  Upload failed:`, uploadError.message); }
        else {
          const { data: urlData } = supabase.storage.from('bites').getPublicUrl(filePath);
          await supabase.from('bite_flavors').update({ image_url: urlData.publicUrl }).eq('id', flavor.id);
          console.log(`  ✓ Done`);
        }
      }
    }

    // Process menu image
    if (flavor.menu_image_url) {
      console.log(`Processing menu image: ${flavor.name}...`);
      const res = await fetch(flavor.menu_image_url);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        const processed = await removeWhiteBackground(buffer);
        const filePath = `menu_${flavor.id}.png`;
        const { error: uploadError } = await supabase.storage
          .from('bites').upload(filePath, processed, { contentType: 'image/png', upsert: true });
        if (uploadError) { console.error(`  Upload failed:`, uploadError.message); }
        else {
          const { data: urlData } = supabase.storage.from('bites').getPublicUrl(filePath);
          await supabase.from('bite_flavors').update({ menu_image_url: urlData.publicUrl }).eq('id', flavor.id);
          console.log(`  ✓ Done`);
        }
      }
    }
  }

  console.log('\nAll done!');
}

main().catch(console.error);
