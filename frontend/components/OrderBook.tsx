
import React, { useMemo } from 'react';
import { Asset } from '../types';

interface OrderBookProps {
  asset: Asset;
}

export const OrderBook: React.FC<OrderBookProps> = ({ asset }) => {
  // Generate deterministic but realistic looking order book based on current price
  const { bids, asks, maxTotal } = useMemo(() => {
    const spread = asset.price * 0.005; // 0.5% spread
    const mid = asset.price;
    
    // Helper to generate a level
    const generateLevels = (basePrice: number, type: 'BID' | 'ASK', count: number) => {
      return Array.from({ length: count }).map((_, i) => {
        // Price moves away from mid
        const factor = 1 + ((i + 1) * 0.002); // 0.2% steps
        const price = type === 'ASK' ? basePrice * factor : basePrice / factor;
        
        // Random size
        const size = Math.floor(Math.random() * 5000) + 100;
        const total = size * price;
        return { price, size, total };
      });
    };

    // Generate Bids (Lower than price) and Asks (Higher than price)
    const askLevels = generateLevels(mid + (spread/2), 'ASK', 8); // Ascending price
    const bidLevels = generateLevels(mid - (spread/2), 'BID', 8); // Descending price

    // Find max size for the progress bar background
    const allSizes = [...askLevels, ...bidLevels].map(o => o.size);
    const max = Math.max(...allSizes);

    return {
      asks: askLevels.reverse(), // Reverse so lowest Ask is at the bottom (closest to spread)
      bids: bidLevels,           // Highest Bid is at the top (closest to spread)
      maxTotal: max
    };
  }, [asset.price, asset.lastUpdate, asset.id]); 

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 h-full flex flex-col overflow-hidden">
       <div className="flex justify-between items-center mb-3">
         <h3 className="text-slate-400 text-xs font-bold uppercase">Order Book</h3>
         <span className="text-[10px] text-slate-500 font-mono">Spread: {(asset.ask - asset.bid).toFixed(4)}</span>
       </div>
       
       <div className="grid grid-cols-3 text-[10px] text-slate-500 mb-2 uppercase font-bold text-right pr-1">
          <span className="text-left">Price</span>
          <span>Amount</span>
          <span>Total</span>
       </div>

       <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {/* ASKS (Sell Orders) - Red */}
          <div className="flex flex-col space-y-[1px]"> 
             {asks.map((order, i) => (
                <div key={`ask-${i}`} className="grid grid-cols-3 text-xs text-right relative py-0.5 hover:bg-slate-700/50 cursor-pointer group">
                   <span className="text-rose-400 font-mono text-left pl-1 relative z-10">{order.price.toFixed(3)}</span>
                   <span className="text-slate-300 relative z-10">{order.size.toLocaleString()}</span>
                   <span className="text-slate-500 relative z-10 group-hover:text-slate-300">{(order.total/1000).toFixed(1)}k</span>
                   <div 
                     className="absolute top-0 right-0 bottom-0 bg-rose-500/10 z-0 transition-all duration-500 ease-out" 
                     style={{ width: `${(order.size / maxTotal) * 100}%` }}
                   />
                </div>
             ))}
          </div>

          {/* Spread Indicator */}
          <div className="py-2 flex items-center justify-center border-y border-slate-700/50 my-1 bg-slate-900/30">
             <span className={`text-lg font-bold font-mono ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               ${asset.price.toFixed(3)}
             </span>
             {/* Dynamic arrow could go here */}
          </div>

          {/* BIDS (Buy Orders) - Green */}
          <div className="flex flex-col space-y-[1px]">
             {bids.map((order, i) => (
                <div key={`bid-${i}`} className="grid grid-cols-3 text-xs text-right relative py-0.5 hover:bg-slate-700/50 cursor-pointer group">
                   <span className="text-emerald-400 font-mono text-left pl-1 relative z-10">{order.price.toFixed(3)}</span>
                   <span className="text-slate-300 relative z-10">{order.size.toLocaleString()}</span>
                   <span className="text-slate-500 relative z-10 group-hover:text-slate-300">{(order.total/1000).toFixed(1)}k</span>
                    <div 
                     className="absolute top-0 right-0 bottom-0 bg-emerald-500/10 z-0 transition-all duration-500 ease-out" 
                     style={{ width: `${(order.size / maxTotal) * 100}%` }}
                   />
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};
