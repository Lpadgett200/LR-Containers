import { useState, useCallback, useEffect } from 'react';
import { isDebug, useNuiEvent, fetchNui } from './hooks/useNui';
import { StorageCard } from './components/StorageCard';
import { AuctionCard } from './components/AuctionCard';

export interface Storage {
  id: number;
  name: string;
  owner_citizenid: string | null | false;
  owner_name: string | null | false;
  price: number;
  auction_id: number | null | false;
  current_bid: number | null | false;
  ends_at: string | null | false;
  coords?: { x: number; y: number; z: number };
}

export interface Auction {
  id: number;
  storage_id: number;
  storage_name: string;
  seller_citizenid: string;
  seller_name: string;
  starting_price: number;
  current_bid: number;
  current_bidder_citizenid: string | null;
  current_bidder_name: string | null;
  ends_at: string;
}

export interface Money {
  cash: number;
  bank: number;
}

type Tab = 'storages' | 'auctions';
type Filter = 'all' | 'owned' | 'available';

export default function App() {
  const [visible, setVisible] = useState(isDebug);
  const [tab, setTab] = useState<Tab>('storages');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [storages, setStorages] = useState<Storage[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [citizenid, setCitizenid] = useState('');
  const [money, setMoney] = useState<Money>({ cash: 0, bank: 0 });

  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedStorageId, setSelectedStorageId] = useState<number | null>(null);
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);
  const [auctionPrice, setAuctionPrice] = useState('');
  const [bidAmount, setBidAmount] = useState('');

  useNuiEvent<{ storages: Storage[]; citizenid: string; money: Money }>('open', (data) => {
    setStorages(data.storages);
    setCitizenid(data.citizenid);
    setMoney(data.money);
    setVisible(true);
  });

  useNuiEvent('close', () => setVisible(false));

  useNuiEvent<{ auctions: Auction[]; citizenid: string; money: Money }>('receiveAuctions', (data) => {
    setAuctions(data.auctions);
    setCitizenid(data.citizenid);
    setMoney(data.money);
  });

  const handleClose = useCallback(() => {
    setVisible(false);
    fetchNui('close', {}, { success: true });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  const handleBuy = async (storageId: number) => {
    await fetchNui('buyStorage', { storageId }, { success: true });
    await fetchNui('getStorages', {}, { success: true });
  };

  const handleCreateAuction = (storageId: number) => {
    setSelectedStorageId(storageId);
    setShowAuctionModal(true);
  };

  const handleSubmitAuction = async () => {
    if (!selectedStorageId || !auctionPrice) return;
    await fetchNui('createAuction', { storageId: selectedStorageId, startingPrice: parseInt(auctionPrice) }, { success: true });
    setShowAuctionModal(false);
    setAuctionPrice('');
    await fetchNui('getStorages', {}, { success: true });
  };

  const handleBid = (auctionId: number) => {
    setSelectedAuctionId(auctionId);
    setShowBidModal(true);
  };

  const handleSubmitBid = async () => {
    if (!selectedAuctionId || !bidAmount) return;
    await fetchNui('placeBid', { auctionId: selectedAuctionId, bidAmount: parseInt(bidAmount) }, { success: true });
    setShowBidModal(false);
    setBidAmount('');
    await fetchNui('getAuctions', {}, { success: true });
  };

  const loadAuctions = async () => {
    await fetchNui('getAuctions', {}, {
      auctions: isDebug ? mockAuctions : [],
      citizenid: citizenid,
      money: money
    });
  };

  const filteredStorages = storages.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.owner_name?.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (filter === 'owned') return s.owner_citizenid === citizenid;
    if (filter === 'available') return !s.owner_citizenid;
    return true;
  });

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, rgba(10, 35, 80, 0.85) 0%, rgba(180, 30, 30, 0.75) 50%, rgba(10, 35, 80, 0.85) 100%)' }}>
      {/* Union Jack pattern overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        background: `
          linear-gradient(to bottom, transparent 48%, white 48%, white 52%, transparent 52%),
          linear-gradient(to right, transparent 48%, white 48%, white 52%, transparent 52%),
          linear-gradient(135deg, transparent 42%, white 42%, white 45%, transparent 45%),
          linear-gradient(225deg, transparent 42%, white 42%, white 45%, transparent 45%),
          linear-gradient(45deg, transparent 42%, #c8102e 42%, #c8102e 45%, transparent 45%),
          linear-gradient(-45deg, transparent 42%, #c8102e 42%, #c8102e 45%, transparent 45%)
        `
      }} />

      <div className="w-[720px] max-h-[88vh] bg-[#0a1220] rounded-xl overflow-hidden flex flex-col shadow-2xl border-2 border-[#1e3a5f]">
        {/* Header with UK stripe */}
        <div className="relative">
          <div className="h-1 flex">
            <div className="w-1/3 bg-[#012169]" />
            <div className="w-1/3 bg-white" />
            <div className="w-1/3 bg-[#c8102e]" />
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0a1220] via-[#0f1a2e] to-[#0a1220]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#012169] to-[#1e3a5f] border border-[#2a4a6f]">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 6h16v2H4V6zm0 4h16v10H4V10zm2 2v6h12v-6H6zm2 2h8v2H8v-2z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-white font-bold text-xl tracking-wide">Storage Units</h1>
                <p className="text-[#6b8cae] text-xs">United Kingdom</p>
              </div>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => { setTab('storages'); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                  tab === 'storages'
                    ? 'bg-gradient-to-r from-[#012169] to-[#1e3a5f] text-white shadow-lg border border-[#2a4a6f]'
                    : 'text-[#6b8cae] hover:text-white hover:bg-[#1e3a5f]/30'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 6h16v2H4V6zm0 4h16v10H4V10zm2 2v6h12v-6H6zm2 2h8v2H8v-2z"/>
                </svg>
                Storages
              </button>
              <button
                onClick={() => { setTab('auctions'); loadAuctions(); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                  tab === 'auctions'
                    ? 'bg-gradient-to-r from-[#c8102e] to-[#a00c24] text-white shadow-lg border border-[#d8203e]'
                    : 'text-[#6b8cae] hover:text-white hover:bg-[#c8102e]/20'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11 15h2v2h-2zm0-8h2v6h-2zm1-4C6.47 3 2 7.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 3 12 3zm0 18c-4.96 0-9-4.04-9-9s4.04-9 9-9 9 4.04 9 9-4.04 9-9 9z"/>
                </svg>
                Auctions
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f1a2e] border border-[#1e3a5f]">
                <span className="text-sm font-semibold text-[#ffd700]">£{money.bank.toLocaleString()}</span>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 flex items-center justify-center text-[#6b8cae] hover:text-white hover:bg-[#c8102e]/30 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-4 border-y border-[#1e3a5f]/50 bg-[#0d1625]">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#6b8cae]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search storages..."
                className="w-full bg-[#0a1220] text-white pl-11 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#012169] border border-[#1e3a5f] focus:border-[#012169]"
              />
            </div>

            {tab === 'storages' && (
              <div className="flex gap-2">
                {(['all', 'owned', 'available'] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      filter === f
                        ? 'bg-gradient-to-r from-[#012169] to-[#1e3a5f] text-white shadow-lg'
                        : 'bg-[#0a1220] text-[#6b8cae] border border-[#1e3a5f] hover:border-[#012169] hover:text-white'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <style>{`
          .storage-list::-webkit-scrollbar { width: 8px; }
          .storage-list::-webkit-scrollbar-track { background: rgba(10, 18, 32, 0.9); border-radius: 4px; }
          .storage-list::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #012169 0%, #1e3a5f 100%); border-radius: 4px; }
          .storage-list::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #1e3a5f 0%, #2a4a6f 100%); }
          .storage-list { scrollbar-width: thin; scrollbar-color: #012169 rgba(10, 18, 32, 0.9); }
        `}</style>
        <div className="storage-list flex-1 overflow-y-auto p-5 space-y-3 bg-gradient-to-b from-[#0d1625] to-[#0a1220]">
          {tab === 'storages' && filteredStorages.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-[#1e3a5f] mb-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4V6zm0 4h16v10H4V10zm2 2v6h12v-6H6zm2 2h8v2H8v-2z"/>
              </svg>
              <p className="text-[#6b8cae] text-lg">No storages found</p>
            </div>
          )}

          {tab === 'storages' && filteredStorages.map((storage) => (
            <StorageCard
              key={storage.id}
              storage={storage}
              citizenid={citizenid}
              onBuy={handleBuy}
              onCreateAuction={handleCreateAuction}
            />
          ))}

          {tab === 'auctions' && auctions.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-[#c8102e]/40 mb-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 15h2v2h-2zm0-8h2v6h-2zm1-4C6.47 3 2 7.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 3 12 3zm0 18c-4.96 0-9-4.04-9-9s4.04-9 9-9 9 4.04 9 9-4.04 9-9 9z"/>
              </svg>
              <p className="text-[#6b8cae] text-lg">No active auctions</p>
            </div>
          )}

          {tab === 'auctions' && auctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              citizenid={citizenid}
              onBid={handleBid}
            />
          ))}
        </div>

        {/* Footer stripe */}
        <div className="h-1 flex">
          <div className="w-1/3 bg-[#012169]" />
          <div className="w-1/3 bg-white" />
          <div className="w-1/3 bg-[#c8102e]" />
        </div>
      </div>

      {/* Create Auction Modal */}
      {showAuctionModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="bg-[#0a1220] rounded-xl w-[340px] border-2 border-[#c8102e] shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#012169] via-white to-[#c8102e]" />
            <div className="p-6">
              <h3 className="text-white font-bold text-xl mb-1">Create Auction</h3>
              <p className="text-[#6b8cae] text-sm mb-5">Set a starting price for your storage unit</p>
              <div className="relative mb-5">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ffd700] font-semibold">£</span>
                <input
                  type="number"
                  value={auctionPrice}
                  onChange={(e) => setAuctionPrice(e.target.value)}
                  placeholder="Starting price..."
                  className="w-full bg-[#0d1625] text-white pl-9 pr-4 py-3.5 rounded-lg border border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:border-[#c8102e]"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAuctionModal(false)}
                  className="flex-1 py-3 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4a6f] transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAuction}
                  className="flex-1 py-3 bg-gradient-to-r from-[#c8102e] to-[#a00c24] text-white rounded-lg hover:from-[#d8203e] hover:to-[#b80e2a] transition-colors font-semibold"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Place Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="bg-[#0a1220] rounded-xl w-[340px] border-2 border-[#012169] shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#012169] via-white to-[#c8102e]" />
            <div className="p-6">
              <h3 className="text-white font-bold text-xl mb-1">Place Bid</h3>
              <p className="text-[#6b8cae] text-sm mb-5">Enter your bid amount</p>
              <div className="relative mb-5">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ffd700] font-semibold">£</span>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Your bid amount..."
                  className="w-full bg-[#0d1625] text-white pl-9 pr-4 py-3.5 rounded-lg border border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#012169] focus:border-[#012169]"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBidModal(false)}
                  className="flex-1 py-3 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4a6f] transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitBid}
                  className="flex-1 py-3 bg-gradient-to-r from-[#012169] to-[#1e3a5f] text-white rounded-lg hover:from-[#0a2545] hover:to-[#2a4a6f] transition-colors font-semibold"
                >
                  Place Bid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data for browser preview
const mockStorages: Storage[] = [
  { id: 1, name: 'A 001', owner_citizenid: null, owner_name: null, price: 300, auction_id: null, current_bid: null, ends_at: null },
  { id: 2, name: 'A 002', owner_citizenid: null, owner_name: null, price: 500, auction_id: null, current_bid: null, ends_at: null },
  { id: 3, name: 'A 003', owner_citizenid: null, owner_name: null, price: 500, auction_id: null, current_bid: null, ends_at: null },
  { id: 4, name: 'A 004', owner_citizenid: null, owner_name: null, price: 400, auction_id: null, current_bid: null, ends_at: null },
  { id: 5, name: 'B 001', owner_citizenid: null, owner_name: null, price: 600, auction_id: null, current_bid: null, ends_at: null },
  { id: 6, name: 'B 002', owner_citizenid: null, owner_name: null, price: 450, auction_id: null, current_bid: null, ends_at: null },
  { id: 7, name: 'B 003', owner_citizenid: null, owner_name: null, price: 350, auction_id: null, current_bid: null, ends_at: null },
  { id: 8, name: 'C 001', owner_citizenid: null, owner_name: null, price: 700, auction_id: null, current_bid: null, ends_at: null },
];

const mockAuctions: Auction[] = [];

if (isDebug) {
  setTimeout(() => {
    const event = new MessageEvent('message', {
      data: {
        action: 'open',
        data: { storages: mockStorages, citizenid: 'CIT05410', money: { cash: 2500, bank: 15000 } }
      }
    });
    window.dispatchEvent(event);
  }, 100);
}
