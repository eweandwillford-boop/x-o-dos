import express from "express";
import dotenv from "dotenv";
import { ethers } from "ethers";
import { createRequire } from "module";

// import { ThirdwebStorage } from "@thirdweb-dev/storage";
const require = createRequire(import.meta.url);
const XoDosAbi = require("./abi/XoDos.json");

dotenv.config();
const app = express();
app.use(express.json());

// const storage = new ThirdwebStorage();

async function uploadJson(payload) {
  // const cid = await storage.upload(JSON.stringify(payload));
  // return `ipfs://${cid}`;
  return "ipfs://mock-cid";
}

const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, XoDosAbi, wallet);

import axios from "axios";

// ... imports

// Serve static files from the frontend app
const frontendPath = new URL('../frontend/dist', import.meta.url).pathname;
app.use(express.static(frontendPath));

app.post("/tasks", async (req, res) => {
  const { ipfsUri, reward, data } = req.body;
  try {
    let finalUri = ipfsUri;

    // If raw data is provided, upload it (mock) and get the URI
    if (!finalUri && data) {
      finalUri = await uploadJson(data);
    }

    if (!finalUri) {
      return res.status(400).json({ error: "Either ipfsUri or data must be provided" });
    }

    const tx = await contract.createTask(finalUri, { value: reward || 0 }); // reward is msg.value
    const receipt = await tx.wait();
    res.json({ txHash: receipt.transactionHash, ipfsUri: finalUri });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/tasks/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const task = await contract.tasks(id);

    // Convert Contract Struct to Object if needed, or stick to default array-like
    // Ethers v5 returns Result object which behaves like array + object

    let ipfsData = null;
    if (task.description && task.description.startsWith("ipfs://")) {
      try {
        const hash = task.description.replace("ipfs://", "");
        // Use a public gateway
        const response = await axios.get(`https://ipfs.io/ipfs/${hash}`);
        ipfsData = response.data;
      } catch (ipfsError) {
        console.warn("Failed to fetch IPFS data:", ipfsError.message);
      }
    }

    res.json({
      id: task.id.toString(),
      creator: task.creator,
      description: task.description,
      reward: task.reward.toString(),
      completed: task.completed,
      assignee: task.assignee,
      ipfsData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API running on ${port}`));
