local QBCore = exports['qb-core']:GetCoreObject()
local ownedStorages = {}
local blips = {}
local storagePed = nil

local function createStoragePed()
    print('[LR-Containers] Creating storage ped...')
    
    if storagePed and DoesEntityExist(storagePed) then
        DeleteEntity(storagePed)
    end

    local model = GetHashKey(Config.Ped.model)
    if not IsModelInCdimage(model) then
        print('[LR-Containers] ERROR: Invalid model ' .. Config.Ped.model)
        return
    end
    
    RequestModel(model)
    local timeout = 0
    while not HasModelLoaded(model) do
        Wait(100)
        timeout = timeout + 1
        if timeout > 50 then
            print('[LR-Containers] ERROR: Model failed to load')
            return
        end
    end

    local coords = Config.Ped.coords
    storagePed = CreatePed(4, model, coords.x, coords.y, coords.z - 1.0, Config.Ped.heading, false, true)
    
    if not storagePed or storagePed == 0 then
        print('[LR-Containers] ERROR: Failed to create ped')
        return
    end
    
    print('[LR-Containers] Ped created successfully at ' .. coords.x .. ', ' .. coords.y .. ', ' .. coords.z)
    
    SetModelAsNoLongerNeeded(model)
    FreezeEntityPosition(storagePed, true)
    SetEntityInvincible(storagePed, true)
    SetBlockingOfNonTemporaryEvents(storagePed, true)
    
    if Config.Ped.scenario then
        TaskStartScenarioInPlace(storagePed, Config.Ped.scenario, 0, true)
    end

    exports.ox_target:addLocalEntity(storagePed, {
        {
            name = 'storage_manager',
            icon = 'fa-solid fa-warehouse',
            label = 'Open Storage Management',
            distance = 2.0,
            onSelect = function()
                TriggerServerEvent('storages:server:getStorages')
            end
        }
    })

    local blip = AddBlipForCoord(coords.x, coords.y, coords.z)
    SetBlipSprite(blip, 500)
    SetBlipColour(blip, 2) 
    SetBlipScale(blip, 0.8)
    SetBlipAsShortRange(blip, true)
    BeginTextCommandSetBlipName("STRING")
    AddTextComponentSubstringPlayerName("Storage Manager")
    EndTextCommandSetBlipName(blip)
end

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    TriggerServerEvent('storages:server:getOwnedStorages')
    createStoragePed()
end)

CreateThread(function()
    Wait(1000)
    if LocalPlayer.state.isLoggedIn then
        TriggerServerEvent('storages:server:getOwnedStorages')
        createStoragePed()
    end
end)

RegisterNetEvent('storages:client:receiveOwnedStorages', function(storages)
    ownedStorages = storages

    for _, blip in pairs(blips) do
        RemoveBlip(blip)
    end
    blips = {}

    for _, storage in ipairs(storages) do
        if storage.coords then
            local blip = AddBlipForCoord(storage.coords.x, storage.coords.y, storage.coords.z)
            SetBlipSprite(blip, 500) 
            SetBlipColour(blip, 5) 
            SetBlipScale(blip, 0.7)
            SetBlipAsShortRange(blip, true)
            BeginTextCommandSetBlipName("STRING")
            AddTextComponentSubstringPlayerName("Storage: " .. storage.name)
            EndTextCommandSetBlipName(blip)
            blips[storage.id] = blip
        end
    end
end)

RegisterNetEvent('storages:client:receiveStorages', function(data)
    local newOwned = {}
    for _, storage in ipairs(data.storages) do
        if storage.owner_citizenid == data.citizenid then
            table.insert(newOwned, storage)
        end
    end
    TriggerEvent('storages:client:receiveOwnedStorages', newOwned)

    NUI.Open({
        type = 'storages',
        storages = data.storages,
        citizenid = data.citizenid,
        money = data.money
    })
end)

RegisterNetEvent('storages:client:receiveAuctions', function(data)
    NUI.SendMessage('receiveAuctions', {
        auctions = data.auctions,
        citizenid = data.citizenid,
        money = data.money
    })
end)

RegisterNuiCallback('getStorages', function(_, cb)
    TriggerServerEvent('storages:server:getStorages')
    cb({ success = true })
end)

RegisterNuiCallback('buyStorage', function(data, cb)
    TriggerServerEvent('storages:server:buyStorage', data.storageId)
    cb({ success = true })
end)

RegisterNuiCallback('createAuction', function(data, cb)
    TriggerServerEvent('storages:server:createAuction', data.storageId, data.startingPrice)
    cb({ success = true })
end)

RegisterNuiCallback('getAuctions', function(_, cb)
    TriggerServerEvent('storages:server:getAuctions')
    cb({ success = true })
end)

RegisterNuiCallback('placeBid', function(data, cb)
    TriggerServerEvent('storages:server:placeBid', data.auctionId, data.bidAmount)
    cb({ success = true })
end)

RegisterNetEvent('storages:client:openStash', function(stashId)
    exports.ox_inventory:openInventory('stash', { id = stashId })
end)

CreateThread(function()
    while true do
        local sleep = 1000
        local playerPed = PlayerPedId()
        local playerCoords = GetEntityCoords(playerPed)

        for _, storage in ipairs(ownedStorages) do
            if storage.coords then
                local dist = #(playerCoords - storage.coords)

                if dist < Config.Marker.distance then
                    sleep = 0

                    DrawMarker(
                        Config.Marker.type,
                        storage.coords.x, storage.coords.y, storage.coords.z,
                        0, 0, 0, 0, 0, 0,
                        Config.Marker.scale.x, Config.Marker.scale.y, Config.Marker.scale.z,
                        Config.Marker.color.r, Config.Marker.color.g, Config.Marker.color.b, Config.Marker.color.a,
                        false, false, 2, false, nil, nil, false
                    )

                    if dist < Config.InteractDistance then
                        BeginTextCommandDisplayHelp("STRING")
                        AddTextComponentSubstringPlayerName("Press ~INPUT_CONTEXT~ to open storage " .. storage.name)
                        EndTextCommandDisplayHelp(0, false, true, -1)

                        if IsControlJustPressed(0, 38) then 
                            TriggerServerEvent('storages:server:openStorage', storage.id)
                        end
                    end
                end
            end
        end

        Wait(sleep)
    end
end)

AddEventHandler('onClientResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    
    if storagePed and DoesEntityExist(storagePed) then
        exports.ox_target:removeLocalEntity(storagePed, 'storage_manager')
        DeleteEntity(storagePed)
    end
    
    for _, blip in pairs(blips) do
        RemoveBlip(blip)
    end
end)
