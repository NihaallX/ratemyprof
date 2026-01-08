"""Quick script to check database state"""
import sys
sys.path.insert(0, '.')

from src.lib.database import get_supabase_service

supabase = get_supabase_service()

print("=== USERS ===")
users = supabase.table("users").select("id, email", count="exact").execute()
print(f"Total users: {users.count}")
for user in (users.data or [])[:5]:
    print(f"  {user['id']} - {user.get('email', 'N/A')}")
if len(users.data or []) > 5:
    print(f"  ... and {len(users.data) - 5} more")

print("\n=== REVIEWS ===")
reviews = supabase.table("reviews").select("id, professor_id, status", count="exact").execute()
print(f"Total reviews: {reviews.count}")
for review in (reviews.data or [])[:5]:
    print(f"  {review['id']} - Status: {review['status']}")
if len(reviews.data or []) > 5:
    print(f"  ... and {len(reviews.data) - 5} more")

print("\n=== REVIEW AUTHOR MAPPINGS ===")
mappings = supabase.table("review_author_mappings").select("review_id, author_id", count="exact").execute()
print(f"Total mappings: {mappings.count}")
for mapping in (mappings.data or [])[:5]:
    print(f"  Review: {mapping['review_id']} → Author: {mapping['author_id']}")
if len(mappings.data or []) > 5:
    print(f"  ... and {len(mappings.data) - 5} more")

print("\n=== EVENTS ===")
events = supabase.table("events").select("id, event_type, processed", count="exact").execute()
unprocessed = [e for e in (events.data or []) if not e.get('processed')]
print(f"Total events: {events.count}")
print(f"Unprocessed events: {len(unprocessed)}")
if len(events.data or []) > 0:
    for event in (events.data or [])[:3]:
        status = "⏳ pending" if not event.get('processed') else "✅ processed"
        print(f"  {event['event_type']} - {status}")

print("\n=== NOTIFICATIONS ===")
notifs = supabase.table("notifications").select("id, user_id, title, is_read", count="exact").execute()
print(f"Total notifications: {notifs.count}")
unread = len([n for n in (notifs.data or []) if not n.get('is_read')])
print(f"Unread: {unread}")
for notif in (notifs.data or [])[:3]:
    read_status = "✓" if notif.get('is_read') else "○"
    print(f"  {read_status} {notif['title'][:50]}...")
if len(notifs.data or []) > 3:
    print(f"  ... and {len(notifs.data) - 3} more")
