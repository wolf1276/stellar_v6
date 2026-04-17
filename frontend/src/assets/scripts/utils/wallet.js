import { getAddress, getNetworkDetails, isConnected, requestAccess } from '@stellar/freighter-api';

const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

export const connectFreighter = async () => {
  const connection = await isConnected();
  if (connection.error || !connection.isConnected) {
    throw new Error(connection.error || 'Freighter extension not detected.');
  }

  const access = await requestAccess();
  if (access.error) throw new Error(access.error);

  const addressResponse = await getAddress();
  if (addressResponse.error || !addressResponse.address) {
    throw new Error(addressResponse.error || 'Unable to read wallet address.');
  }

  const network = await getNetworkDetails();
  if (network.error) throw new Error(network.error);
  
  if (network.networkPassphrase !== TESTNET_PASSPHRASE) {
    throw new Error(`Freighter must be on Stellar testnet.`);
  }

  return {
    address: addressResponse.address,
    network: network.network,
  };
};
