import os
import subprocess
import sys

def run(cmd, shell=False):
    print(f"\n▶ Running: {cmd}")
    result = subprocess.run(cmd, shell=shell)
    if result.returncode != 0:
        print("❌ Command failed")
        sys.exit(result.returncode)

print("=== Raylib-Go WASM Build Script (Python) ===")

# --- Set env vars for WASM build ---
os.environ["GOOS"] = "js"
os.environ["GOARCH"] = "wasm"

# Build WASM
run(["go", "build", "-o", "./Raylib-Go-Wasm/index/main.wasm", "."])

# --- Clear env vars ---
del os.environ["GOOS"]
del os.environ["GOARCH"]

# Build server
run(["go", "build", "-o", "server.exe", "./Raylib-Go-Wasm/server/server.go"], shell=False)

# Run server (Windows requires shell=True + string)
try:
    os.system("server.exe")
except KeyboardInterrupt:
    print("\n Sever stopped 🖥️")
