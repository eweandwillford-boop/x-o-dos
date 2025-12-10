
export type AssetCategory = 'Equity' | 'Fixed Income' | 'Real Estate' | 'Private Market';

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  category: AssetCategory;
  price: number;
  change24h: number; // Percentage
  yield?: number; // For fixed income/RE
  riskScore: 'Low' | 'Medium' | 'High';
  description: string;
  availableSupply: number;
  volume24h: number;
  history: { date: string; price: number }[];
  contractAddress: string; // Blockchain contract address

  // Real-time Market Data
  bid: number;
  ask: number;
  dayHigh: number;
  dayLow: number;
  lastUpdate: number; // Timestamp
}

export interface PortfolioItem {
  assetId: string;
  quantity: number;
  averageBuyPrice: number;
  leverage: number;
  borrowedCash: number; // For Longs: Amount borrowed from platform
  shortCollateral: number; // For Shorts: Margin + Proceeds locked
}

export interface TradeOrder {
  id: string;
  assetId: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  positionType: 'LONG' | 'SHORT';
  orderType: 'MARKET' | 'LIMIT';
  leverage: number;
  quantity: number;
  price: number;
  totalValue: number;
  timestamp: string;
  txHash: string;
  blockNumber: number;
  gasFee: number;
}

export interface CashTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  method: string;
  status: 'Success' | 'Pending' | 'Failed';
  timestamp: string;
  txHash: string;
}

declare global {
  interface Window {
    ethereum: any;
  }
}


export interface Notification {
  id: string;
  message: string;
  read: boolean;
  date: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  walletAddress: string;
  cashBalance: number;
  lockedCash: number; // Total locked in collateral
  unsettledBalance?: number;
  portfolio: PortfolioItem[];
  tradeHistory: TradeOrder[];
  cashHistory: CashTransaction[];
  watchlist: string[];
  kycLevel: 1 | 2 | 3;
  twoFactorEnabled: boolean;
  notifications: Notification[];
}
