#!/bin/bash
export PATH=$PATH:/usr/bin;

cd /var/www_vhosts/auto-update
npm run client 2>&1 > ./reboot.log
