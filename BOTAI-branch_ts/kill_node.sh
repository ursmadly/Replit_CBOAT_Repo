#!/bin/bash

echo "Checking for running Node.js processes..."
pids=$(ps aux | grep node | grep -v grep | awk '{print $2}')

if [ -z "$pids" ]; then
  echo "No Node.js processes found running."
else
  echo "Found Node.js processes with PIDs: $pids"
  echo "Killing processes..."
  for pid in $pids; do
    echo "Killing process $pid..."
    kill -9 $pid
  done
  echo "All Node.js processes terminated."
fi

echo "Checking port 5000..."
port_check=$(lsof -i :5000 | grep LISTEN)
if [ -z "$port_check" ]; then
  echo "Port 5000 is free."
else
  echo "Port 5000 is still in use by:"
  echo "$port_check"
  pid=$(echo "$port_check" | awk '{print $2}')
  echo "Killing process on port 5000 (PID: $pid)..."
  kill -9 $pid
  echo "Process terminated."
fi