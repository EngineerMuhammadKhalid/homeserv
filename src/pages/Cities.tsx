import React, { useState } from 'react';
import { PAKISTAN_CITIES, PROVINCE_LIST } from '../data/pakistanCities';

export const Cities = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Cities & Regions</h1>
      <p className="text-gray-600 mb-6">Browse cities we serve across Great Britain.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          {PROVINCE_LIST.map(prov => (
            <button key={prov} onClick={() => setSelected(prov)} className={`w-full text-left p-3 rounded ${selected===prov? 'bg-emerald-50 border border-emerald-200': 'bg-white border border-zinc-100'}`}>
              <div className="font-bold">{prov}</div>
              <div className="text-sm text-zinc-500">{PAKISTAN_CITIES[prov].length} cities</div>
            </button>
          ))}
        </div>

        <div className="md:col-span-2">
          {!selected ? (
            <div className="p-6 bg-zinc-50 rounded">Select a region to view its cities.</div>
          ) : (
            <div className="p-6 bg-white border rounded">
              <h3 className="text-lg font-bold mb-3">{selected}</h3>
              <div className="flex flex-wrap gap-2">
                {PAKISTAN_CITIES[selected].map(city => (
                  <span key={city} className="px-3 py-1 rounded bg-zinc-100 text-sm">{city}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cities;
