#!/usr/bin/env bash

DIR_CURRENT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
DIR_INFRASTRUCTURE=$DIR_CURRENT/../infrastructure

tmux new-session -s chiro -d
tmux send "cd $DIR_INFRASTRUCTURE && npx hardhat node" C-m
tmux rename-window "Local node"
tmux split-window -v
sleep 5
tmux send "cd $DIR_INFRASTRUCTURE && npx hardhat --network local deploy" C-m
tmux rename-window "Deploy contract to target"
# tmux split-window -h
# tmux send "cd $DIR_CURRENT && npx nodemon -w ./src/ -e ts -x \"npx ts-node ./src/index.ts\"" C-m
# tmux rename-window "Devel"
tmux attach