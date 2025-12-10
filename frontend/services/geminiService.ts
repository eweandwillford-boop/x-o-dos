
// import { GoogleGenAI } from "@google/genai";
import { Asset } from "../types";

// Initialize Gemini
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
// Allow arguments in the mock function to satisfy TypeScript
const ai = { models: { generateContent: async (_params: any) => ({ text: "Mock Analysis" }) } };

const MOCK_ANALYSES = [
  "This asset demonstrates strong fundamentals with a consistent upward trend in the last quarter. The issuer's recent expansion into new markets signals potential for long-term growth. However, investors should be mindful of sector-specific regulatory changes that could impact short-term volatility. Suitable for growth-oriented portfolios.",
  "A stable, income-generating asset ideal for conservative investors. The yield is attractive relative to current inflation rates, offering a reliable hedge. Risk factors are minimal, primarily limited to macroeconomic shifts affecting the broader fixed-income market.",
  "High-risk, high-reward opportunity. While recent performance has been volatile, the underlying technical indicators suggest a breakout potential. Recommended only for aggressive portfolios with a higher tolerance for short-term drawdowns.",
  "This asset offers a unique exposure to the sector. Revenue streams are tied to long-term contracts, offering a degree of insulation from short-term economic shocks. Technical analysis suggests it is currently trading near a support level."
];

export const generateAssetAnalysis = async (asset: Asset): Promise<string> => {
  if (!process.env.API_KEY) {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mock = MOCK_ANALYSES[asset.id.charCodeAt(0) % MOCK_ANALYSES.length];
    return `[DEMO MODE] \n${mock}`;
  }

  const prompt = `
    You are a senior financial analyst for the African and Nigerian capital markets.
    Analyze the following tokenized asset for a potential investor on the X-O-DOS platform.
    
    Asset Details:
    - Name: ${asset.name} (${asset.ticker})
    - Category: ${asset.category}
    - Current Price: ${asset.price} USDT
    - Yield: ${asset.yield ? asset.yield + '%' : 'N/A'}
    - Risk Score: ${asset.riskScore}
    - Description: ${asset.description}

    Provide a concise analysis (max 150 words) covering:
    1. The potential upside/value proposition.
    2. Key risks associated with this asset class in the current economic climate.
    3. Suitability for different types of investors (e.g., conservative vs. aggressive).
    
    Format as plain text with clear paragraph breaks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Analysis currently unavailable.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to generate analysis. Please try again later.";
  }
};

export const generateNewAssetDetails = async (ticker: string, category: string, baseName: string): Promise<{ description: string, riskScore: 'Low' | 'Medium' | 'High' }> => {
  if (!process.env.API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      description: `[DEMO] A newly listed ${category} asset backed by verifiable off-chain collateral. This asset tracks the performance of ${baseName} and is audited quarterly by top-tier firms.`,
      riskScore: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as any
    };
  }

  const prompt = `
    Generate a realistic financial description and risk assessment for a new tokenized asset being listed on X-O-DOS (Nigerian market).
    
    Asset Name: ${baseName}
    Ticker: ${ticker}
    Category: ${category}

    Return the response strictly as a JSON object with the following schema:
    {
        "description": "A professional 2-sentence description of the asset backing.",
        "riskScore": "Low" | "Medium" | "High"
    }
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return {
      description: "Standard tokenized asset representation with NAV-based pricing.",
      riskScore: 'Medium'
    };
  }
}
