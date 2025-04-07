#!/bin/bash
# Ensure End of Line is unix-style (LF)

echo "[entrypoint] Setting up XDG_RUNTIME_DIR..."
export XDG_RUNTIME_DIR=/tmp/runtime-$USER
mkdir -p $XDG_RUNTIME_DIR
chmod 700 $XDG_RUNTIME_DIR

echo "[entrypoint] Starting virtual display..."
Xvfb :99 -screen 0 1920x1080x24 &

echo "[entrypoint] Starting window manager..."
fluxbox &

echo "[entrypoint] Starting PulseAudio..."
pulseaudio -D --exit-idle-time=-1

# Give a few seconds for everything to warm up
sleep 2

echo "[entrypoint] Starting bot..."
pnpm run dev
