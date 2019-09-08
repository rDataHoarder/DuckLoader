#!/usr/bin/env bash
# Multitasking the Ghetto Way
node src/checkFileIntegrity.js --start 1 --end 250 &
node src/checkFileIntegrity.js --start 251 --end 500 &
node src/checkFileIntegrity.js --start 501 --end 750 &
node src/checkFileIntegrity.js --start 751 --end 1000 &
node src/checkFileIntegrity.js --start 1001 --end 1250 &
node src/checkFileIntegrity.js --start 1251 --end 1500 &
node src/checkFileIntegrity.js --start 1751 --end 2000 &
node src/checkFileIntegrity.js --start 2001 --end 2250 &
node src/checkFileIntegrity.js --start 2251 --end 2500 &
node src/checkFileIntegrity.js --start 2501 --end 2700 &
node src/checkFileIntegrity.js --start 2751 --end 3000 &
node src/checkFileIntegrity.js --start 3001 --end 3250 &
node src/checkFileIntegrity.js --start 3251 --end 3500 &
node src/checkFileIntegrity.js --start 3751 --end 4000 &
node src/checkFileIntegrity.js --start 4000 --end 4250 &
node src/checkFileIntegrity.js --start 4250 --end 4500 &
node src/checkFileIntegrity.js --start 4501 --end 4800 &
