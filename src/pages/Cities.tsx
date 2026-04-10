import React, { useState } from 'react';
import { UK_CITIES } from '../data/ukCities';

export const Cities = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Cities & Regions</h1>
      <p className="text-gray-600 mb-6">Browse cities we serve across Great Britain.</p>

      <div className="p-6 bg-white border rounded">
        <h3 className="text-lg font-bold mb-3">Serviced Cities</h3>
        <div className="flex flex-wrap gap-2">
          {UK_CITIES.map(city => (
            <span key={city} className="px-3 py-1 rounded bg-zinc-100 text-sm">{city}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cities;
