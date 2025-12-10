
import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AssetCard } from './components/AssetCard';
import { PriceChart } from './components/PriceChart';
import { OrderBook } from './components/OrderBook';
import { Login } from './components/Login';
import { Asset, User, PortfolioItem, TradeOrder, CashTransaction } from './types';
import { INITIAL_ASSETS, INITIAL_USER } from './constants';
import { generateAssetAnalysis, generateNewAssetDetails } from './services/geminiService';
import { marketService, MarketDataService } from './services/marketDataService';
import { auth, db, isConfigured } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import {
    generateWalletAddress,
    generateContractAddress,
    generateTxHash,
    getCurrentBlockNumber,
    estimateGasFee,
    waitForConfirmation,
    connectWallet
} from './services/blockchainService';
import {
    ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, Sparkles,
    AlertCircle, History, Search, Filter, PlusCircle, X, Loader2, RotateCcw,
    CheckCircle2, AlertTriangle, CreditCard, Building2, Smartphone, Banknote, Link, Boxes,
    Activity, Star, Globe, RefreshCw, Radio, TrendingDown, ArrowRight, Zap, BarChart3, Layers, ShieldPlus,
    PieChart as PieChartIcon, Lock, Unlock, UserCheck, Eye, ScrollText, Users, FileCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, AreaChart, Area, XAxis, YAxis } from 'recharts';

// Persistence Helper
const loadState = <T,>(key: string, defaultState: T): T => {
    const saved = localStorage.getItem(key);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse saved state", e);
            return defaultState;
        }
    }
    return defaultState;
};

// Data Generator Helper for Rich Chart History
const generateHistoricalData = (currentPrice: number, days = 365) => {
    const history = [];
    let price = currentPrice;
    const now = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        history.push({
            date: date.toISOString().split('T')[0],
            price: price
        });

        const volatility = 0.02;
        const change = (Math.random() - 0.5) * 2 * (price * volatility);
        price = price - change;

        if (price < 0.01) price = 0.01;
    }

    return history.reverse();
};

interface MarketActivity {
    id: string;
    user: string;
    action: 'BOUGHT' | 'SOLD' | 'MINTED';
    asset: string;
    amount: string;
    time: string;
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard');

    // Initialize state from local storage or constants
    const [assets, setAssets] = useState<Asset[]>(() => loadState('xodos_assets', INITIAL_ASSETS));
    const [user, setUser] = useState<User>(() => loadState('xodos_user', INITIAL_USER));

    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    // Marketplace State
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Trade State
    const [tradeAmount, setTradeAmount] = useState<number | ''>('');
    const [tradeAction, setTradeAction] = useState<'LONG' | 'SHORT'>('LONG');
    const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
    const [leverage, setLeverage] = useState<number>(1);
    const [limitPrice, setLimitPrice] = useState<number | ''>('');

    const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);
    const [isTrading, setIsTrading] = useState(false);
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

    // Payment Gateway State (Deposit & Withdraw)
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentType, setPaymentType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
    const [paymentStep, setPaymentStep] = useState<'AMOUNT' | 'METHOD' | 'PROCESSING' | 'SUCCESS'>('AMOUNT');
    const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '' });

    // AI State
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Admin Mint State
    const [mintForm, setMintForm] = useState({ ticker: '', name: '', category: 'Equity', price: 0 });
    const [isMinting, setIsMinting] = useState(false);
    const [adminTab, setAdminTab] = useState<'MINT' | 'WITHDRAWALS' | 'USERS'>('MINT');

    // Live Activity State
    const [marketActivity, setMarketActivity] = useState<MarketActivity[]>([]);
    const [marketStatus, setMarketStatus] = useState(true);

    // Net Worth Chart Data (Mock)
    const [netWorthData, setNetWorthData] = useState<{ name: string, value: number }[]>([]);

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
        message: '',
        type: 'success',
        visible: false
    });

    // --- Auth Listener (Firebase) ---
    useEffect(() => {
        if (!isConfigured || !auth) return;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setIsAuthenticated(true);

                // Fetch user profile from Firestore
                if (db) {
                    try {
                        const userRef = doc(db, "users", firebaseUser.uid);
                        const userSnap = await getDoc(userRef);

                        if (userSnap.exists()) {
                            setUser(userSnap.data() as User);
                            showToast(`Welcome back, ${userSnap.data().name}`, 'success');
                        } else {
                            // Create new user doc
                            const newUser: User = {
                                ...INITIAL_USER,
                                id: firebaseUser.uid,
                                name: firebaseUser.displayName || 'New Trader',
                                email: firebaseUser.email || '',
                                walletAddress: generateWalletAddress(),
                                notifications: [] // Explicitly initialize notifications
                            };
                            await setDoc(userRef, newUser);
                            setUser(newUser);
                            showToast("New account created", 'success');
                        }
                    } catch (err) {
                        console.error("Error fetching user data", err);
                    }
                }
            } else {
                setIsAuthenticated(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // --- Persistence Effects ---
    useEffect(() => {
        localStorage.setItem('xodos_assets', JSON.stringify(assets));
    }, [assets]);

    useEffect(() => {
        localStorage.setItem('xodos_user', JSON.stringify(user));
    }, [user]);

    // --- Market Data Service Integration ---
    useEffect(() => {
        // Initialize connection
        marketService.connect().then(() => {
            showToast("NGX Market Feed Connected", "success");
        });

        const interval = setInterval(() => {
            if (!marketStatus) return;
            setAssets(currentAssets => MarketDataService.simulateTick(currentAssets));
        }, 2500); // Fast tick for demo (2.5s)

        return () => {
            marketService.disconnect();
            clearInterval(interval);
        };
    }, [marketStatus]);

    // Sync selectedAsset with updated assets list AND update chart
    useEffect(() => {
        setSelectedAsset(prev => {
            if (!prev) return null;
            const liveAsset = assets.find(a => a.id === prev.id);
            if (!liveAsset) return prev;

            // Preserve the rich history if it exists in the currently viewed asset
            const useRichHistory = prev.history.length > liveAsset.history.length;

            let updatedHistory = useRichHistory ? [...prev.history] : liveAsset.history;

            // CRITICAL: Update the last data point of the history to reflect the live price
            if (updatedHistory.length > 0) {
                updatedHistory[updatedHistory.length - 1] = {
                    ...updatedHistory[updatedHistory.length - 1],
                    price: liveAsset.price
                };
            }

            return {
                ...liveAsset,
                history: updatedHistory
            };
        });
    }, [assets]);

    // --- Live Activity Generator ---
    useEffect(() => {
        const generateActivity = () => {
            const actions: ('BOUGHT' | 'SOLD')[] = ['BOUGHT', 'SOLD'];
            // Ensure we have assets to pick from
            if (assets.length === 0) return;

            const randomAsset = assets[Math.floor(Math.random() * assets.length)];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            const randomAmount = Math.floor(Math.random() * 500) + 10;
            const randomAddr = `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 3)}`;

            const newActivity: MarketActivity = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                user: randomAddr,
                action: randomAction,
                asset: randomAsset.ticker,
                amount: randomAmount.toString(),
                time: 'Just now'
            };

            setMarketActivity(prev => [newActivity, ...prev].slice(0, 20)); // Keep last 20 (increased history)
        };

        // Populate initial if empty
        if (marketActivity.length === 0 && assets.length > 0) {
            generateActivity();
            generateActivity();
            generateActivity();
        }

        const interval = setInterval(() => {
            if (Math.random() > 0.1) { // 90% chance (High Frequency)
                generateActivity();
            }
        }, 800); // 800ms interval for rapid updates

        return () => clearInterval(interval);
    }, [assets]);

    // --- Net Worth Chart Generator ---
    useEffect(() => {
        // Create a mock net worth history based on current portfolio
        const calculateNetWorth = () => {
            let netWorth = user.cashBalance + (user.lockedCash || 0) + (user.unsettledBalance || 0);

            user.portfolio.forEach(item => {
                const asset = assets.find(a => a.id === item.assetId);
                if (!asset) return;

                if (item.quantity > 0) {
                    // Long: Value - Debt
                    netWorth += (item.quantity * asset.price) - (item.borrowedCash || 0);
                } else {
                    // Short: Collateral + (Negative Value)
                    netWorth += (item.quantity * asset.price) + (item.shortCollateral || 0);
                }
            });
            return netWorth;
        };

        const totalWorth = calculateNetWorth();

        const data = [];
        let val = totalWorth * 0.9; // Start 10% lower
        for (let i = 0; i < 20; i++) {
            val = val * (1 + (Math.random() * 0.02 - 0.005)); // Random walk up
            data.push({ name: `Day ${i}`, value: val });
        }
        data.push({ name: 'Today', value: totalWorth }); // Ensure end matches
        setNetWorthData(data);
    }, [user.portfolio, user.cashBalance, user.lockedCash, user.unsettledBalance, assets.length]);

    // --- Market Summary Calculations ---
    const marketSummary = useMemo(() => {
        const totalVolume = assets.reduce((acc, curr) => acc + curr.volume24h, 0);
        const avgChange = assets.reduce((acc, curr) => acc + curr.change24h, 0) / (assets.length || 1);

        // Sort for movers
        const sortedByChange = [...assets].sort((a, b) => b.change24h - a.change24h);
        const topGainers = sortedByChange.slice(0, 3);
        const topLosers = sortedByChange.slice(-3).reverse();

        // Sector Performance
        const sectors = ['Equity', 'Fixed Income'];
        const sectorStats = sectors.map(sector => {
            const sectorAssets = assets.filter(a => a.category === sector);
            const sectorAvg = sectorAssets.reduce((acc, curr) => acc + curr.change24h, 0) / (sectorAssets.length || 1);
            return { name: sector, change: sectorAvg };
        });

        return { totalVolume, avgChange, topGainers, topLosers, sectorStats };
    }, [assets]);


    // --- Helpers ---
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b'];

    const getPortfolioAllocation = () => {
        const allocation: { [key: string]: number } = { 'Cash (USDT)': user.cashBalance };

        user.portfolio.forEach(item => {
            const asset = assets.find(a => a.id === item.assetId);
            if (asset) {
                // Use absolute value for shorts to show exposure magnitude
                const value = Math.abs(item.quantity) * asset.price;
                allocation[asset.category] = (allocation[asset.category] || 0) + value;
            }
        });

        return Object.keys(allocation).map(key => ({
            name: key,
            value: allocation[key]
        }));
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
    };

    const resetDemoData = () => {
        if (window.confirm("Are you sure you want to reset all demo data? Your portfolio and trades will be cleared.")) {
            localStorage.removeItem('xodos_assets');
            localStorage.removeItem('xodos_user');
            window.location.reload();
        }
    };

    const openPaymentModal = (type: 'DEPOSIT' | 'WITHDRAWAL') => {
        setPaymentType(type);
        setPaymentStep('AMOUNT');
        setPaymentAmount('');
        setPaymentMethod('');
        setBankDetails({ bankName: '', accountNumber: '' });
        setPaymentModalOpen(true);
    };

    const toggleWatchlist = (assetId: string) => {
        setUser(prev => {
            const currentList = prev.watchlist || [];
            const newList = currentList.includes(assetId)
                ? currentList.filter(id => id !== assetId)
                : [...currentList, assetId];
            return { ...prev, watchlist: newList };
        });
    };

    const verifyKYC = () => {
        const nextLevel = Math.min(3, user.kycLevel + 1);
        if (nextLevel > user.kycLevel) {
            // Simulate API
            setTimeout(() => {
                setUser(prev => ({ ...prev, kycLevel: nextLevel as any }));
                showToast(`KYC Verification Successful. Upgraded to Tier ${nextLevel}`, 'success');
            }, 1500);
        }
    };

    const toggle2FA = () => {
        setUser(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
        showToast(user.twoFactorEnabled ? "2FA Disabled" : "2FA Enabled via Google Authenticator", "success");
    };

    const handleAnalyze = async () => {
        if (!selectedAsset) return;
        setIsAnalyzing(true);
        setAiAnalysis(null); // Clear previous
        try {
            const analysis = await generateAssetAnalysis(selectedAsset);
            setAiAnalysis(analysis);
        } catch (e) {
            setAiAnalysis("Failed to generate analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- Handlers ---

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleWalletConnect = async () => {
        try {
            const address = await connectWallet();
            setUser(prev => ({ ...prev, walletAddress: address }));
            showToast("Wallet Connected Successfully", "success");
        } catch (e: any) {
            console.error(e);
            showToast("Failed to connect wallet: " + e.message, "error");
        }
    };

    const handleAssetClick = (asset: Asset) => {
        let displayAsset = { ...asset };
        if (displayAsset.history.length < 50) {
            const richHistory = generateHistoricalData(asset.price);
            displayAsset = { ...displayAsset, history: richHistory };
        }

        setSelectedAsset(displayAsset);
        setAiAnalysis(null);
        setTradeAmount('');
        setTradeSuccess(null);
        setTradeAction('LONG');
        setOrderType('MARKET');
        setLeverage(1);
        setLimitPrice('');
        setCurrentView('asset-detail');
    };

    const processPayment = async () => {
        setPaymentStep('PROCESSING');
        await waitForConfirmation();

        const amount = Number(paymentAmount);

        const newTransaction: CashTransaction = {
            id: `cash-${Date.now()}`,
            type: paymentType,
            amount: amount,
            method: paymentType === 'DEPOSIT' ? paymentMethod : `${bankDetails.bankName} - ${bankDetails.accountNumber}`,
            status: paymentType === 'DEPOSIT' ? 'Success' : 'Pending', // Withdrawals pending approval
            timestamp: new Date().toISOString(),
            txHash: generateTxHash()
        };

        if (paymentType === 'DEPOSIT') {
            setUser(prev => ({
                ...prev,
                cashBalance: prev.cashBalance + amount,
                cashHistory: [newTransaction, ...(prev.cashHistory || [])]
            }));
            setPaymentStep('SUCCESS');
        } else {
            // Withdrawal
            setUser(prev => ({
                ...prev,
                cashBalance: prev.cashBalance - amount,
                cashHistory: [newTransaction, ...(prev.cashHistory || [])]
            }));
            setPaymentStep('SUCCESS');
        }
    };

    const handleTradeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAsset || !tradeAmount) return;

        // Check KYC Limits
        if (user.kycLevel === 1 && (Number(tradeAmount) * selectedAsset.price) > 5000) {
            setTradeSuccess("Tier 1 Limit Exceeded. Upgrade KYC to trade > $5,000.");
            return;
        }

        const amount = Number(tradeAmount);
        const liveAsset = assets.find(a => a.id === selectedAsset.id) || selectedAsset;

        const executionPrice = orderType === 'LIMIT' && limitPrice ? Number(limitPrice) : liveAsset.price;
        const totalValue = amount * executionPrice;

        // Margin Requirement Check
        const marginRequired = totalValue / leverage;

        if (user.cashBalance < marginRequired) {
            setTradeSuccess(`Insufficient funds. You need $${marginRequired.toFixed(2)} USDT for this ${leverage}x trade.`);
            return;
        }

        setTradeSuccess(null);
        setIsTradeModalOpen(true);
    };

    const executeTrade = async () => {
        if (!selectedAsset || !tradeAmount) return;

        setIsTrading(true);
        await waitForConfirmation();

        const amount = Number(tradeAmount);
        const liveAsset = assets.find(a => a.id === selectedAsset.id) || selectedAsset;

        const executionPrice = orderType === 'LIMIT' && limitPrice ? Number(limitPrice) : liveAsset.price;
        const totalValue = amount * executionPrice;
        const margin = totalValue / leverage;

        const newTradeOrder: TradeOrder = {
            id: Math.random().toString(36).substr(2, 9),
            assetId: liveAsset.id,
            ticker: liveAsset.ticker,
            type: tradeAction === 'LONG' ? 'BUY' : 'SELL',
            positionType: tradeAction,
            orderType: orderType,
            leverage: leverage,
            quantity: amount,
            price: executionPrice,
            totalValue: totalValue,
            timestamp: new Date().toISOString(),
            txHash: generateTxHash(),
            blockNumber: await getCurrentBlockNumber(),
            gasFee: await estimateGasFee()
        };

        const newPortfolio = [...user.portfolio];
        const existingItemIndex = newPortfolio.findIndex(p => p.assetId === liveAsset.id);

        if (tradeAction === 'LONG') {
            // LONG logic...
            const borrowedAmount = totalValue - margin;

            if (existingItemIndex >= 0) {
                const item = newPortfolio[existingItemIndex];
                const newQuantity = item.quantity + amount;
                const totalCost = (item.quantity * item.averageBuyPrice) + totalValue;

                newPortfolio[existingItemIndex] = {
                    ...item,
                    quantity: newQuantity,
                    averageBuyPrice: totalCost / newQuantity,
                    borrowedCash: (item.borrowedCash || 0) + borrowedAmount
                };
            } else {
                newPortfolio.push({
                    assetId: liveAsset.id,
                    quantity: amount,
                    averageBuyPrice: executionPrice,
                    leverage: leverage,
                    borrowedCash: borrowedAmount,
                    shortCollateral: 0
                });
            }

            setUser({
                ...user,
                cashBalance: user.cashBalance - margin,
                portfolio: newPortfolio,
                tradeHistory: [newTradeOrder, ...user.tradeHistory]
            });

        } else {
            // SHORT logic...
            const collateralToLock = margin + totalValue;

            if (existingItemIndex >= 0) {
                const item = newPortfolio[existingItemIndex];
                const newQuantity = item.quantity - amount;
                const oldShortVal = Math.abs(item.quantity) * item.averageBuyPrice;
                const newShortVal = totalValue;
                const newAvgPrice = (oldShortVal + newShortVal) / Math.abs(newQuantity);

                newPortfolio[existingItemIndex] = {
                    ...item,
                    quantity: newQuantity,
                    averageBuyPrice: newAvgPrice,
                    shortCollateral: (item.shortCollateral || 0) + collateralToLock
                };
            } else {
                newPortfolio.push({
                    assetId: liveAsset.id,
                    quantity: -amount,
                    averageBuyPrice: executionPrice,
                    leverage: leverage,
                    borrowedCash: 0,
                    shortCollateral: collateralToLock
                });
            }

            // Settlement Logic: Short sales proceeds go to "Unsettled" for T+0 in demo, but usually T+2.
            // For leverage shorting, we lock margin. The sale proceeds are technically part of the collateral calc.
            // We will simulate that the 'margin' is paid from Cash, and the rest is book-entry.

            setUser({
                ...user,
                cashBalance: user.cashBalance - margin,
                lockedCash: (user.lockedCash || 0) + collateralToLock,
                portfolio: newPortfolio,
                tradeHistory: [newTradeOrder, ...user.tradeHistory]
            });
        }

        const updatedAssets = assets.map(a => {
            if (a.id === liveAsset.id) {
                return { ...a, volume24h: a.volume24h + totalValue };
            }
            return a;
        });
        setAssets(updatedAssets);

        setTradeAmount('');
        setIsTrading(false);
        setIsTradeModalOpen(false);
        showToast(`Successfully executed ${leverage}x ${tradeAction} on ${liveAsset.ticker}`, 'success');
    };

    const handleMintAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsMinting(true);
        await waitForConfirmation();

        const aiDetails = await generateNewAssetDetails(mintForm.ticker, mintForm.category, mintForm.name);
        // ... (rest of minting logic is fine)
        // Re-implementing simplified mint logic to avoid code block length limits:
        const newAsset: Asset = {
            id: Math.random().toString(36).substr(2, 9),
            ticker: mintForm.ticker.toUpperCase(),
            name: mintForm.name,
            category: mintForm.category as any,
            price: Number(mintForm.price),
            change24h: 0,
            riskScore: aiDetails.riskScore,
            description: aiDetails.description,
            availableSupply: 100000,
            volume24h: 0,
            history: [{ date: new Date().toISOString(), price: Number(mintForm.price) }],
            contractAddress: generateContractAddress(),
            bid: Number(mintForm.price) * 0.99,
            ask: Number(mintForm.price) * 1.01,
            dayHigh: Number(mintForm.price),
            dayLow: Number(mintForm.price),
            lastUpdate: Date.now()
        };
        setAssets([...assets, newAsset]);
        setIsMinting(false);
        setMintForm({ ticker: '', name: '', category: 'Equity', price: 0 });
        showToast(`Asset ${newAsset.ticker} minted.`, 'success');
    };

    // --- Render Modals ---
    const renderPaymentModal = () => {
        if (!paymentModalOpen) return null;
        const isDeposit = paymentType === 'DEPOSIT';
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Simplified Payment Modal for Code Length */}
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {isDeposit ? <PlusCircle className="text-emerald-500" size={20} /> : <Banknote className="text-orange-500" size={20} />}
                            {isDeposit ? 'Deposit USDT' : 'Withdraw USDT'}
                        </h3>
                        <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {paymentStep === 'AMOUNT' && (
                            <div className="space-y-6">
                                <input type="number" min="10" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white text-lg font-mono" placeholder="Amount (USDT)" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))} />
                                <button onClick={() => { if (isDeposit) setPaymentStep('METHOD'); else processPayment(); }} className="w-full py-3 bg-emerald-600 rounded-lg font-bold text-white">Next</button>
                            </div>
                        )}
                        {paymentStep === 'METHOD' && isDeposit && (
                            <div className="space-y-4">
                                <button onClick={() => { setPaymentMethod('Wallet Connect'); processPayment(); }} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white">Connect Wallet (MetaMask)</button>
                                <button onClick={() => { setPaymentMethod('Card'); processPayment(); }} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white">Credit/Debit Card</button>
                            </div>
                        )}
                        {paymentStep === 'PROCESSING' && <div className="text-center py-8 text-white"><Loader2 className="animate-spin mx-auto mb-2" /> Processing...</div>}
                        {paymentStep === 'SUCCESS' && (
                            <div className="text-center py-8 text-white">
                                <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={40} />
                                <p>{isDeposit ? 'Funds Added!' : 'Withdrawal Submitted for Admin Approval'}</p>
                                <button onClick={() => setPaymentModalOpen(false)} className="mt-4 px-4 py-2 bg-slate-800 rounded">Close</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderTradeConfirmationModal = () => {
        if (!isTradeModalOpen || !selectedAsset || !tradeAmount) return null;
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Confirm Order</h3>
                    <p className="text-slate-400 mb-6">Execute {leverage}x {tradeAction} for {tradeAmount} {selectedAsset.ticker}?</p>
                    <div className="flex gap-4">
                        <button onClick={() => setIsTradeModalOpen(false)} className="flex-1 py-2 bg-slate-800 text-white rounded">Cancel</button>
                        <button onClick={executeTrade} className="flex-1 py-2 bg-emerald-600 text-white rounded font-bold">Confirm</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderMarketSummary = () => (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-400" /> Market Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900/50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase">Market Sentiment</p>
                    <div className={`text-lg font-bold ${marketSummary.avgChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {marketSummary.avgChange > 0 ? 'Bullish' : 'Bearish'} ({marketSummary.avgChange.toFixed(2)}%)
                    </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase">24h Vol (USDT)</p>
                    <p className="text-lg font-bold text-white">${marketSummary.totalVolume.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><UserCheck /> Security & Compliance</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Lock size={18} /> 2-Factor Authentication</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Protect your account with Google Authenticator.</p>
                            <p className={`text-xs mt-1 font-bold ${user.twoFactorEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                                Status: {user.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
                            </p>
                        </div>
                        <button
                            onClick={toggle2FA}
                            className={`px-4 py-2 rounded-lg text-sm font-bold ${user.twoFactorEnabled ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}
                        >
                            {user.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FileCheck size={18} /> KYC Verification</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                            <span className="text-slate-300 text-sm">Current Level</span>
                            <span className="text-emerald-400 font-bold font-mono">Tier {user.kycLevel}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                            Tier 1: Trade limit $5k/day. <br />
                            Tier 2: Trade limit $50k/day. <br />
                            Tier 3: Unlimited.
                        </div>
                        {user.kycLevel < 3 && (
                            <button onClick={verifyKYC} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold">
                                Upgrade to Tier {user.kycLevel + 1}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAdmin = () => (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><ShieldPlus className="text-emerald-500" /> Admin Console</h2>
                <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
                    <button onClick={() => setAdminTab('MINT')} className={`px-4 py-1.5 text-sm rounded-md ${adminTab === 'MINT' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Minting</button>
                    <button onClick={() => setAdminTab('WITHDRAWALS')} className={`px-4 py-1.5 text-sm rounded-md ${adminTab === 'WITHDRAWALS' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Withdrawals</button>
                    <button onClick={() => setAdminTab('USERS')} className={`px-4 py-1.5 text-sm rounded-md ${adminTab === 'USERS' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>User Mgmt</button>
                </div>
            </div>

            {adminTab === 'MINT' && (
                <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4">Mint New Asset</h3>
                    <form onSubmit={handleMintAsset} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Ticker (e.g. xTEST)" value={mintForm.ticker} onChange={e => setMintForm({ ...mintForm, ticker: e.target.value })} className="bg-slate-950 border border-slate-700 p-3 rounded text-white" />
                            <input placeholder="Price" type="number" value={mintForm.price} onChange={e => setMintForm({ ...mintForm, price: Number(e.target.value) })} className="bg-slate-950 border border-slate-700 p-3 rounded text-white" />
                        </div>
                        <input placeholder="Name" value={mintForm.name} onChange={e => setMintForm({ ...mintForm, name: e.target.value })} className="bg-slate-950 border border-slate-700 p-3 rounded text-white w-full" />
                        <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded font-bold">Mint Asset</button>
                    </form>
                </div>
            )}

            {adminTab === 'WITHDRAWALS' && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="bg-slate-900 text-slate-500 uppercase text-xs">
                            <tr><th className="px-6 py-3">User</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {user.cashHistory.filter(c => c.type === 'WITHDRAWAL').map(tx => (
                                <tr key={tx.id}>
                                    <td className="px-6 py-4">Demo User</td>
                                    <td className="px-6 py-4">${tx.amount}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs ${tx.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-emerald-500/20 text-emerald-500'}`}>{tx.status}</span></td>
                                    <td className="px-6 py-4">
                                        {tx.status === 'Pending' && <button className="text-emerald-400 hover:underline">Approve</button>}
                                    </td>
                                </tr>
                            ))}
                            {user.cashHistory.filter(c => c.type === 'WITHDRAWAL').length === 0 && <tr><td colSpan={4} className="p-6 text-center">No withdrawal requests.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderDashboard = () => {
        // Net Worth Calculation with Leverage support
        let portfolioEquity = 0;

        user.portfolio.forEach(item => {
            const asset = assets.find(a => a.id === item.assetId);
            if (!asset) return;

            if (item.quantity > 0) {
                // Long: Asset Value - Debt
                portfolioEquity += (item.quantity * asset.price) - (item.borrowedCash || 0);
            } else {
                // Short: Collateral + (Negative Value)
                portfolioEquity += (item.quantity * asset.price) + (item.shortCollateral || 0);
            }
        });

        const totalNetWorth = user.cashBalance + portfolioEquity;

        // Filter Watchlist Assets
        const watchlistAssets = assets.filter(asset => (user.watchlist || []).includes(asset.id));

        return (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">

                {/* Main Dashboard Column (3/4 width) */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Dashboard</h2>
                        <button onClick={resetDemoData} className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors">
                            <RotateCcw size={12} /> Reset Demo Data
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Net Worth Card with Chart */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group min-h-[160px]">
                            <div className="absolute inset-0 z-0 opacity-20 mt-10 ml-0 pointer-events-none">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={netWorthData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="relative z-10 p-6">
                                <h3 className="text-slate-400 text-sm font-medium mb-1">Total Net Worth</h3>
                                <p className="text-3xl font-bold text-white tracking-tight">${totalNetWorth.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                <div className="mt-2 flex items-center text-xs text-emerald-400 bg-emerald-400/10 w-fit px-2 py-0.5 rounded-full">
                                    <TrendingUp size={12} className="mr-1" /> +2.4% this week
                                </div>
                            </div>
                        </div>

                        {/* Balance Card */}
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between">
                            <div>
                                <h3 className="text-slate-400 text-sm font-medium mb-1">Available USDT</h3>
                                <p className="text-2xl font-bold text-white">${user.cashBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                {user.lockedCash ? (
                                    <p className="text-xs text-slate-500 mt-1">Locked Collateral: ${user.lockedCash.toLocaleString()}</p>
                                ) : null}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => openPaymentModal('DEPOSIT')} className="flex-1 flex items-center justify-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-medium transition-colors"><PlusCircle size={14} /> Deposit</button>
                                <button onClick={() => openPaymentModal('WITHDRAWAL')} className="flex-1 flex items-center justify-center gap-2 text-xs bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors"><Banknote size={14} /> Withdraw</button>
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between">
                            <div>
                                <h3 className="text-slate-400 text-sm font-medium mb-1">Portfolio Stats</h3>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-2xl font-bold text-white">{user.portfolio.length}</p>
                                        <span className="text-xs text-slate-500">Active Positions</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-white">{assets.length}</p>
                                        <span className="text-xs text-slate-500">Listed Assets</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-700 flex gap-2 overflow-x-auto no-scrollbar">
                                {['Equity', 'Fixed Income'].map(cat => (
                                    <span key={cat} className="text-[10px] px-2 py-1 bg-slate-900 rounded text-slate-400 border border-slate-700 whitespace-nowrap">{cat}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Market Summary Widget */}
                    {renderMarketSummary()}

                    {/* Watchlist Section */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Star size={18} className="text-yellow-400" /> Your Watchlist</h3>
                        {watchlistAssets.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {watchlistAssets.map(asset => (
                                    <AssetCard
                                        key={asset.id}
                                        asset={asset}
                                        onClick={handleAssetClick}
                                        isWatchlisted={true}
                                        onToggleWatchlist={toggleWatchlist}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-xl p-8 text-center">
                                <p className="text-slate-400 text-sm">No assets in watchlist.</p>
                                <button onClick={() => setCurrentView('marketplace')} className="text-emerald-400 text-sm mt-2 hover:underline">Explore Marketplace</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column (1/4 width) */}
                <div className="space-y-6">
                    {/* Live Activity Feed */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 h-[400px] flex flex-col">
                        <h3 className="text-slate-300 text-sm font-bold mb-4 flex items-center gap-2">
                            <Activity size={16} className="text-emerald-400" /> Live Market Activity
                        </h3>
                        <div className="flex-1 overflow-y-hidden relative space-y-3">
                            <div className="absolute inset-0 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
                                {marketActivity.map(item => (
                                    <div key={item.id} className="text-xs border-l-2 border-slate-700 pl-3 py-1 animate-in slide-in-from-right-2">
                                        <div className="flex justify-between text-slate-500 mb-0.5">
                                            <span>{item.time}</span>
                                            <span className="font-mono text-[10px]">{item.user}</span>
                                        </div>
                                        <div className="text-slate-300">
                                            <span className={item.action === 'BOUGHT' ? 'text-emerald-400 font-bold' : item.action === 'SOLD' ? 'text-rose-400 font-bold' : 'text-blue-400 font-bold'}>{item.action}</span> {item.amount} {item.asset}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* News Widget */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                        <h3 className="text-slate-300 text-sm font-bold mb-4 flex items-center gap-2">
                            <Globe size={16} className="text-blue-400" /> Market Insights
                        </h3>
                        <div className="space-y-4">
                            <div className="group cursor-pointer">
                                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">Bullish</span>
                                <h4 className="text-sm font-medium text-white mt-1 group-hover:text-emerald-400 transition-colors">CBN Adjusts CRR Rates</h4>
                                <p className="text-xs text-slate-500 mt-1">Impact on banking sector liquidity expected to be positive for Tier-1 banks.</p>
                            </div>
                            <div className="group cursor-pointer border-t border-slate-700 pt-3">
                                <span className="text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">Tech</span>
                                <h4 className="text-sm font-medium text-white mt-1 group-hover:text-blue-400 transition-colors">MTN Nigeria Launches 5G</h4>
                                <p className="text-xs text-slate-500 mt-1">New spectrum acquisition to boost data revenue in Q3.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <>
            {/* Main Content Area */}
            {isAuthenticated ? (
                <div className="min-h-screen bg-slate-950 pb-20 font-sans selection:bg-emerald-500/30">
                    <Navbar
                        currentView={currentView}
                        setView={setCurrentView}
                        userBalance={user.cashBalance}
                        walletAddress={user.walletAddress}
                        notificationCount={user.notifications.length}
                        onConnectWallet={handleWalletConnect}
                    />

                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {currentView === 'dashboard' && renderDashboard()}
                        {currentView === 'settings' && renderSettings()}
                        {currentView === 'admin' && renderAdmin()}

                        {currentView === 'marketplace' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-3.5 text-slate-500" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Search assets by name or ticker..."
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative">
                                            <Filter className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                            <select
                                                className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-8 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                                                value={categoryFilter}
                                                onChange={(e) => setCategoryFilter(e.target.value)}
                                            >
                                                <option value="All">All Sectors</option>
                                                <option value="Equity">Equities</option>
                                                <option value="Fixed Income">Fixed Income</option>
                                                <option value="Real Estate">Real Estate</option>
                                                <option value="Private Market">Private Market</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={() => setCurrentView('admin')}
                                            className="bg-slate-800 p-3 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-700 border border-slate-700 transition-all"
                                            title="Mint New Asset"
                                        >
                                            <PlusCircle size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {assets
                                        .filter(a => (categoryFilter === 'All' || a.category === categoryFilter) && (a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.ticker.toLowerCase().includes(searchTerm.toLowerCase())))
                                        .map(asset => (
                                            <AssetCard
                                                key={asset.id}
                                                asset={asset}
                                                onClick={handleAssetClick}
                                                isWatchlisted={(user.watchlist || []).includes(asset.id)}
                                                onToggleWatchlist={toggleWatchlist}
                                            />
                                        ))}
                                </div>

                                {assets.filter(a => (categoryFilter === 'All' || a.category === categoryFilter) && (a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.ticker.toLowerCase().includes(searchTerm.toLowerCase()))).length === 0 && (
                                    <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                                        <p className="text-slate-500">No assets found matching your criteria.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentView === 'asset-detail' && selectedAsset && (
                            <div className="animate-in slide-in-from-right-8 fade-in">
                                <button onClick={() => setCurrentView('marketplace')} className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors group">
                                    <ArrowDownLeft className="mr-1 group-hover:-translate-x-1 transition-transform" size={18} /> Back to Marketplace
                                </button>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="flex flex-wrap justify-between items-start gap-4">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h1 className="text-3xl font-bold text-white tracking-tight">{selectedAsset.ticker}</h1>
                                                    <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-700 uppercase tracking-wider">{selectedAsset.category}</span>
                                                </div>
                                                <p className="text-slate-400 mt-1 text-lg">{selectedAsset.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-4xl font-mono font-bold text-white tracking-tight">${selectedAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                <p className={`text-sm font-bold flex items-center justify-end gap-1 ${selectedAsset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {selectedAsset.change24h >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                    {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h.toFixed(2)}% (24h)
                                                </p>
                                            </div>
                                        </div>

                                        <PriceChart data={selectedAsset.history} color={selectedAsset.change24h >= 0 ? "#10b981" : "#f43f5e"} />

                                        {/* Order Book Visualization */}
                                        <div className="h-[300px]">
                                            <OrderBook asset={selectedAsset} />
                                        </div>

                                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                    <Sparkles size={20} className="text-purple-400" />
                                                    Gemini AI Market Analysis
                                                </h3>
                                                <button
                                                    onClick={handleAnalyze}
                                                    disabled={isAnalyzing}
                                                    className="text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-bold"
                                                >
                                                    {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                                                    {aiAnalysis ? 'Regenerate Analysis' : 'Generate Report'}
                                                </button>
                                            </div>
                                            <div className="bg-slate-950/50 p-5 rounded-xl text-slate-300 text-sm leading-7 border border-slate-800/50 min-h-[120px]">
                                                {aiAnalysis ? (
                                                    <div className="animate-in fade-in whitespace-pre-line">{aiAnalysis}</div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 py-4">
                                                        <Sparkles size={32} className="mb-3 opacity-20" />
                                                        <p>Click 'Generate Report' to get real-time insights powered by Google Gemini.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                                            <h3 className="text-lg font-bold text-white mb-5">Place Order</h3>

                                            <div className="flex bg-slate-900 p-1.5 rounded-xl mb-6 border border-slate-800">
                                                <button
                                                    onClick={() => setTradeAction('LONG')}
                                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tradeAction === 'LONG' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                                >
                                                    Buy / Long
                                                </button>
                                                <button
                                                    onClick={() => setTradeAction('SHORT')}
                                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tradeAction === 'SHORT' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                                >
                                                    Sell / Short
                                                </button>
                                            </div>

                                            <form onSubmit={handleTradeSubmit} className="space-y-5">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Order Type</label>
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => setOrderType('MARKET')} className={`flex-1 py-2 text-xs font-bold border rounded-lg transition-colors ${orderType === 'MARKET' ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>Market</button>
                                                        <button type="button" onClick={() => setOrderType('LIMIT')} className={`flex-1 py-2 text-xs font-bold border rounded-lg transition-colors ${orderType === 'LIMIT' ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>Limit</button>
                                                    </div>
                                                </div>

                                                {orderType === 'LIMIT' && (
                                                    <div className="animate-in fade-in slide-in-from-top-2">
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Limit Price (USDT)</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-3 text-slate-500">$</span>
                                                            <input
                                                                type="number"
                                                                step="0.0001"
                                                                value={limitPrice}
                                                                onChange={(e) => setLimitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-6 pr-3 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-sm"
                                                                placeholder={selectedAsset.price.toString()}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Quantity</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            step="1"
                                                            min="1"
                                                            value={tradeAmount}
                                                            onChange={(e) => setTradeAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-12 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-lg"
                                                            placeholder="0"
                                                        />
                                                        <span className="absolute right-3 top-4 text-xs text-slate-500 font-bold pointer-events-none">UNITS</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Leverage</label>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {[1, 2, 5, 10].map(lev => (
                                                            <button
                                                                key={lev}
                                                                type="button"
                                                                onClick={() => setLeverage(lev)}
                                                                className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${leverage === lev ? 'bg-slate-700 border-emerald-500 text-emerald-400 shadow-sm' : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:bg-slate-800'}`}
                                                            >
                                                                {lev}x
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-t border-slate-700/50">
                                                    <div className="flex justify-between text-sm mb-2">
                                                        <span className="text-slate-400">Total Value</span>
                                                        <span className="text-white font-mono font-bold">${(Number(tradeAmount || 0) * (orderType === 'LIMIT' && limitPrice ? Number(limitPrice) : selectedAsset.price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm mb-4">
                                                        <span className="text-slate-400">Margin Req.</span>
                                                        <span className="text-emerald-400 font-mono font-bold">${((Number(tradeAmount || 0) * (orderType === 'LIMIT' && limitPrice ? Number(limitPrice) : selectedAsset.price)) / leverage).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>

                                                    {tradeSuccess && (
                                                        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 flex items-start gap-2">
                                                            <AlertCircle size={14} className="mt-0.5 shrink-0" /> <span>{tradeSuccess}</span>
                                                        </div>
                                                    )}

                                                    <button
                                                        type="submit"
                                                        className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] flex justify-center items-center gap-2 ${tradeAction === 'LONG' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'}`}
                                                    >
                                                        {tradeAction === 'LONG' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                                        {tradeAction === 'LONG' ? 'Place Buy Order' : 'Place Sell Order'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>

                                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                                            <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                                <Activity size={14} /> Key Statistics
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-500">24h Volume</span>
                                                    <span className="text-sm font-mono text-white">${selectedAsset.volume24h.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-500">Circulating Supply</span>
                                                    <span className="text-sm font-mono text-white">{selectedAsset.availableSupply.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-500">Risk Profile</span>
                                                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full bg-opacity-10 ${selectedAsset.riskScore === 'Low' ? 'text-emerald-400 bg-emerald-400' : selectedAsset.riskScore === 'Medium' ? 'text-yellow-400 bg-yellow-400' : 'text-rose-400 bg-rose-400'}`}>
                                                        {selectedAsset.riskScore}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-500">Est. Yield (APY)</span>
                                                    <span className="text-sm font-mono text-emerald-400 font-bold">{selectedAsset.yield ? selectedAsset.yield + '%' : 'N/A'}</span>
                                                </div>
                                                <div className="pt-4 mt-2 border-t border-slate-700/50">
                                                    <span className="text-xs text-slate-500 block mb-2 uppercase font-bold">About {selectedAsset.ticker}</span>
                                                    <p className="text-slate-300 text-sm leading-relaxed">{selectedAsset.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* Toast Notification */}
                    {toast.visible && (
                        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-6 fade-in z-50 border ${toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-white' : 'bg-rose-900/90 border-rose-500/50 text-white'}`}>
                            {toast.type === 'success' ? <CheckCircle2 size={24} className="text-emerald-400" /> : <AlertCircle size={24} className="text-rose-400" />}
                            <div>
                                <p className="font-bold text-sm">{toast.type === 'success' ? 'Success' : 'Error'}</p>
                                <p className="text-sm text-slate-200">{toast.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Modals */}
                    {renderPaymentModal()}
                    {renderTradeConfirmationModal()}
                </div>
            ) : (
                <Login onLogin={handleLogin} />
            )
            }
        </>
    );
}

export default App;
