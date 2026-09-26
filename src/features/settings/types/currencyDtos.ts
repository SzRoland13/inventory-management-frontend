export type Currency = {
  id: number;
  code: string;
  name: string;
  symbol: string;
};

export type CurrenciesResponse = {
  currencies: Currency[];
};
