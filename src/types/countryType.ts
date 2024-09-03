export type Country = {
  countryName: string;
  alpha2: string;
  alpha3: string;
};

export type Countries = {
  [key: string]: Country;
};
