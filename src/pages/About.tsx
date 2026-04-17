import React from 'react';

export const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">About HomeServ</h1>
      <div className="bg-white p-8 border rounded-xl shadow-sm text-left">
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          HomeServ connects customers across Great Britain with trusted local service professionals from home repairs and cleaning to personal services. Our mission is to make finding reliable help fast, safe, and affordable.
        </p>
        <p className="text-lg text-gray-700 leading-relaxed border-t pt-6">
          We operate across England, Scotland, Wales, and Northern Ireland providing a platform for service providers to grow their businesses and for customers to discover vetted professionals.
        </p>
      </div>
    </div>
  );
};

export default About;
