import React from 'react';

export const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Terms of Service</h1>
      </div>
      
      <div className="bg-white p-8 border rounded-xl shadow-sm prose max-w-none text-gray-700">
        <p className="mb-6 leading-relaxed text-lg">
          These Terms govern your use of HomeServ. By using the platform you agree to our rules around account usage, bookings, cancellations, and payments. Service providers are independent contractors and are responsible for their own compliance with local laws. Admin decisions and dispute resolutions are final as described in our policies.
        </p>
        <p className="leading-relaxed text-lg border-t pt-6">
          This is a short summary. For a binding terms document suitable for Great Britain, have these terms reviewed by counsel before publishing.
        </p>
        <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-600">Effective from: April 2026</span>
        </div>
      </div>
    </div>
  );
};

export default Terms;
