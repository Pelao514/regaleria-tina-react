// Generador automático de códigos alfanuméricos intuitivos (ej: MB-01-0001: M=Marroquinería, B=Bandolera, 01=Variante, 0001=Secuencia)
export function getCategoryPrefix(category = '', productName = '') {
  let mainInitial = 'X';
  let subInitial = 'X';

  const fullText = (category + ' ' + productName).toLowerCase();
  const catLower = (category || '').toLowerCase();

  // 1. Determinar Inicial Principal de la Categoría
  if (catLower.includes('marroquin')) mainInitial = 'M';
  else if (catLower.includes('bijou')) mainInitial = 'B';
  else if (catLower.includes('accesorios') || catLower.includes('pelo')) mainInitial = 'A';
  else if (catLower.includes('cosmétic') || catLower.includes('cosmet') || catLower.includes('skincare')) mainInitial = 'C';
  else if (catLower.includes('infantil') || catLower.includes('juguet')) mainInitial = 'I';
  else if (catLower.includes('bazar')) mainInitial = 'Z';
  else if (catLower.includes('tazas') || catLower.includes('vajilla')) mainInitial = 'V';
  else if (catLower.includes('tecnolog')) mainInitial = 'T';
  else if (catLower.includes('regaler')) mainInitial = 'R';
  else if (catLower.includes('lencer') || catLower.includes('ropa')) mainInitial = 'L';
  else {
    const cleanCat = category.replace(/[^a-zA-Z]/g, '');
    mainInitial = cleanCat.charAt(0).toUpperCase() || 'P';
  }

  // 2. Determinar Inicial Secundaria de Subcategoría / Tipo de Producto
  if (fullText.includes('bandolera')) subInitial = 'B';
  else if (fullText.includes('riñonera')) subInitial = 'R';
  else if (fullText.includes('cartera')) subInitial = 'C';
  else if (fullText.includes('mochila')) subInitial = 'M';
  else if (fullText.includes('billetera')) subInitial = 'W';
  else if (fullText.includes('bolso')) subInitial = 'O';
  else if (fullText.includes('lunchera')) subInitial = 'L';
  else if (fullText.includes('cartuchera')) subInitial = 'T';
  else if (fullText.includes('cinto')) subInitial = 'K';
  else if (fullText.includes('cadena')) subInitial = 'C';
  else if (fullText.includes('rosario') || fullText.includes('denario')) subInitial = 'R';
  else if (fullText.includes('pulsera') || fullText.includes('brazalete')) subInitial = 'P';
  else if (fullText.includes('aro')) subInitial = 'A';
  else if (fullText.includes('dije') || fullText.includes('medalla')) subInitial = 'D';
  else if (fullText.includes('choker') || fullText.includes('gargantilla')) subInitial = 'K';
  else if (fullText.includes('anillo')) subInitial = 'N';
  else if (fullText.includes('conjunto')) subInitial = 'J';
  else if (fullText.includes('broche')) subInitial = 'B';
  else if (fullText.includes('colero') || fullText.includes('gomita') || fullText.includes('scrunchie')) subInitial = 'C';
  else if (fullText.includes('vincha') || fullText.includes('dona')) subInitial = 'V';
  else if (fullText.includes('peine') || fullText.includes('cepillo')) subInitial = 'P';
  else if (fullText.includes('rostro')) subInitial = 'R';
  else if (fullText.includes('ojo') || fullText.includes('ceja')) subInitial = 'O';
  else if (fullText.includes('labio')) subInitial = 'L';
  else if (fullText.includes('maquillaje')) subInitial = 'M';
  else if (fullText.includes('manicur') || fullText.includes('esmalte')) subInitial = 'N';
  else if (fullText.includes('termo')) subInitial = 'T';
  else if (fullText.includes('mate')) subInitial = 'M';
  else if (fullText.includes('botella') || fullText.includes('vaso')) subInitial = 'B';
  else if (fullText.includes('bombilla') || fullText.includes('yerbero')) subInitial = 'Y';
  else if (fullText.includes('jarra') || fullText.includes('chopp')) subInitial = 'J';
  else if (fullText.includes('espejo')) subInitial = 'E';
  else if (fullText.includes('asado')) subInitial = 'A';
  else {
    // Si la categoría contiene " - ", tomar la subcategoría
    let subPart = category.includes('-') ? category.split('-')[1].trim() : productName || category;
    const cleanSub = subPart.replace(/[^a-zA-Z]/g, '');
    subInitial = cleanSub.charAt(0).toUpperCase() || 'G';
  }

  return `${mainInitial}${subInitial}`;
}

export function generateAutoCode(category = '', products = [], productName = '', subcode = '01', excludeId = null) {
  const prefix = getCategoryPrefix(category, productName);
  const cleanSubcode = String(subcode || '01').trim().toUpperCase().padStart(2, '0');
  const regexWithSub = new RegExp(`^${prefix}-${cleanSubcode}-(\\d+)$`, 'i');
  const regexGeneric = new RegExp(`^${prefix}-(\\d+)$`, 'i');

  let maxNum = 0;
  (products || []).forEach(p => {
    if (p.barcode && p.id !== excludeId) {
      const codeStr = String(p.barcode).trim();
      let match = codeStr.match(regexWithSub);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      } else {
        match = codeStr.match(regexGeneric);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
    }
  });

  let nextSeq = maxNum + 1;
  let candidate = `${prefix}-${cleanSubcode}-${String(nextSeq).padStart(4, '0')}`;

  const existingCodes = new Set(
    (products || [])
      .filter(p => p.id !== excludeId && p.barcode)
      .map(p => String(p.barcode).trim().toUpperCase())
  );

  while (existingCodes.has(candidate.toUpperCase())) {
    nextSeq++;
    candidate = `${prefix}-${cleanSubcode}-${String(nextSeq).padStart(4, '0')}`;
  }

  return candidate;
}
