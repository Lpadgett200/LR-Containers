local QBCore = exports['qb-core']:GetCoreObject()

-- Initialize database tables
CreateThread(function()
    -- Create storages table
    MySQL.query.await([[
        CREATE TABLE IF NOT EXISTS storages (
            id INT PRIMARY KEY,
            name VARCHAR(50),
            owner_citizenid VARCHAR(50) DEFAULT NULL,
            owner_name VARCHAR(100) DEFAULT NULL,
            price INT DEFAULT 0,
            owned_at DATETIME DEFAULT NULL
        )
    ]])

    -- Create auctions table
    MySQL.query.await([[
        CREATE TABLE IF NOT EXISTS storage_auctions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            storage_id INT,
            seller_citizenid VARCHAR(50),
            seller_name VARCHAR(100),
            starting_price INT,
            current_bid INT,
            current_bidder_citizenid VARCHAR(50) DEFAULT NULL,
            current_bidder_name VARCHAR(100) DEFAULT NULL,
            ends_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (storage_id) REFERENCES storages(id)
        )
    ]])

    -- Insert default storages if they don't exist
    for _, storage in ipairs(Config.Storages) do
        MySQL.query.await([[
            INSERT IGNORE INTO storages (id, name, price) VALUES (?, ?, ?)
        ]], { storage.id, storage.name, storage.price })
    end

    print('[storages] Database initialized')
end)

-- Get all storages with ownership info
RegisterNetEvent('storages:server:getStorages', function()
    local src = source
    local player = QBCore.Functions.GetPlayer(src)
    if not player then return end

    local citizenid = player.PlayerData.citizenid

    local storages = MySQL.query.await([[
        SELECT s.id, s.name, s.owner_citizenid, s.owner_name, s.price,
               (SELECT sa.id FROM storage_auctions sa WHERE sa.storage_id = s.id AND sa.ends_at > NOW() LIMIT 1) as auction_id,
               (SELECT sa.current_bid FROM storage_auctions sa WHERE sa.storage_id = s.id AND sa.ends_at > NOW() LIMIT 1) as current_bid,
               (SELECT sa.ends_at FROM storage_auctions sa WHERE sa.storage_id = s.id AND sa.ends_at > NOW() LIMIT 1) as ends_at
        FROM storages s
        ORDER BY s.name ASC
    ]])

    -- Add coords from config
    for _, storage in ipairs(storages) do
        for _, cfgStorage in ipairs(Config.Storages) do
            if cfgStorage.id == storage.id then
                storage.coords = cfgStorage.coords
                break
            end
        end
    end

    TriggerClientEvent('storages:client:receiveStorages', src, {
        storages = storages,
        citizenid = citizenid,
        money = player.PlayerData.money
    })
end)

-- Buy a storage
RegisterNetEvent('storages:server:buyStorage', function(storageId)
    local src = source
    local player = QBCore.Functions.GetPlayer(src)
    if not player then return end

    local storage = MySQL.query.await([[
        SELECT * FROM storages WHERE id = ? AND owner_citizenid IS NULL
    ]], { storageId })

    if not storage or #storage == 0 then
        TriggerClientEvent('QBCore:Notify', src, 'Storage is not available!', 'error')
        return
    end

    local price = storage[1].price

    if player.PlayerData.money.cash < price and player.PlayerData.money.bank < price then
        TriggerClientEvent('QBCore:Notify', src, 'Not enough money!', 'error')
        return
    end

    -- Take money from bank first, then cash
    if player.PlayerData.money.bank >= price then
        player.Functions.RemoveMoney('bank', price, 'storage-purchase')
    else
        player.Functions.RemoveMoney('cash', price, 'storage-purchase')
    end

    local citizenid = player.PlayerData.citizenid
    local ownerName = player.PlayerData.charinfo.firstname .. ' ' .. player.PlayerData.charinfo.lastname

    MySQL.query.await([[
        UPDATE storages SET owner_citizenid = ?, owner_name = ?, owned_at = NOW() WHERE id = ?
    ]], { citizenid, ownerName, storageId })

    -- Register ox_inventory stash for this storage
    local stashId = 'storage_' .. storageId
    exports.ox_inventory:RegisterStash(stashId, 'Storage ' .. storage[1].name, 50, 10000000, citizenid)

    TriggerClientEvent('QBCore:Notify', src, 'Storage purchased successfully!', 'success')
    TriggerEvent('storages:server:getStorages')
end)

-- Create auction for owned storage
RegisterNetEvent('storages:server:createAuction', function(storageId, startingPrice)
    local src = source
    local player = QBCore.Functions.GetPlayer(src)
    if not player then return end

    local citizenid = player.PlayerData.citizenid

    -- Verify ownership
    local storage = MySQL.query.await([[
        SELECT * FROM storages WHERE id = ? AND owner_citizenid = ?
    ]], { storageId, citizenid })

    if not storage or #storage == 0 then
        TriggerClientEvent('QBCore:Notify', src, 'You do not own this storage!', 'error')
        return
    end

    -- Check if already has active auction
    local existingAuction = MySQL.query.await([[
        SELECT id FROM storage_auctions WHERE storage_id = ? AND ends_at > NOW()
    ]], { storageId })

    if existingAuction and #existingAuction > 0 then
        TriggerClientEvent('QBCore:Notify', src, 'Storage already has an active auction!', 'error')
        return
    end

    local ownerName = player.PlayerData.charinfo.firstname .. ' ' .. player.PlayerData.charinfo.lastname
    local endsAt = os.date('%Y-%m-%d %H:%M:%S', os.time() + (Config.AuctionDuration / 1000))

    MySQL.query.await([[
        INSERT INTO storage_auctions (storage_id, seller_citizenid, seller_name, starting_price, current_bid, ends_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ]], { storageId, citizenid, ownerName, startingPrice, startingPrice, endsAt })

    TriggerClientEvent('QBCore:Notify', src, 'Auction created successfully!', 'success')
    TriggerEvent('storages:server:getStorages')
end)

-- Get all active auctions
RegisterNetEvent('storages:server:getAuctions', function()
    local src = source
    local player = QBCore.Functions.GetPlayer(src)
    if not player then return end

    local citizenid = player.PlayerData.citizenid

    local auctions = MySQL.query.await([[
        SELECT sa.*, s.name as storage_name
        FROM storage_auctions sa
        JOIN storages s ON s.id = sa.storage_id
        WHERE sa.ends_at > NOW()
        ORDER BY sa.ends_at ASC
    ]])

    TriggerClientEvent('storages:client:receiveAuctions', src, {
        auctions = auctions,
        citizenid = citizenid,
        money = player.PlayerData.money
    })
end)

-- Place bid on auction
RegisterNetEvent('storages:server:placeBid', function(auctionId, bidAmount)
    local src = source
    local player = QBCore.Functions.GetPlayer(src)
    if not player then return end

    local auction = MySQL.query.await([[
        SELECT sa.*, s.name as storage_name FROM storage_auctions sa
        JOIN storages s ON s.id = sa.storage_id
        WHERE sa.id = ? AND sa.ends_at > NOW()
    ]], { auctionId })

    if not auction or #auction == 0 then
        TriggerClientEvent('QBCore:Notify', src, 'Auction not found or ended!', 'error')
        return
    end

    local auctionData = auction[1]
    local citizenid = player.PlayerData.citizenid

    -- Can't bid on own auction
    if auctionData.seller_citizenid == citizenid then
        TriggerClientEvent('QBCore:Notify', src, 'You cannot bid on your own auction!', 'error')
        return
    end

    -- Bid must be higher than current
    if bidAmount <= auctionData.current_bid then
        TriggerClientEvent('QBCore:Notify', src, 'Bid must be higher than current bid!', 'error')
        return
    end

    -- Check money
    if player.PlayerData.money.bank < bidAmount then
        TriggerClientEvent('QBCore:Notify', src, 'Not enough money in bank!', 'error')
        return
    end

    -- Refund previous bidder
    if auctionData.current_bidder_citizenid then
        local prevBidder = QBCore.Functions.GetPlayerByCitizenId(auctionData.current_bidder_citizenid)
        if prevBidder then
            prevBidder.Functions.AddMoney('bank', auctionData.current_bid, 'auction-refund')
        end
    end

    -- Take money from new bidder
    player.Functions.RemoveMoney('bank', bidAmount, 'auction-bid')

    local bidderName = player.PlayerData.charinfo.firstname .. ' ' .. player.PlayerData.charinfo.lastname

    MySQL.query.await([[
        UPDATE storage_auctions SET current_bid = ?, current_bidder_citizenid = ?, current_bidder_name = ?
        WHERE id = ?
    ]], { bidAmount, citizenid, bidderName, auctionId })

    TriggerClientEvent('QBCore:Notify', src, 'Bid placed successfully!', 'success')
    TriggerEvent('storages:server:getAuctions')
end)

-- End auction (called when timer ends or manually)
RegisterNetEvent('storages:server:endAuction', function(auctionId)
    local auction = MySQL.query.await([[
        SELECT * FROM storage_auctions WHERE id = ?
    ]], { auctionId })

    if not auction or #auction == 0 then return end

    local auctionData = auction[1]

    if auctionData.current_bidder_citizenid then
        -- Transfer ownership to winner
        MySQL.query.await([[
            UPDATE storages SET owner_citizenid = ?, owner_name = ?, owned_at = NOW()
            WHERE id = ?
        ]], { auctionData.current_bidder_citizenid, auctionData.current_bidder_name, auctionData.storage_id })

        -- Pay seller
        local seller = QBCore.Functions.GetPlayerByCitizenId(auctionData.seller_citizenid)
        if seller then
            seller.Functions.AddMoney('bank', auctionData.current_bid, 'auction-sale')
        end
    else
        -- No bidders - return storage to seller (clear auction, keep ownership)
    end

    -- Delete auction
    MySQL.query.await([[ DELETE FROM storage_auctions WHERE id = ? ]], { auctionId })
end)

-- Check for ended auctions periodically
CreateThread(function()
    while true do
        Wait(60000) -- Check every minute

        local endedAuctions = MySQL.query.await([[
            SELECT id FROM storage_auctions WHERE ends_at <= NOW()
        ]])

        for _, auction in ipairs(endedAuctions) do
            TriggerEvent('storages:server:endAuction', auction.id)
        end
    end
end)

-- Get owned storages for markers (called on resource start)
RegisterNetEvent('storages:server:getOwnedStorages', function()
    local src = source
    local player = QBCore.Functions.GetPlayer(src)
    if not player then return end

    local citizenid = player.PlayerData.citizenid

    local ownedStorages = MySQL.query.await([[
        SELECT id, name FROM storages WHERE owner_citizenid = ?
    ]], { citizenid })

    -- Add coords from config
    for _, storage in ipairs(ownedStorages) do
        for _, cfgStorage in ipairs(Config.Storages) do
            if cfgStorage.id == storage.id then
                storage.coords = cfgStorage.coords
                break
            end
        end
    end

    TriggerClientEvent('storages:client:receiveOwnedStorages', src, ownedStorages)
end)

-- Open storage stash
RegisterNetEvent('storages:server:openStorage', function(storageId)
    local src = source
    local player = QBCore.Functions.GetPlayer(src)
    if not player then return end

    local citizenid = player.PlayerData.citizenid

    -- Verify ownership
    local storage = MySQL.query.await([[
        SELECT id, name FROM storages WHERE id = ? AND owner_citizenid = ?
    ]], { storageId, citizenid })

    if not storage or #storage == 0 then
        TriggerClientEvent('QBCore:Notify', src, 'You do not own this storage!', 'error')
        return
    end

    local stashId = 'storage_' .. storageId
    exports.ox_inventory:RegisterStash(stashId, 'Storage ' .. storage[1].name, 50, 10000000, citizenid)
    
    -- Trigger client to open the stash
    TriggerClientEvent('storages:client:openStash', src, stashId)
end)
