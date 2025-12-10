const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("XoDos", function () {
    let XoDos;
    let xoDos;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        XoDos = await ethers.getContractFactory("XoDos");
        xoDos = await XoDos.deploy();
        await xoDos.deployed();
    });

    it("Should create a task successfully", async function () {
        const reward = ethers.utils.parseEther("1.0");
        const tx = await xoDos.createTask("Task 1 Description", { value: reward });
        await tx.wait();

        const task = await xoDos.tasks(1);
        expect(task.id).to.equal(1);
        expect(task.creator).to.equal(owner.address);
        expect(task.description).to.equal("Task 1 Description");
        expect(task.reward).to.equal(reward);
        expect(task.completed).to.equal(false);
    });

    it("Should emit TaskCreated event", async function () {
        const reward = ethers.utils.parseEther("1.0");
        await expect(xoDos.createTask("Task 1 Description", { value: reward }))
            .to.emit(xoDos, "TaskCreated")
            .withArgs(1, owner.address, reward, "Task 1 Description");
    });

    it("Should allow task completion and transfer reward", async function () {
        const reward = ethers.utils.parseEther("1.0");
        await xoDos.createTask("Task 1 Description", { value: reward });

        // addr1 completes the task
        const initialBalance = await addr1.getBalance();
        const tx = await xoDos.connect(addr1).completeTask(1);
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

        const finalBalance = await addr1.getBalance();
        const task = await xoDos.tasks(1);

        expect(task.completed).to.equal(true);
        expect(task.assignee).to.equal(addr1.address);

        // Balance check: initial + reward - gas
        expect(finalBalance).to.equal(initialBalance.add(reward).sub(gasUsed));
    });

    it("Should fail if creator tries to complete their own task", async function () {
        const reward = ethers.utils.parseEther("1.0");
        await xoDos.createTask("Task 1 Description", { value: reward });

        await expect(xoDos.completeTask(1)).to.be.revertedWith("Creator cannot complete their own task");
    });

    it("Should retrieve tasks by user", async function () {
        await xoDos.createTask("Task 1", { value: ethers.utils.parseEther("1") });
        await xoDos.connect(addr1).createTask("Task 2", { value: ethers.utils.parseEther("1") });

        // Owner created Task 1
        const ownerTasks = await xoDos.getTasksByUser(owner.address);
        expect(ownerTasks.length).to.equal(1);
        expect(ownerTasks[0]).to.equal(1);

        // Addr1 created Task 2
        const addr1Tasks = await xoDos.getTasksByUser(addr1.address);
        expect(addr1Tasks.length).to.equal(1);
        expect(addr1Tasks[0]).to.equal(2);
    });
});
