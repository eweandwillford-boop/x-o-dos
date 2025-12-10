const hre = require("hardhat");

async function main() {
    const XoDos = await hre.ethers.getContractFactory("XoDos");
    const xodos = await XoDos.deploy();
    await xodos.deployed();
    console.log("XoDos deployed to:", xodos.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
