import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase credentials in env.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fetchMercadoLibrePrice(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    if (!response.ok) {
      console.warn(`[WARN] No se pudo cargar la página: ${response.status} - ${url}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // MercadoLibre commonly uses a meta tag for the price or a specific class
    let priceStr = $('meta[itemprop="price"]').attr('content');
    
    // Fallback classes if meta tag is missing
    if (!priceStr) {
      const priceText = $('.ui-pdp-price__second-line .andes-money-amount__fraction').first().text();
      if (priceText) {
        priceStr = priceText.replace(/\./g, '');
      }
    }

    if (priceStr) {
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) return price;
    }
    
    console.warn(`[WARN] No se encontró el precio para: ${url}`);
    return null;
  } catch (error) {
    console.error(`[ERROR] Falló el scraping para ${url}:`, error.message);
    return null;
  }
}

async function run() {
  console.log("Iniciando sincronización de precios...");
  
  const { data: gifts, error } = await supabase.from('gifts').select('*');
  
  if (error) {
    console.error("Error al obtener regalos de Supabase:", error);
    process.exit(1);
  }

  for (const gift of gifts) {
    if (!gift.url || !gift.url.includes('mercadolibre')) {
      console.log(`[SKIP] Regalo sin URL de MercadoLibre: ${gift.title}`);
      continue;
    }

    // Esperar aleatoriamente entre 1 y 3 segundos para no ser bloqueados
    const delay = Math.floor(Math.random() * 2000) + 1000;
    await new Promise(r => setTimeout(r, delay));

    console.log(`[FETCH] Consultando precio de: ${gift.title}`);
    const currentPrice = await fetchMercadoLibrePrice(gift.url);
    
    if (currentPrice !== null && currentPrice !== Number(gift.price)) {
      console.log(`[UPDATE] Precio cambiado para "${gift.title}": ${gift.price} -> ${currentPrice}`);
      
      const { error: updateError } = await supabase
        .from('gifts')
        .update({ price: currentPrice })
        .eq('id', gift.id);
        
      if (updateError) {
        console.error(`[ERROR] No se pudo actualizar el precio en DB:`, updateError);
      }
    } else if (currentPrice !== null) {
      console.log(`[OK] El precio se mantiene igual (${currentPrice})`);
    }
  }

  console.log("Sincronización finalizada.");
}

run();
