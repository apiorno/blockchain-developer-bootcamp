import { useEffect } from 'react';
import config from '../config.json';
import { useDispatch } from 'react-redux';
import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadExchange,
} from '../store/interactions';

function App() {
  const dispatch = useDispatch();
  const loadBlockchainData = async () => {
    // Connect to the blockchain
    const provider = loadProvider(dispatch);

    // Fetch current network's chainId
    const chainId = await loadNetwork(provider, dispatch);

    // Fetch current account & balance
    await loadAccount(provider, dispatch);

    // Load token Smart Contracts
    const chain = config[chainId];
    const Dapp = chain.Dapp.address;
    const mETH = chain.mETH.address;
    await loadTokens(provider, [Dapp, mETH], dispatch);

    // Load exchange Contract
    const exchange = chain.exchange.address;
    await loadExchange(provider, exchange, dispatch);
  };

  useEffect(() => {
    loadBlockchainData();
  });
  return (
    <div>
      {/* Navbar */}

      <main className="exchange grid">
        <section className="exchange__section--left grid">
          {/* Markets */}

          {/* Balance */}

          {/* Order */}
        </section>
        <section className="exchange__section--right grid">
          {/* PriceChart */}

          {/* Transactions */}

          {/* Trades */}

          {/* OrderBook */}
        </section>
      </main>

      {/* Alert */}
    </div>
  );
}

export default App;
