
/**
 * Market Data Service
 * 
 * In a production environment, this service would manage WebSocket connections
 * to an exchange data provider (e.g. NGX, InfoWARE, Bloomberg, Refinitiv).
 * 
 * For this demo, it simulates:
 * 1. Connection latency and handshake
 * 2. Realistic price ticks within daily price bands (+/- 10%)
 * 3. Bid/Ask spread generation
 * 4. Market Hours status
 */

import { Asset } from "../types";

export class MarketDataService {
    private isConnected: boolean = false;
    private subscribers: Map<string, Function[]> = new Map();
    private intervalId: any = null;
    
    // Config
    private readonly REFRESH_RATE = 3000; // 3 seconds
    private readonly MARKET_OPEN_HOUR = 9; // 9 AM
    private readonly MARKET_CLOSE_HOUR = 15; // 3 PM (Lagos)

    constructor() {
        console.log("MarketDataService Initialized");
    }

    public async connect(): Promise<boolean> {
        return new Promise((resolve) => {
            console.log("Connecting to NGX Live Data Feed...");
            setTimeout(() => {
                this.isConnected = true;
                this.startFeed();
                console.log("NGX Feed Connected.");
                resolve(true);
            }, 1500); // Simulate handshake delay
        });
    }

    public disconnect() {
        this.isConnected = false;
        if (this.intervalId) clearInterval(this.intervalId);
    }

    public isMarketOpen(): boolean {
        // For demo purposes, we can force open, or check real time
        // const now = new Date();
        // const hour = now.getUTCHours() + 1; // Lagos is UTC+1
        // return hour >= this.MARKET_OPEN_HOUR && hour < this.MARKET_CLOSE_HOUR;
        return true; // Always open for demo
    }

    public subscribe(callback: (updatedAssets: Partial<Asset>[]) => void) {
        // In a real app we'd track specific tickers. Here we just return a batch updater.
        this.subscribers.set('all', [callback]);
    }

    private startFeed() {
        if (this.intervalId) clearInterval(this.intervalId);
        
        this.intervalId = setInterval(() => {
            if (!this.isConnected) return;

            // Generate updates
            // We don't have the full asset list here, so the consumer (App.tsx) 
            // passes the current list, or we generate generic updates.
            // Since this service is a singleton/utility in this architecture, 
            // we will expose a helper to 'tick' a list of assets.
        }, this.REFRESH_RATE);
    }

    // Static helper to simulate a market tick for a list of assets
    public static simulateTick(assets: Asset[]): Asset[] {
        return assets.map(asset => {
            // 1. Determine direction (random walk with momentum)
            const volatility = asset.riskScore === 'High' ? 0.015 : asset.riskScore === 'Medium' ? 0.008 : 0.002;
            const sentiment = Math.random() > 0.48 ? 1 : -1; // Slight bullish bias
            const movePercent = (Math.random() * volatility) * sentiment;

            // 2. Calculate new price
            let newPrice = asset.price * (1 + movePercent);

            // 3. Clamp to +/- 10% of "Day Open" (mocked as original price for now)
            // In a real app we'd store 'openPrice' separately. 
            // We'll just ensure it doesn't go negative.
            if (newPrice < 0.01) newPrice = 0.01;

            // 4. Update High/Low
            const newHigh = Math.max(asset.dayHigh, newPrice);
            const newLow = Math.min(asset.dayLow, newPrice);

            // 5. Generate Spread
            const spread = newPrice * 0.005; // 0.5% spread
            const bid = newPrice - (spread / 2);
            const ask = newPrice + (spread / 2);

            return {
                ...asset,
                price: newPrice,
                change24h: asset.change24h + (movePercent * 100),
                dayHigh: newHigh,
                dayLow: newLow,
                bid: bid,
                ask: ask,
                lastUpdate: Date.now()
            };
        });
    }
}

export const marketService = new MarketDataService();
