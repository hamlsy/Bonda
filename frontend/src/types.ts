export type Issuer = {
  id: number;
  corpCode: string;
  name: string;
  stockCode: string | null;
};

export type Bond = {
  id: number;
  issuer: Issuer;
  isin: string;
  bondCode: string;
  name: string;
  issueDate: string;
  maturityDate: string;
  couponRate: number;
  creditRating: string;
  createdAt: string;
};

export type Holding = {
  id: number;
  bond: Bond;
  purchaseDate: string;
  purchaseAmount: number;
  createdAt: string;
};

export type WatchlistEntry = {
  id: number;
  bond: Bond;
  createdAt: string;
};

export type CreateHolding = {
  bondId: number;
  purchaseDate: string;
  purchaseAmount: string;
};
