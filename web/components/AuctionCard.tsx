import { Auction } from '../App';

interface Props {
  auction: Auction;
  citizenid: string;
  onBid: (auctionId: number) => void;
}

export function AuctionCard({ auction, citizenid, onBid }: Props) {
  const isSeller = auction.seller_citizenid === citizenid;
  const isHighestBidder = auction.current_bidder_citizenid === citizenid;
  
  const endsAtDate = new Date(auction.ends_at);
  const now = new Date();
  const timeRemaining = endsAtDate.getTime() - now.getTime();
  
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="relative bg-[#0d1625] rounded-xl p-4 flex items-center gap-4 border border-[#c8102e]/30 hover:border-[#c8102e]/50 transition-all hover:shadow-lg hover:shadow-[#c8102e]/10">
      {/* Left accent stripe */}
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-[#c8102e]" />

      <div className="w-14 h-14 bg-gradient-to-br from-[#c8102e] to-[#8a0a20] rounded-lg flex items-center justify-center border border-[#d8203e]/30 ml-2">
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11 15h2v2h-2zm0-8h2v6h-2zm1-4C6.47 3 2 7.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 3 12 3zm0 18c-4.96 0-9-4.04-9-9s4.04-9 9-9 9 4.04 9 9-4.04 9-9 9z"/>
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-bold text-lg">{auction.storage_name}</h3>
          {isHighestBidder && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#4ade80] text-[#0a1220]">
              WINNING
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5 text-[#6b8cae]">
            <svg className="w-3.5 h-3.5 text-[#4a6a8a]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            {auction.seller_name}
          </span>
          <span className="flex items-center gap-1.5 text-[#6b8cae]">
            Start: £{auction.starting_price.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5 text-[#ffd700] font-semibold">
            £{auction.current_bid.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5 text-[#ff6b6b] font-medium">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
          </span>
        </div>
      </div>

      {!isSeller && (
        <button
          onClick={() => onBid(auction.id)}
          className="px-6 py-3 bg-gradient-to-r from-[#012169] to-[#1e3a5f] text-white font-bold rounded-lg hover:from-[#0a2545] hover:to-[#2a4a6f] transition-all shadow-lg shadow-[#012169]/30"
        >
          Place Bid
        </button>
      )}

      {isSeller && (
        <div className="px-5 py-3 bg-[#c8102e]/10 text-[#ff6b6b] font-semibold rounded-lg border border-[#c8102e]/30 text-sm">
          Your Auction
        </div>
      )}
    </div>
  );
}
