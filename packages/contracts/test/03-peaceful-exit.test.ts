import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  deployFixture,
  activeDeal,
  increaseTime,
  Status,
  OutcomeEnum,
  COOLING,
  DEPOSIT,
  netAfterFee,
  Ctx,
} from "./helpers";

const PEACEFUL_FEE_BPS = 50n;

describe("Peaceful Exit", () => {
  let ctx: Ctx;
  beforeEach(async () => {
    ctx = await loadFixture(deployFixture);
  });

  it("request -> approve -> cooling -> finalize returns deposits net 0.5%", async () => {
    const id = await activeDeal(ctx);

    await expect(ctx.love.connect(ctx.alice).requestPeacefulExit(id))
      .to.emit(ctx.love, "PeacefulExitRequested")
      .withArgs(id, ctx.alice.address);
    expect((await ctx.love.getContract(id)).status).to.equal(Status.BREAKUP_REQUESTED);

    await expect(ctx.love.connect(ctx.bob).approvePeacefulExit(id)).to.emit(
      ctx.love,
      "PeacefulExitApproved"
    );
    expect((await ctx.love.getContract(id)).status).to.equal(Status.COOLING_PERIOD);

    // Cannot finalize before the cooling period elapses.
    await expect(
      ctx.love.finalizePeacefulExit(id)
    ).to.be.revertedWithCustomError(ctx.love, "WindowStillOpen");

    await increaseTime(COOLING + 1);
    await expect(ctx.love.finalizePeacefulExit(id)).to.emit(ctx.love, "PeacefulExitFinalized");

    const c = await ctx.love.getContract(id);
    expect(c.status).to.equal(Status.RESOLVED);
    expect(c.outcome).to.equal(OutcomeEnum.PEACEFUL);

    const expected = netAfterFee(DEPOSIT, PEACEFUL_FEE_BPS);
    await ctx.love.connect(ctx.alice).claimPayout(id);
    await expect(ctx.love.connect(ctx.alice).withdraw()).to.changeEtherBalance(ctx.alice, expected);
    await ctx.love.connect(ctx.bob).claimPayout(id);
    await expect(ctx.love.connect(ctx.bob).withdraw()).to.changeEtherBalance(ctx.bob, expected);
  });

  it("the requester cannot self-approve", async () => {
    const id = await activeDeal(ctx);
    await ctx.love.connect(ctx.alice).requestPeacefulExit(id);
    await expect(
      ctx.love.connect(ctx.alice).approvePeacefulExit(id)
    ).to.be.revertedWithCustomError(ctx.love, "NotPartner");
  });

  it("only a partner can request / approve", async () => {
    const id = await activeDeal(ctx);
    await expect(
      ctx.love.connect(ctx.outsider).requestPeacefulExit(id)
    ).to.be.revertedWithCustomError(ctx.love, "NotPartner");
    await ctx.love.connect(ctx.alice).requestPeacefulExit(id);
    await expect(
      ctx.love.connect(ctx.outsider).approvePeacefulExit(id)
    ).to.be.revertedWithCustomError(ctx.love, "NotPartner");
  });

  it("cannot request unless ACTIVE", async () => {
    const id = await activeDeal(ctx);
    await ctx.love.connect(ctx.alice).requestPeacefulExit(id);
    await expect(
      ctx.love.connect(ctx.bob).requestPeacefulExit(id)
    ).to.be.revertedWithCustomError(ctx.love, "WrongStatus");
  });

  it("either partner may be the requester (bob requests, alice approves)", async () => {
    const id = await activeDeal(ctx);
    await ctx.love.connect(ctx.bob).requestPeacefulExit(id);
    await ctx.love.connect(ctx.alice).approvePeacefulExit(id);
    expect((await ctx.love.getContract(id)).status).to.equal(Status.COOLING_PERIOD);
  });
});
