export const PAKISTAN_CITIES: Record<string, string[]> = {
  England: [
    'London','Birmingham','Manchester','Leeds','Bristol','Liverpool','Newcastle','Sheffield','Coventry','Leicester','Nottingham','Plymouth','Reading','Sunderland','Southampton','Derby','Stoke-on-Trent','Wolverhampton','Lincoln','Oxford','Cambridge','York','Winchester','Bath','Exeter','Chester','Worcester','Hereford','Peterborough','Gloucester'
  ],
  Scotland: [
    'Edinburgh','Glasgow','Aberdeen','Dundee','Perth','Inverness','Stirling','Dunfermline','Paisley','Kilmarnock','Ayr','Dumfries','Oban','Fort William','Wick','Lerwick','Kirkwall'
  ],
  Wales: [
    'Cardiff','Swansea','Newport','Wrexham','Llandudno','Caernarfon','Aberystwyth','Carmarthen','Bangor','Merthyr Tydfil','Neath','Port Talbot'
  ],
  'Northern Ireland': [
    'Belfast','Derry','Lisburn','Newtownabbey','Craigavon','Armagh','Newry','Enniskillen','Bangor','Carrickfergus'
  ]
};

export const PROVINCE_LIST = Object.keys(PAKISTAN_CITIES);

// Flattened list of cities for quick lookup or selection (e.g., birth places)
export const BIRTH_PLACES: string[] = (() => {
  const all: string[] = [];
  for (const prov of Object.keys(PAKISTAN_CITIES)) {
    const arr = PAKISTAN_CITIES[prov] || [];
    for (const c of arr) all.push(c);
  }
  // dedupe while preserving order
  return Array.from(new Set(all));
})();
