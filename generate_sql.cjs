const fs = require('fs');
const gifts = require('./src/data/gifts.json');

const sqlFile = 'C:/Users/nicog/.gemini/antigravity/brain/ac2ef630-8161-418a-a3c7-041e39347467/scratch/supabase_schema.sql';
let inserts = '\n\n-- Insert initial gifts\n';

gifts.forEach(gift => {
  const title = gift.title.replace(/'/g, "''");
  inserts += `INSERT INTO public.gifts (id, title, price, image, url) VALUES ('${gift.id}', '${title}', ${gift.price}, '${gift.image}', '${gift.url}') ON CONFLICT (id) DO NOTHING;\n`;
});

fs.appendFileSync(sqlFile, inserts);
console.log('Done!');
