fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'LR Development'
description 'Container'
version '1.0.0'

shared_scripts { 'config.lua' }
ui_page 'web/dist/index.html'
files { 'web/dist/**/*' }
client_scripts { 'client/*.lua' }
server_scripts { '@oxmysql/lib/MySQL.lua', 'server/*.lua' }

dependencies { 'qb-core', 'oxmysql', 'ox_inventory', 'ox_target' }
