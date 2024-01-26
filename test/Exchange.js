const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
};
describe('Token', () => {
  let deployer, feeAccount, exchange, token1, user1;
  const feePercent = 10;

  beforeEach(async () => {
    const Exchange = await ethers.getContractFactory('Exchange');
    const Token = await ethers.getContractFactory('Token');
    token1 = await Token.deploy('Dapp University', 'DAPP', 1000000);

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    feeAccount = accounts[1];
    user1 = accounts[2];

    let transaction = await token1
      .connect(deployer)
      .transfer(user1.address, tokens(100));
    await transaction.wait();
    exchange = await Exchange.deploy(feeAccount.address, feePercent);
  });

  describe('Deployment', async () => {
    it('tracks the fee account', async () => {
      expect(await exchange.feeAccount()).to.equal(feeAccount.address);
    });

    it('tracks the fee percent', async () => {
      expect(await exchange.feePercent()).to.equal(feePercent);
    });
  });

  describe('Deposit Tokens', async () => {
    let transaction, result;
    let amount = tokens(10);
    beforeEach(async () => {
      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount);
      transaction = await exchange
        .connect(user1)
        .depositToken(token1.address, amount);
      result = await transaction.wait();
    });

    describe('Success', async () => {
      it('tracks the token deposit', async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(amount);
        expect(await exchange.tokens(token1.address, user1.address)).to.equal(
          amount
        );
        expect(
          await exchange.balanceOf(token1.address, user1.address)
        ).to.equal(amount);
      });

      it('emits a Deposit event', async () => {
        const log = result.events[1];
        expect(log.event).to.equal('Deposit');

        const event = log.args;
        expect(event.token).to.equal(token1.address);
        expect(event.user).to.equal(user1.address);
        expect(event.amount.toString()).to.equal(amount.toString());
        expect(event.balance.toString()).to.equal(amount.toString());
      });
    });
    describe('Failure', async () => {
      it('fails when no tokens are approved', async () => {
        await expect(
          exchange.connect(user1).depositToken(token1.address, amount)
        ).to.be.revertedWith('Insufficient allowance');
      });
    });
  });

  describe('Withdraw Tokens', async () => {
    let transaction, result;
    let amount = tokens(10);

    describe('Success', async () => {
      beforeEach(async () => {
        // Approve tokens to exchange
        transaction = await token1
          .connect(user1)
          .approve(exchange.address, amount);

        // Deposit tokens to exchange
        transaction = await exchange
          .connect(user1)
          .depositToken(token1.address, amount);
        result = await transaction.wait();

        // Withdraw tokens from exchange
        transaction = await exchange
          .connect(user1)
          .withdrawToken(token1.address, amount);
        result = await transaction.wait();
      });

      it('withdraw token funds', async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(0);
        expect(await exchange.tokens(token1.address, user1.address)).to.equal(
          0
        );
        expect(
          await exchange.balanceOf(token1.address, user1.address)
        ).to.equal(0);
      });

      it('emits a Withdraw event', async () => {
        const log = result.events[1];
        expect(log.event).to.equal('Withdraw');

        const event = log.args;
        expect(event.token).to.equal(token1.address);
        expect(event.user).to.equal(user1.address);
        expect(event.amount).to.equal(amount);
        expect(event.balance).to.equal(0);
      });
    });
    describe('Failure', async () => {
      it('fails for insufficient balances', async () => {
        // Attempt to withdraw tokens without depositing any first
        await expect(
          exchange.connect(user1).depositToken(token1.address, amount)
        ).to.be.revertedWith('Insufficient allowance');
      });
    });
  });

  describe('Checking balances', async () => {
    let transaction, result;
    let amount = tokens(1);
    beforeEach(async () => {
      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount);
      transaction = await exchange
        .connect(user1)
        .depositToken(token1.address, amount);
      result = await transaction.wait();
    });

    it('returns user balance', async () => {
      expect(await token1.balanceOf(exchange.address)).to.equal(amount);
    });
  });
});
