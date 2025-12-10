
import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Brush, Line, ReferenceLine, ComposedChart 
} from 'recharts';
import { 
  Calendar, Activity, TrendingUp, Minus, Trash2, 
  MousePointer2, Eye, EyeOff
} from 'lucide-react';

interface PriceChartProps {
  data: { date: string; price: number }[];
  color?: string;
}

type TimeRange = '1W' | '1M' | '3M' | '1Y' | 'ALL';

// --- Technical Indicator Helpers ---

const calculateSMA = (data: any[], period: number) => {
  return data.map((item, index) => {
    if (index < period - 1) return { ...item, sma: null };
    const slice = data.slice(index - period + 1, index + 1);
    const sum = slice.reduce((acc: number, curr: any) => acc + curr.price, 0);
    return { ...item, sma: sum / period };
  });
};

const calculateEMA = (data: any[], period: number) => {
  const k = 2 / (period + 1);
  let ema = data[0].price;
  return data.map((item, index) => {
    if (index === 0) return { ...item, ema: item.price };
    ema = item.price * k + ema * (1 - k);
    return { ...item, ema: index < period - 1 ? null : ema };
  });
};

const calculateRSI = (data: any[], period: number = 14) => {
  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = data[i]?.price - data[i - 1]?.price;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  return data.map((item, index) => {
    if (index <= period) return { ...item, rsi: null };

    const change = item.price - data[index - 1].price;
    const currentGain = change > 0 ? change : 0;
    const currentLoss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) return { ...item, rsi: 100 };
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    return { ...item, rsi };
  });
};

export const PriceChart: React.FC<PriceChartProps> = ({ data, color = "#10b981" }) => {
  const [range, setRange] = useState<TimeRange>('3M');
  
  // Indicator Toggles
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [showRSI, setShowRSI] = useState(false);

  // Drawing Tools
  const [drawMode, setDrawMode] = useState(false);
  const [refLines, setRefLines] = useState<number[]>([]);

  // 1. Filter Data by Range
  const filteredBaseData = useMemo(() => {
    if (range === 'ALL') return data;
    const now = new Date();
    const cutoff = new Date();
    switch (range) {
      case '1W': cutoff.setDate(now.getDate() - 7); break;
      case '1M': cutoff.setDate(now.getDate() - 30); break;
      case '3M': cutoff.setDate(now.getDate() - 90); break;
      case '1Y': cutoff.setDate(now.getDate() - 365); break;
    }
    return data.filter(item => new Date(item.date) >= cutoff);
  }, [data, range]);

  // 2. Calculate Indicators on Filtered Data
  const chartData = useMemo(() => {
    let computed = filteredBaseData;
    if (showSMA) computed = calculateSMA(computed, 20); // 20-period SMA
    if (showEMA) computed = calculateEMA(computed, 20); // 20-period EMA
    if (showRSI) computed = calculateRSI(computed, 14); // 14-period RSI
    return computed;
  }, [filteredBaseData, showSMA, showEMA, showRSI]);

  // Handlers
  const handleChartClick = (e: any) => {
    if (drawMode && e && e.activePayload) {
      const price = e.activePayload[0].payload.price;
      setRefLines(prev => [...prev, price]);
      setDrawMode(false); // Turn off after drawing one line for better UX
    }
  };

  return (
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800 flex flex-col h-[550px] space-y-4">
      
      {/* Header & Range Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h3 className="text-slate-400 text-sm font-medium flex items-center gap-2">
          <Calendar size={16} /> Technical Analysis
        </h3>
        <div className="flex bg-slate-800 rounded-lg p-1 space-x-1">
          {(['1W', '1M', '3M', '1Y', 'ALL'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                range === r 
                  ? 'bg-slate-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1 border-r border-slate-700 pr-3 mr-2">
           <span className="text-xs text-slate-500 mr-1 uppercase font-bold">Indicators</span>
           <button 
             onClick={() => setShowSMA(!showSMA)}
             className={`px-2 py-1 text-xs rounded border transition-colors flex items-center gap-1 ${showSMA ? 'bg-orange-500/10 border-orange-500 text-orange-400' : 'border-slate-700 text-slate-400 hover:text-white'}`}
           >
             SMA (20)
           </button>
           <button 
             onClick={() => setShowEMA(!showEMA)}
             className={`px-2 py-1 text-xs rounded border transition-colors flex items-center gap-1 ${showEMA ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'border-slate-700 text-slate-400 hover:text-white'}`}
           >
             EMA (20)
           </button>
           <button 
             onClick={() => setShowRSI(!showRSI)}
             className={`px-2 py-1 text-xs rounded border transition-colors flex items-center gap-1 ${showRSI ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'border-slate-700 text-slate-400 hover:text-white'}`}
           >
             <Activity size={12}/> RSI (14)
           </button>
        </div>
        
        <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-1 uppercase font-bold">Draw</span>
            <button 
                onClick={() => setDrawMode(!drawMode)}
                className={`px-2 py-1 text-xs rounded border transition-colors flex items-center gap-1 ${drawMode ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-700 text-slate-400 hover:text-white'}`}
            >
                <MousePointer2 size={12}/> {drawMode ? 'Click Chart to Add Line' : 'Add Horiz. Line'}
            </button>
            {refLines.length > 0 && (
                <button 
                    onClick={() => setRefLines([])}
                    className="px-2 py-1 text-xs rounded border border-rose-900/50 text-rose-400 hover:bg-rose-900/20 flex items-center gap-1"
                >
                    <Trash2 size={12}/> Clear ({refLines.length})
                </button>
            )}
        </div>
      </div>

      {/* Charts Container */}
      <div className="flex-1 min-h-0 flex flex-col gap-2">
        
        {/* Main Price Chart */}
        <div className={`w-full ${showRSI ? 'h-[70%]' : 'h-full'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
                data={chartData} 
                onClick={handleChartClick}
                margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                style={{ cursor: drawMode ? 'crosshair' : 'default' }}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="date" 
                hide={showRSI} // Hide X Axis if RSI is showing below
                stroke="#94a3b8" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value < 1 ? value.toFixed(2) : value.toFixed(0)}`}
                width={50}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number, name: string) => [
                    name === 'price' ? `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}` : value.toFixed(2), 
                    name.toUpperCase()
                ]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={color} 
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                strokeWidth={2}
              />

              {showSMA && <Line type="monotone" dataKey="sma" stroke="#f97316" dot={false} strokeWidth={2} name="sma" />}
              {showEMA && <Line type="monotone" dataKey="ema" stroke="#a855f7" dot={false} strokeWidth={2} name="ema" />}

              {refLines.map((price, idx) => (
                  <ReferenceLine 
                    key={idx} 
                    y={price} 
                    stroke="#fbbf24" 
                    strokeDasharray="4 4" 
                    label={{ value: price.toFixed(2), fill: '#fbbf24', fontSize: 10, position: 'right' }} 
                  />
              ))}

              {!showRSI && (
                <Brush 
                    dataKey="date" 
                    height={30} 
                    stroke="#475569" 
                    fill="#1e293b" 
                    tickFormatter={() => ''}
                    alwaysShowText={false} 
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Secondary RSI Chart */}
        {showRSI && (
            <div className="h-[30%]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} syncId="anyId" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                            tickFormatter={(date) => {
                                const d = new Date(date);
                                return `${d.getDate()}/${d.getMonth() + 1}`;
                            }}
                        />
                        <YAxis 
                            stroke="#94a3b8" 
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                            ticks={[30, 70]}
                            width={50}
                        />
                         <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => [value.toFixed(2), 'RSI']}
                            labelFormatter={() => ''}
                        />
                        <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                        <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
                        <Area type="monotone" dataKey="rsi" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                        <Brush 
                            dataKey="date" 
                            height={20} 
                            stroke="#475569" 
                            fill="#1e293b" 
                            tickFormatter={() => ''}
                            alwaysShowText={false} 
                        />
                    </AreaChart>
                 </ResponsiveContainer>
            </div>
        )}
      </div>
    </div>
  );
};
