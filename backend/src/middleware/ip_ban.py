"""
Smart IP Ban Middleware for RateMyProf
Automatically bans IPs showing malicious behavior while protecting normal users
"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import ipaddress
from collections import defaultdict
import asyncio

from src.config.security import (
    BAN_THRESHOLD_FAILED_LOGINS,
    BAN_THRESHOLD_RAPID_REQUESTS,
    BAN_DURATION_MINUTES,
    REQUESTS_WINDOW_SECONDS,
    WHITELIST_IPS,
    AUTO_BAN_ENABLED
)


class IPBanManager:
    """
    Manages IP banning with smart detection to avoid affecting normal users
    """
    
    def __init__(self):
        # Banned IPs: {ip: ban_expiry_datetime}
        self.banned_ips: Dict[str, datetime] = {}
        
        # Failed login attempts: {ip: [timestamp1, timestamp2, ...]}
        self.failed_logins: Dict[str, List[datetime]] = defaultdict(list)
        
        # Request tracking: {ip: [timestamp1, timestamp2, ...]}
        self.request_history: Dict[str, List[datetime]] = defaultdict(list)
        
        # Suspicious patterns: {ip: suspicion_score}
        self.suspicion_scores: Dict[str, int] = defaultdict(int)
        
        # Whitelisted IPs (never ban these)
        self.whitelist: set = set(WHITELIST_IPS)
        
    def is_ip_whitelisted(self, ip: str) -> bool:
        """Check if IP is whitelisted"""
        try:
            ip_addr = ipaddress.ip_address(ip)
            
            # Always whitelist localhost
            if ip_addr.is_loopback or ip_addr.is_private:
                return True
                
            return ip in self.whitelist
        except ValueError:
            return False
    
    def is_ip_banned(self, ip: str) -> tuple[bool, Optional[datetime]]:
        """
        Check if IP is currently banned
        
        Returns:
            (is_banned, expiry_time)
        """
        if not AUTO_BAN_ENABLED:
            return False, None
            
        if self.is_ip_whitelisted(ip):
            return False, None
            
        if ip in self.banned_ips:
            expiry = self.banned_ips[ip]
            if datetime.now() < expiry:
                return True, expiry
            else:
                # Ban expired, remove it
                del self.banned_ips[ip]
                self.suspicion_scores[ip] = max(0, self.suspicion_scores[ip] - 50)
                
        return False, None
    
    def ban_ip(self, ip: str, duration_minutes: int = BAN_DURATION_MINUTES, reason: str = "Suspicious activity"):
        """
        Ban an IP address for specified duration
        
        Args:
            ip: IP address to ban
            duration_minutes: Ban duration in minutes
            reason: Reason for ban (for logging)
        """
        if self.is_ip_whitelisted(ip):
            print(f"⚠️ Attempted to ban whitelisted IP: {ip} - Reason: {reason}")
            return
            
        expiry = datetime.now() + timedelta(minutes=duration_minutes)
        self.banned_ips[ip] = expiry
        
        print(f"🚫 IP BANNED: {ip} until {expiry} - Reason: {reason}")
        
        # TODO: Store in database for persistence across restarts
        # self._save_ban_to_database(ip, expiry, reason)
    
    def record_failed_login(self, ip: str):
        """
        Record a failed login attempt and auto-ban if threshold exceeded
        
        Smart detection:
        - Normal user: 3-5 failed attempts over 10+ minutes = OK
        - Attacker: 10+ failed attempts in 5 minutes = BAN
        """
        if self.is_ip_whitelisted(ip):
            return
            
        now = datetime.now()
        
        # Clean old attempts (older than 15 minutes)
        self.failed_logins[ip] = [
            ts for ts in self.failed_logins[ip] 
            if now - ts < timedelta(minutes=15)
        ]
        
        # Add current attempt
        self.failed_logins[ip].append(now)
        
        # Check for ban threshold
        recent_failures = len(self.failed_logins[ip])
        
        # SMART DETECTION: Only ban if pattern looks like brute force
        if recent_failures >= BAN_THRESHOLD_FAILED_LOGINS:
            # Check if attempts are rapid (brute force pattern)
            if len(self.failed_logins[ip]) >= 5:
                time_span = (self.failed_logins[ip][-1] - self.failed_logins[ip][-5]).total_seconds()
                
                # If 5 attempts in less than 2 minutes = brute force
                if time_span < 120:
                    self.suspicion_scores[ip] += 100
                    self.ban_ip(ip, reason=f"Brute force attack detected ({recent_failures} failed logins)")
                    return
        
        # Increase suspicion score gradually
        self.suspicion_scores[ip] += 10
        
        # Warn at 50% threshold
        if recent_failures >= BAN_THRESHOLD_FAILED_LOGINS // 2:
            print(f"⚠️ IP {ip} has {recent_failures} failed login attempts")
    
    def record_request(self, ip: str, path: str):
        """
        Track request patterns to detect DDoS or scraping
        
        Smart detection:
        - Normal user: 10-20 requests/minute = OK
        - Attacker: 100+ requests/minute = BAN
        """
        if self.is_ip_whitelisted(ip):
            return
            
        now = datetime.now()
        
        # Clean old requests (older than tracking window)
        window = timedelta(seconds=REQUESTS_WINDOW_SECONDS)
        self.request_history[ip] = [
            ts for ts in self.request_history[ip] 
            if now - ts < window
        ]
        
        # Add current request
        self.request_history[ip].append(now)
        
        # Check for rapid requests (DDoS pattern)
        request_count = len(self.request_history[ip])
        
        if request_count >= BAN_THRESHOLD_RAPID_REQUESTS:
            self.suspicion_scores[ip] += 50
            self.ban_ip(
                ip, 
                duration_minutes=BAN_DURATION_MINUTES * 2,  # Longer ban for DDoS
                reason=f"DDoS attack detected ({request_count} requests in {REQUESTS_WINDOW_SECONDS}s)"
            )
    
    def record_suspicious_activity(self, ip: str, activity_type: str, severity: int = 25):
        """
        Record any suspicious activity
        
        Args:
            ip: IP address
            activity_type: Type of suspicious activity
            severity: Suspicion score to add (default: 25)
        """
        if self.is_ip_whitelisted(ip):
            return
            
        self.suspicion_scores[ip] += severity
        
        print(f"⚠️ Suspicious activity from {ip}: {activity_type} (score: {self.suspicion_scores[ip]})")
        
        # Auto-ban if suspicion score exceeds threshold
        if self.suspicion_scores[ip] >= 100:
            self.ban_ip(ip, reason=f"High suspicion score ({self.suspicion_scores[ip]}) - {activity_type}")
    
    def get_banned_ips(self) -> List[Dict]:
        """Get list of currently banned IPs with expiry times"""
        now = datetime.now()
        return [
            {
                "ip": ip,
                "expires_at": expiry.isoformat(),
                "remaining_minutes": int((expiry - now).total_seconds() / 60)
            }
            for ip, expiry in self.banned_ips.items()
            if expiry > now
        ]
    
    def unban_ip(self, ip: str) -> bool:
        """
        Manually unban an IP (admin action)
        
        Returns:
            True if IP was banned and is now unbanned, False otherwise
        """
        if ip in self.banned_ips:
            del self.banned_ips[ip]
            self.suspicion_scores[ip] = 0
            self.failed_logins[ip] = []
            print(f"✅ IP UNBANNED: {ip}")
            return True
        return False
    
    def cleanup_expired_bans(self):
        """Remove expired bans and old tracking data"""
        now = datetime.now()
        
        # Remove expired bans
        expired_ips = [ip for ip, expiry in self.banned_ips.items() if expiry <= now]
        for ip in expired_ips:
            del self.banned_ips[ip]
            print(f"✅ Ban expired for IP: {ip}")
        
        # Clean old tracking data
        for ip in list(self.failed_logins.keys()):
            self.failed_logins[ip] = [
                ts for ts in self.failed_logins[ip] 
                if now - ts < timedelta(minutes=30)
            ]
            if not self.failed_logins[ip]:
                del self.failed_logins[ip]
        
        for ip in list(self.request_history.keys()):
            self.request_history[ip] = [
                ts for ts in self.request_history[ip] 
                if now - ts < timedelta(seconds=REQUESTS_WINDOW_SECONDS * 2)
            ]
            if not self.request_history[ip]:
                del self.request_history[ip]


# Global IP ban manager instance
ip_ban_manager = IPBanManager()


async def ip_ban_middleware(request: Request, call_next):
    """
    Middleware to check if IP is banned before processing request
    """
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    
    # Check if IP is banned
    is_banned, expiry = ip_ban_manager.is_ip_banned(client_ip)
    
    if is_banned:
        remaining_minutes = int((expiry - datetime.now()).total_seconds() / 60)
        return JSONResponse(
            status_code=403,
            content={
                "detail": f"Your IP has been temporarily banned due to suspicious activity. "
                         f"Ban expires in {remaining_minutes} minutes. "
                         f"If you believe this is an error, please contact support.",
                "banned_until": expiry.isoformat(),
                "ip": client_ip
            }
        )
    
    # Track this request (for DDoS detection)
    ip_ban_manager.record_request(client_ip, request.url.path)
    
    # Process request normally
    response = await call_next(request)
    
    return response


# Background task to cleanup expired bans every 10 minutes
async def cleanup_task():
    """Background task to cleanup expired bans"""
    while True:
        await asyncio.sleep(600)  # 10 minutes
        ip_ban_manager.cleanup_expired_bans()
