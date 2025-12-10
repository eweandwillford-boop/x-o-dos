
import React from 'react';
import { Asset } from '../types';
import { TrendingUp, TrendingDown, ShieldCheck, AlertTriangle, Star } from 'lucide-react';

interface AssetCardProps {
  asset: Asset;
  onClick: (asset: Asset) => void;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (assetId: string) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick, isWatchlisted = false, onToggleWatchlist }) => {
  const isPositive = asset.change24h >= 0;

  return (
    <div 
      onClick={() => onClick(asset)}
      className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer group hover:shadow-lg hover:shadow-emerald-900/10 relative"
    >
      {onToggleWatchlist && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatchlist(asset.id);
          }}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors z-10 ${isWatchlisted ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-700'}`}
        >
          <Star size={16} fill={isWatchlisted ? "currentColor" : "none"} />
        </button>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider bg-blue-400/10 px-2 py-0.5 rounded">{asset.category}</span>
          <h3 className="text-lg font-bold text-white mt-1 group-hover:text-emerald-400 transition-colors pr-8">{asset.ticker}</h3>
          <p className="text-sm text-slate-400 truncate w-48">{asset.name}</p>
        </div>
        <div className="flex flex-col items-end pt-6"> {/* Added padding top to clear the star icon */}
          <span className="text-lg font-mono text-white">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
          <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
            {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div className="flex items-center space-x-4">
           {asset.yield && (
             <div className="flex flex-col">
               <span className="text-[10px] text-slate-500 uppercase">Yield</span>
               <span className="text-sm font-semibold text-emerald-300">{asset.yield.toFixed(2)}%</span>
             </div>
           )}
           <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase">Risk</span>
              <div className="flex items-center gap-1">
                 {asset.riskScore === 'Low' ? <ShieldCheck size={14} className="text-emerald-400"/> : asset.riskScore === 'Medium' ? <AlertTriangle size={14} className="text-yellow-400"/> : <AlertTriangle size={14} className="text-rose-400"/>}
                 <span className={`text-sm font-semibold ${asset.riskScore === 'Low' ? 'text-emerald-400' : asset.riskScore === 'Medium' ? 'text-yellow-400' : 'text-rose-400'}`}>{asset.riskScore}</span>
              </div>
           </div>
        </div>
        <button className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors">
          View
        </button>
      </div>
    </div>
  );
};
