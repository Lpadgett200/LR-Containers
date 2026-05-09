Config = {}

Config.StoragePrice = 500 -- Default price for buying a storage
Config.AuctionDuration = 24 * 60 * 60 * 1000 -- 24 hours in ms for auctions

Config.Storages = {
    { id = 1, name = "A 001", price = 300, coords = vector3(-1607.25, -830.37, 10.08) },
    { id = 2, name = "A 002", price = 500, coords = vector3(-1611.56, -825.77, 10.08) },
    { id = 3, name = "A 003", price = 500, coords = vector3(-1616.29, -822.53, 10.08) },
    { id = 4, name = "A 004", price = 400, coords = vector3(-1620.93, -818.54, 10.08) },
    { id = 5, name = "B 001", price = 600, coords = vector3(-1625.42, -814.73, 10.08) },
    { id = 6, name = "B 002", price = 450, coords = vector3(220.0, -1010.0, 29.0) },
    { id = 7, name = "B 003", price = 350, coords = vector3(225.0, -1010.0, 29.0) },
    { id = 8, name = "C 001", price = 700, coords = vector3(215.0, -1020.0, 29.0) },
}

Config.Ped = {
    model = "s_m_m_dockwork_01", -- Dock worker ped model
    coords = vector3(-1604.70, -831.61, 10.08),
    heading = 330.34,
    scenario = "WORLD_HUMAN_CLIPBOARD" -- Animation to play
}

Config.Marker = {
    type = 1, -- Cylinder marker
    scale = { x = 1.5, y = 1.5, z = 0.5 },
    color = { r = 50, g = 200, b = 100, a = 150 },
    distance = 20.0 -- Draw distance
}

Config.InteractDistance = 1.5
