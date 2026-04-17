import React from 'react';

export const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Privacy Policy</h1>
      </div>
      
      <div className="bg-white p-8 border rounded-xl shadow-sm prose max-w-none text-gray-700">
        <p className="mb-6 leading-relaxed text-lg">
          HomeServ respects your privacy. This policy explains what information we collect, how we use it, and how you can control your data. We collect account and profile information, booking and transaction data, and any documents you upload for verification. We use this data to provide and improve our services, to process payments, and to investigate disputes.
        </p>
        <p className="leading-relaxed text-lg border-t pt-6">
          For legal compliance and personalised service we may share limited data with payment processors and service providers. For a full, legally reviewed policy tailored to Pakistani law, consult a local lawyer. This is a summary for in-app reference.
        </p>
        <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-600">Last updated: April 2026</span>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
