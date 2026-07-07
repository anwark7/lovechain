import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import {
  deployFixture,
  createDeal,
  activeDeal,
  DEPOSIT,
  DURATION,
  Status,
  OutcomeEnum,
  Ctx,
} from "./helpers";

describe("Create / Accept / Cancel / Check-in", () => {
  let ctx: Ctx;
  beforeEach(async () => {
    ctx = await loadFixture(deployFixture);
  });

  describe("createLoveContract", () => {
    it("creates a PENDING_PARTNER contract and stores fields", async () => {
      const id = await createDeal(ctx);
      const c = await ctx.love.getContract(id);
      expect(c.partnerA).to.equal(ctx.alice.address);
      expect(c.partnerB).to.equal(ctx.bob.address);
      expect(c.depositA).to.equal(DEPOSIT);
      expect(c.depositB).to.equal(0n);
      expect(c.duration).to.equal(DURATION);
      expect(c.status).to.equal(Status.PENDING_PARTNER);
      expect(c.outcome).to.equal(OutcomeEnum.NONE);
    });

    it("emits ContractCreated and registers witnesses + rules", async () => {
      await expect(
        ctx.love
          .connect(ctx.alice)
          .createLoveContract(ctx.bob.address, DURATION, ctx.witnessAddrs, ["r1", "r2"], {
            value: DEPOSIT,
          })
      )
        .to.emit(ctx.love, "ContractCreated")
        .withArgs(0n, ctx.alice.address, ctx.bob.address, DEPOSIT, DURATION);
      const ws = await ctx.love.getWitnesses(0n);
      expect(ws).to.deep.equal(ctx.witnessAddrs);
      const rules = await ctx.love.getRules(0n);
      expect(rules.length).to.equal(2);
      expect(await ctx.love.isWitness(0n, ctx.witnessAddrs[0])).to.equal(true);
    });

    it("increments contract ids", async () => {
      await createDeal(ctx);
      await createDeal(ctx);
      expect(await ctx.love.nextContractId()).to.equal(2n);
    });

    it("reverts on zero / self partner", async () => {
      await expect(
        ctx.love
          .connect(ctx.alice)
          .createLoveContract(ethers.ZeroAddress, DURATION, ctx.witnessAddrs, [], { value: DEPOSIT })
      ).to.be.revertedWithCustomError(ctx.love, "InvalidPartner");
      await expect(
        ctx.love
          .connect(ctx.alice)
          .createLoveContract(ctx.alice.address, DURATION, ctx.witnessAddrs, [], { value: DEPOSIT })
      ).to.be.revertedWithCustomError(ctx.love, "InvalidPartner");
    });

    it("reverts on zero deposit / zero duration", async () => {
      await expect(
        ctx.love
          .connect(ctx.alice)
          .createLoveContract(ctx.bob.address, DURATION, ctx.witnessAddrs, [], { value: 0 })
      ).to.be.revertedWithCustomError(ctx.love, "InvalidDeposit");
      await expect(
        ctx.love
          .connect(ctx.alice)
          .createLoveContract(ctx.bob.address, 0, ctx.witnessAddrs, [], { value: DEPOSIT })
      ).to.be.revertedWithCustomError(ctx.love, "InvalidDuration");
    });

    it("reverts unless exactly 5 witnesses", async () => {
      await expect(
        ctx.love
          .connect(ctx.alice)
          .createLoveContract(ctx.bob.address, DURATION, ctx.witnessAddrs.slice(0, 4), [], {
            value: DEPOSIT,
          })
      ).to.be.revertedWithCustomError(ctx.love, "InvalidWitnesses");
    });

    it("reverts on duplicate witness", async () => {
      const dup = [...ctx.witnessAddrs];
      dup[4] = dup[0];
      await expect(
        ctx.love
          .connect(ctx.alice)
          .createLoveContract(ctx.bob.address, DURATION, dup, [], { value: DEPOSIT })
      ).to.be.revertedWithCustomError(ctx.love, "DuplicateWitness");
    });

    it("reverts if a witness is a partner", async () => {
      const bad = [...ctx.witnessAddrs];
      bad[0] = ctx.bob.address;
      await expect(
        ctx.love
          .connect(ctx.alice)
          .createLoveContract(ctx.bob.address, DURATION, bad, [], { value: DEPOSIT })
      ).to.be.revertedWithCustomError(ctx.love, "WitnessIsPartner");
    });
  });

  describe("acceptContract", () => {
    it("activates on matching deposit and sets check-ins", async () => {
      const id = await createDeal(ctx);
      await expect(ctx.love.connect(ctx.bob).acceptContract(id, { value: DEPOSIT }))
        .to.emit(ctx.love, "ContractAccepted")
        .withArgs(id, ctx.bob.address, DEPOSIT);
      const c = await ctx.love.getContract(id);
      expect(c.status).to.equal(Status.ACTIVE);
      expect(c.depositB).to.equal(DEPOSIT);
      expect(c.lastCheckInA).to.be.greaterThan(0n);
      expect(c.lastCheckInB).to.be.greaterThan(0n);
    });

    it("reverts if not partner B", async () => {
      const id = await createDeal(ctx);
      await expect(
        ctx.love.connect(ctx.outsider).acceptContract(id, { value: DEPOSIT })
      ).to.be.revertedWithCustomError(ctx.love, "NotPartner");
    });

    it("reverts on deposit mismatch", async () => {
      const id = await createDeal(ctx);
      await expect(
        ctx.love.connect(ctx.bob).acceptContract(id, { value: DEPOSIT / 2n })
      ).to.be.revertedWithCustomError(ctx.love, "DepositMismatch");
    });

    it("reverts if already active", async () => {
      const id = await activeDeal(ctx);
      await expect(
        ctx.love.connect(ctx.bob).acceptContract(id, { value: DEPOSIT })
      ).to.be.revertedWithCustomError(ctx.love, "WrongStatus");
    });

    it("reverts on unknown contract", async () => {
      await expect(
        ctx.love.connect(ctx.bob).acceptContract(999n, { value: DEPOSIT })
      ).to.be.revertedWithCustomError(ctx.love, "ContractNotFound");
    });
  });

  describe("cancelContract", () => {
    it("refunds A in full and moves to CANCELLED", async () => {
      const id = await createDeal(ctx);
      await expect(ctx.love.connect(ctx.alice).cancelContract(id))
        .to.emit(ctx.love, "ContractCancelled")
        .withArgs(id, ctx.alice.address, DEPOSIT);
      const c = await ctx.love.getContract(id);
      expect(c.status).to.equal(Status.CANCELLED);
      expect(await ctx.love.pendingWithdrawals(ctx.alice.address)).to.equal(DEPOSIT);
    });

    it("lets A withdraw the refund with no fee", async () => {
      const id = await createDeal(ctx);
      await ctx.love.connect(ctx.alice).cancelContract(id);
      await expect(ctx.love.connect(ctx.alice).withdraw()).to.changeEtherBalance(
        ctx.alice,
        DEPOSIT
      );
      expect(await ctx.love.accruedFees()).to.equal(0n);
    });

    it("reverts if not A", async () => {
      const id = await createDeal(ctx);
      await expect(
        ctx.love.connect(ctx.bob).cancelContract(id)
      ).to.be.revertedWithCustomError(ctx.love, "NotPartner");
    });

    it("reverts once active", async () => {
      const id = await activeDeal(ctx);
      await expect(
        ctx.love.connect(ctx.alice).cancelContract(id)
      ).to.be.revertedWithCustomError(ctx.love, "WrongStatus");
    });
  });

  describe("checkIn", () => {
    it("records per-partner timestamps", async () => {
      const id = await activeDeal(ctx);
      const before = (await ctx.love.getContract(id)).lastCheckInA;
      await ethers.provider.send("evm_increaseTime", [100]);
      await expect(ctx.love.connect(ctx.alice).checkIn(id)).to.emit(ctx.love, "CheckedIn");
      const after = (await ctx.love.getContract(id)).lastCheckInA;
      expect(after).to.be.greaterThan(before);
    });

    it("reverts for a non-partner", async () => {
      const id = await activeDeal(ctx);
      await expect(
        ctx.love.connect(ctx.outsider).checkIn(id)
      ).to.be.revertedWithCustomError(ctx.love, "NotPartner");
    });

    it("reverts when not active", async () => {
      const id = await createDeal(ctx);
      await expect(
        ctx.love.connect(ctx.alice).checkIn(id)
      ).to.be.revertedWithCustomError(ctx.love, "WrongStatus");
    });
  });
});
