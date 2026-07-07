import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import {
  deployFixture,
  activeDeal,
  increaseTime,
  COOLING,
  DEPOSIT,
  netAfterFee,
  Ctx,
} from "./helpers";

const PEACEFUL_FEE_BPS = 50n;

/** Drive a deal to a resolved peaceful exit. */
async function peacefulResolved(ctx: Ctx): Promise<bigint> {
  const id = await activeDeal(ctx);
  await ctx.love.connect(ctx.alice).requestPeacefulExit(id);
  await ctx.love.connect(ctx.bob).approvePeacefulExit(id);
  await increaseTime(COOLING + 1);
  await ctx.love.finalizePeacefulExit(id);
  return id;
}

describe("Payout, withdrawals, and fees", () => {
  let ctx: Ctx;
  beforeEach(async () => {
    ctx = await loadFixture(deployFixture);
  });

  describe("claimPayout guards", () => {
    it("prevents double claim per partner", async () => {
      const id = await peacefulResolved(ctx);
      await ctx.love.connect(ctx.alice).claimPayout(id);
      await expect(
        ctx.love.connect(ctx.alice).claimPayout(id)
      ).to.be.revertedWithCustomError(ctx.love, "AlreadyClaimed");
    });

    it("only partners can claim", async () => {
      const id = await peacefulResolved(ctx);
      await expect(
        ctx.love.connect(ctx.outsider).claimPayout(id)
      ).to.be.revertedWithCustomError(ctx.love, "NotPartner");
    });

    it("cannot claim before resolution", async () => {
      const id = await activeDeal(ctx);
      await expect(
        ctx.love.connect(ctx.alice).claimPayout(id)
      ).to.be.revertedWithCustomError(ctx.love, "WrongStatus");
    });
  });

  describe("withdraw", () => {
    it("reverts with nothing to withdraw", async () => {
      await expect(
        ctx.love.connect(ctx.outsider).withdraw()
      ).to.be.revertedWithCustomError(ctx.love, "NothingToWithdraw");
    });

    it("zeroes the balance after withdrawing", async () => {
      const id = await peacefulResolved(ctx);
      await ctx.love.connect(ctx.alice).claimPayout(id);
      await ctx.love.connect(ctx.alice).withdraw();
      expect(await ctx.love.pendingWithdrawals(ctx.alice.address)).to.equal(0n);
    });
  });

  describe("fees", () => {
    it("accrues fees to the owner and lets the owner withdraw them", async () => {
      const id = await peacefulResolved(ctx);
      await ctx.love.connect(ctx.alice).claimPayout(id);
      await ctx.love.connect(ctx.bob).claimPayout(id);

      const feePerSide = (DEPOSIT * PEACEFUL_FEE_BPS) / 10_000n;
      const totalFee = feePerSide * 2n;
      expect(await ctx.love.accruedFees()).to.equal(totalFee);

      await expect(
        ctx.love.connect(ctx.owner).withdrawFees(ctx.owner.address)
      ).to.changeEtherBalance(ctx.owner, totalFee);
      expect(await ctx.love.accruedFees()).to.equal(0n);
    });

    it("only the owner can withdraw fees", async () => {
      const id = await peacefulResolved(ctx);
      await ctx.love.connect(ctx.alice).claimPayout(id);
      await expect(
        ctx.love.connect(ctx.alice).withdrawFees(ctx.alice.address)
      ).to.be.revertedWithCustomError(ctx.love, "OwnableUnauthorizedAccount");
    });

    it("reverts fee withdrawal when there are no fees", async () => {
      await expect(
        ctx.love.connect(ctx.owner).withdrawFees(ctx.owner.address)
      ).to.be.revertedWithCustomError(ctx.love, "NothingToWithdraw");
    });
  });

  describe("value conservation", () => {
    it("total paid out + fees equals total deposited (peaceful)", async () => {
      const id = await peacefulResolved(ctx);
      await ctx.love.connect(ctx.alice).claimPayout(id);
      await ctx.love.connect(ctx.bob).claimPayout(id);

      const aliceOut = await ctx.love.pendingWithdrawals(ctx.alice.address);
      const bobOut = await ctx.love.pendingWithdrawals(ctx.bob.address);
      const fees = await ctx.love.accruedFees();
      expect(aliceOut + bobOut + fees).to.equal(DEPOSIT * 2n);
      // Contract holds exactly what is owed.
      expect(await ethers.provider.getBalance(await ctx.love.getAddress())).to.equal(DEPOSIT * 2n);
    });
  });

  describe("owner configuration", () => {
    it("owner can update breachAwardBps within bounds", async () => {
      await expect(ctx.love.connect(ctx.owner).setBreachAwardBps(5000)).to.emit(
        ctx.love,
        "BreachAwardBpsUpdated"
      );
      expect(await ctx.love.breachAwardBps()).to.equal(5000n);
      await expect(
        ctx.love.connect(ctx.owner).setBreachAwardBps(10001)
      ).to.be.revertedWithCustomError(ctx.love, "InvalidBps");
    });

    it("non-owner cannot update config", async () => {
      await expect(
        ctx.love.connect(ctx.alice).setBreachAwardBps(5000)
      ).to.be.revertedWithCustomError(ctx.love, "OwnableUnauthorizedAccount");
      await expect(
        ctx.love.connect(ctx.alice).setWindows(1, 2, 3)
      ).to.be.revertedWithCustomError(ctx.love, "OwnableUnauthorizedAccount");
    });

    it("claimableAmount returns 0 for non-parties and already-claimed", async () => {
      const id = await peacefulResolved(ctx);
      expect(await ctx.love.claimableAmount(id, ctx.outsider.address)).to.equal(0n);
      await ctx.love.connect(ctx.alice).claimPayout(id);
      expect(await ctx.love.claimableAmount(id, ctx.alice.address)).to.equal(0n);
    });
  });
});
