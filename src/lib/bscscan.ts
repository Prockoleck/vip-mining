const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";
const BSCSCAN_WALLET = process.env.NEXT_PUBLIC_DEPOSIT_WALLET || "";
const USDT_BEP20 = "0x55d398326f99059fF775485246999027B3197955";
const IS_MOCK = !BSCSCAN_API_KEY || BSCSCAN_API_KEY === "mock";

export interface BscTransfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
}

export async function getRecentUsdtTransfers(): Promise<BscTransfer[]> {
  if (IS_MOCK) return getMockTransfers();

  const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${USDT_BEP20}&address=${BSCSCAN_WALLET}&sort=desc&page=1&offset=20&apikey=${BSCSCAN_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "1" || !data.result) return [];

  return data.result.map((tx: Record<string, string>) => ({
    hash: tx.hash,
    from: tx.from?.toLowerCase(),
    to: tx.to?.toLowerCase(),
    value: tx.value,
    timestamp: parseInt(tx.timeStamp),
  }));
}

// Mock mode: simulates a pending deposit that was "sent" 10 seconds ago
function getMockTransfers(): BscTransfer[] {
  const now = Math.floor(Date.now() / 1000);
  return [
    {
      hash: "0xMOCK" + Date.now().toString(16),
      from: "0x0000000000000000000000000000000000000001",
      to: BSCSCAN_WALLET.toLowerCase(),
      value: (10 * 1e18).toString(),
      timestamp: now - 10,
    },
  ];
}

export { IS_MOCK, BSCSCAN_WALLET };
