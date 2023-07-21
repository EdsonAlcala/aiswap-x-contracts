#!/bin/bash

# Node 1 with account 2
npx ganache-cli -m "" -f "" --wallet.hdPath "m,44',60',0',1"

# Node 2 with account 3
npx ganache-cli -m "" -f "" --wallet.hdPath "m,44',60',0',2"