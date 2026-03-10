#!/bin/bash
set -e

cd ~/src/jzintv
source ~/src/emsdk/emsdk_env.sh
touch shell.html
make -f Makefile.emscripten
make -f Makefile.emscripten deploy

cd ~/src/intellivision-overlay-editor
docker-compose down --rmi all --volumes --remove-orphans
docker builder prune -af
./test-docker-nocache.sh
