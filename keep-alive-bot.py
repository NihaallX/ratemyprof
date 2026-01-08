"""
Keep-Alive Bot for Render Free Tier
Pings the backend every 14 minutes to prevent cold starts.
"""
import requests
import time
from datetime import datetime
import sys

# Configuration
BACKEND_URL = "https://your-app.onrender.com/health"  # Replace with your Render URL
INTERVAL_SECONDS = 840  # 14 minutes
TIMEOUT = 30  # Request timeout in seconds

def ping_backend():
    """Send a ping to the backend health endpoint."""
    try:
        response = requests.get(BACKEND_URL, timeout=TIMEOUT)
        
        if response.status_code == 200:
            print(f"✅ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Backend alive - Status: {response.status_code}")
            return True
        else:
            print(f"⚠️ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Warning - Status: {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"⏱️ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Timeout - Backend may be cold starting")
        return False
        
    except requests.exceptions.RequestException as e:
        print(f"❌ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Error: {e}")
        return False

def main():
    """Main loop to keep pinging the backend."""
    print("=" * 60)
    print("🤖 RateMyProf Keep-Alive Bot Started")
    print(f"📡 Target: {BACKEND_URL}")
    print(f"⏰ Interval: {INTERVAL_SECONDS // 60} minutes")
    print("=" * 60)
    print()
    
    # Initial ping
    ping_backend()
    
    # Continuous loop
    try:
        while True:
            time.sleep(INTERVAL_SECONDS)
            ping_backend()
            
    except KeyboardInterrupt:
        print()
        print("⏸️ Bot stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"💥 Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
