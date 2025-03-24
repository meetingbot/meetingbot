#!/bin/bash

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
