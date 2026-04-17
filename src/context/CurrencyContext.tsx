import React, { createContext, useContext, useState, useEffect } from 'react';
import { CURRENCY_RATES } from '../utils/currency';

type Currency = 'GBP';

const CurrencyContext = createContext({
  currency: 'GBP' as Currency,
  setCurrency: (c: Currency) => {},
  rates: CURRENCY_RATES
});

export const CurrencyProvider = ({ children }: any) => {
  const [currency, setCurrency] = useState<Currency>(() => (localStorage.getItem('hs_currency') as Currency) || 'GBP');

  useEffect(() => {
    localStorage.setItem('hs_currency', currency);
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates: CURRENCY_RATES }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
