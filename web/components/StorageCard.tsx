import { Storage } from '../App';

interface Props {
  storage: Storage;
  citizenid: string;
  onBuy: (id: number) => void;
  onCreateAuction: (id: number) => void;
}

export function StorageCard({ storage, citizenid, onBuy, onCreateAuction }: Props) {
  const isOwned = storage.owner_citizenid === citizenid;
  const isAvailable = !storage.owner_citizenid;
  const hasAuction = !!storage.auction_id;

  return (
    <div className="relative bg-[#0d1625] rounded-xl p-4 flex items-center gap-4 border border-[#1e3a5f] hover:border-[#2a4a6f] transition-all hover:shadow-lg hover:shadow-[#012169]/10">
      {/* Left accent stripe */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${
        hasAuction ? 'bg-[#c8102e]' : isOwned ? 'bg-[#012169]' : 'bg-[#4ade80]'
      }`} />

      <div className="w-14 h-14 bg-gradient-to-br from-[#012169] to-[#1e3a5f] rounded-lg flex items-center justify-center border border-[#2a4a6f] ml-2">
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 6h16v2H4V6zm0 4h16v10H4V10zm2 2v6h12v-6H6zm2 2h8v2H8v-2z"/>
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-bold text-lg">{storage.name}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            hasAuction
              ? 'bg-[#c8102e] text-white'
              : isOwned
                ? 'bg-[#012169] text-white'
                : 'bg-[#4ade80] text-[#0a1220]'
          }`}>
            {hasAuction ? 'ON AUCTION' : isOwned ? 'OWNED' : 'AVAILABLE'}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5 text-[#6b8cae]">
            <span className="text-[#4a6a8a]">#</span>
            {storage.id}
          </span>
          {storage.owner_name && (
            <span className="flex items-center gap-1.5 text-[#6b8cae]">
              <svg className="w-3.5 h-3.5 text-[#4a6a8a]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              {storage.owner_name}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[#ffd700] font-semibold">
            £{storage.price.toLocaleString()}
          </span>
        </div>
      </div>

      {isAvailable && !hasAuction && (
        <button
          onClick={() => onBuy(storage.id)}
          className="px-6 py-3 bg-gradient-to-r from-[#012169] to-[#1e3a5f] text-white font-bold rounded-lg hover:from-[#0a2545] hover:to-[#2a4a6f] transition-all shadow-lg shadow-[#012169]/30"
        >
          Purchase
        </button>
      )}

      {isOwned && !hasAuction && (
        <button
          onClick={() => onCreateAuction(storage.id)}
          className="px-6 py-3 bg-gradient-to-r from-[#c8102e] to-[#a00c24] text-white font-bold rounded-lg hover:from-[#d8203e] hover:to-[#b80e2a] transition-all shadow-lg shadow-[#c8102e]/30 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 15h2v2h-2zm0-8h2v6h-2zm1-4C6.47 3 2 7.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 3 12 3zm0 18c-4.96 0-9-4.04-9-9s4.04-9 9-9 9 4.04 9 9-4.04 9-9 9z"/>
          </svg>
          Auction
        </button>
      )}
    </div>
  );
}
