import * as cheerio from 'cheerio';
fetch('https://articulo.mercadolibre.com.ar/MLA-1416629983-juego-de-cuchillos-tramontina-plenus-en-acero-inoxidable-y-mangos-polipropileno-negro-9-piezas-_JM', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Accept-Language': 'es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7'
  }
})
  .then(res => res.text())
  .then(html => {
    const $ = cheerio.load(html);
    const metaPrice = $('meta[itemprop="price"]').attr('content');
    const classPrice = $('.ui-pdp-price__second-line .andes-money-amount__fraction').first().text();
    console.log('Meta:', metaPrice);
    console.log('Class:', classPrice);
  });
