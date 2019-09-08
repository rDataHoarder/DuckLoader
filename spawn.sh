#!/usr/bin/env bash
# Multitasking the Ghetto Way
node src/downloadComix.js --start 1 --end 500 &
node src/downloadComix.js --start 501 --end 1000 &
node src/downloadComix.js --start 1001 --end 1500 &
node src/downloadComix.js --start 1501 --end 2000 &
node src/downloadComix.js --start 2001 --end 2500 &
node src/downloadComix.js --start 2501 --end 3000 &
node src/downloadComix.js --start 3001 --end 3500 &
node src/downloadComix.js --start 3501 --end 4000 &
node src/downloadComix.js --start 4001 --end 4500 &
node src/downloadComix.js --start 4501 --end 4800 &
