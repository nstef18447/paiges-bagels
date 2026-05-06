import sharp from 'sharp';

const SUPABASE_URL = 'https://jbcexrrwrarivnxdrsnb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiY2V4cnJ3cmFyaXZueGRyc25iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODAzNiwiZXhwIjoyMDg0ODc0MDM2fQ.bXqA6ef8_KEpIZh8m9FM0xVgyVa_OUqpW2_ZWk91KYc';

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const { data: flavors } = await supabase
  .from('bite_flavors')
  .select('id, name, image_url')
  .not('image_url', 'is', null)
  .limit(1);

const flavor = flavors[0];
console.log(`Checking: ${flavor.name} — ${flavor.image_url}\n`);

const res = await fetch(flavor.image_url + '?t=' + Date.now());
const buffer = Buffer.from(await res.arrayBuffer());

const image = sharp(buffer);
const { width, height, channels, format } = await image.metadata();
console.log(`Format: ${format}, Size: ${width}x${height}, Channels: ${channels}`);

const raw = await image.ensureAlpha().raw().toBuffer();
const data = new Uint8Array(raw);

// Check corners
const corners = [
  { label: 'top-left',     pos: 0 },
  { label: 'top-right',    pos: width - 1 },
  { label: 'bottom-left',  pos: (height - 1) * width },
  { label: 'bottom-right', pos: (height - 1) * width + (width - 1) },
];

for (const { label, pos } of corners) {
  const i = pos * 4;
  console.log(`${label}: R=${data[i]} G=${data[i+1]} B=${data[i+2]} A=${data[i+3]}`);
}
