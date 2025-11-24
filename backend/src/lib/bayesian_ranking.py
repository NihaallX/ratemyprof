"""
Bayesian Ranking Algorithm for Professors

This module implements a sophisticated ranking system that balances:
- Rating quality (average_rating)
- Rating quantity (total_reviews)
- Recency (optional: last_review_date)

The Bayesian approach prevents a professor with 1 perfect review from 
ranking higher than one with 50 reviews at 4.8 rating.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from math import exp


def compute_bayesian_ranking(
    professors: List[Dict[str, Any]],
    C: float = 10.0,
    global_mean: Optional[float] = None,
    min_reviews: int = 0,
    exclude_unverified: bool = True,
    recency_weighting: Optional[Dict[str, Any]] = None,
    limit: Optional[int] = None,
    fallback_mean: float = 4.0
) -> Dict[str, Any]:
    """
    Compute Bayesian ranking for professors.
    
    Args:
        professors: List of professor dicts with keys:
            - id, name, department, college_id
            - average_rating (float)
            - total_reviews (int)
            - is_verified (bool, optional)
            - last_review_date (str ISO datetime, optional)
        
        C: Confidence parameter (default: 10.0)
           - Higher C = more weight on global mean
           - Lower C = more weight on professor's actual rating
           - C=10 means a professor needs ~10 reviews to approach their true rating
        
        global_mean: Pre-computed mean rating (optional)
           If None, will be computed as weighted average
        
        min_reviews: Minimum reviews required to be included (default: 0)
        
        exclude_unverified: Filter out unverified professors (default: True)
        
        recency_weighting: Optional dict with:
            - enabled (bool): Enable recency weighting
            - half_life_days (float): Half-life for exponential decay (default: 365)
            - weight_factor (float): Impact strength 0-1 (default: 0.15)
        
        limit: Maximum number of results to return (optional)
        
        fallback_mean: Fallback mean if no reviews exist (default: 4.0)
    
    Returns:
        Dict with:
            - ranked_professors: List of ranked professors with bayesian_score
            - stats: Ranking statistics
            - explainability: Notes about the ranking process
    """
    
    # Step 1: Filter input list
    filtered = []
    for prof in professors:
        # Check verification status
        if exclude_unverified and not prof.get('is_verified', False):
            continue
        
        # Check minimum reviews
        total_reviews = prof.get('total_reviews', 0)
        if total_reviews < min_reviews:
            continue
        
        filtered.append(prof)
    
    # Handle empty input
    if not filtered:
        return {
            'ranked_professors': [],
            'stats': {
                'total_input': len(professors),
                'total_filtered': 0,
                'global_mean': None,
                'confidence_param': C
            },
            'explainability': 'No professors matched the filtering criteria.'
        }
    
    # Step 2: Compute global mean if not provided
    if global_mean is None:
        total_rating_weight = sum(
            prof.get('average_rating', 0) * prof.get('total_reviews', 0) 
            for prof in filtered
        )
        total_review_count = sum(prof.get('total_reviews', 0) for prof in filtered)
        
        if total_review_count > 0:
            global_mean = total_rating_weight / total_review_count
        else:
            # Fallback: simple average or default
            ratings = [prof.get('average_rating', 0) for prof in filtered]
            global_mean = sum(ratings) / len(ratings) if ratings else fallback_mean
    
    # Step 3: Compute Bayesian score for each professor
    for prof in filtered:
        avg_rating = prof.get('average_rating', 0)
        total_reviews = prof.get('total_reviews', 0)
        
        # Bayesian average formula
        bayesian_score = (C * global_mean + total_reviews * avg_rating) / (C + total_reviews)
        prof['bayesian_score'] = bayesian_score
        prof['explainability'] = _generate_explainability(
            prof, bayesian_score, global_mean, C, total_reviews, avg_rating
        )
    
    # Step 4: Apply recency weighting if enabled
    if recency_weighting and recency_weighting.get('enabled', False):
        half_life_days = recency_weighting.get('half_life_days', 365)
        weight_factor = recency_weighting.get('weight_factor', 0.15)
        
        for prof in filtered:
            recency_factor = _compute_recency_factor(
                prof.get('last_review_date'),
                half_life_days
            )
            
            # Adjust score with recency
            base_score = prof['bayesian_score']
            prof['bayesian_score'] = base_score * (1 + weight_factor * (recency_factor - 1))
            prof['recency_factor'] = recency_factor
            
            # Update explainability
            if recency_factor != 1.0:
                prof['explainability'] += f" Recency boost: {recency_factor:.2f}x."
    
    # Step 5: Sort by bayesian_score DESC
    sorted_professors = sorted(
        filtered,
        key=lambda p: (
            -p['bayesian_score'],                    # Primary: Bayesian score
            -p.get('total_reviews', 0),              # Tie-breaker 1: More reviews
            -p.get('average_rating', 0),             # Tie-breaker 2: Higher rating
            p.get('id', '')                          # Tie-breaker 3: ID for consistency
        )
    )
    
    # Step 6: Apply limit if specified
    if limit:
        sorted_professors = sorted_professors[:limit]
    
    # Prepare stats
    stats = {
        'total_input': len(professors),
        'total_filtered': len(filtered),
        'total_returned': len(sorted_professors),
        'global_mean': round(global_mean, 2),
        'confidence_param': C,
        'min_reviews': min_reviews,
        'recency_enabled': bool(recency_weighting and recency_weighting.get('enabled'))
    }
    
    return {
        'ranked_professors': sorted_professors,
        'stats': stats,
        'explainability': f'Ranked using Bayesian average with C={C}, global mean={global_mean:.2f}.'
    }


def _generate_explainability(
    prof: Dict[str, Any],
    bayesian_score: float,
    global_mean: float,
    C: float,
    total_reviews: int,
    avg_rating: float
) -> str:
    """Generate human-readable explanation for a professor's score."""
    
    if total_reviews == 0:
        return f"No reviews yet. Score defaults to global average ({global_mean:.1f})."
    
    if total_reviews < C:
        pull_toward_mean = (C - total_reviews) / (C + total_reviews) * 100
        return (
            f"Score {bayesian_score:.2f} balances {total_reviews} review(s) "
            f"at {avg_rating:.1f} with platform average {global_mean:.1f} "
            f"({pull_toward_mean:.0f}% weight on average)."
        )
    else:
        return (
            f"Score {bayesian_score:.2f} based on {total_reviews} reviews "
            f"at {avg_rating:.1f} rating (sufficient data)."
        )


def _compute_recency_factor(
    last_review_date: Optional[str],
    half_life_days: float
) -> float:
    """
    Compute recency factor using exponential decay.
    
    Returns value in range (0, 2]:
    - 2.0 for brand new reviews (0 days old)
    - 1.0 for reviews at half-life age
    - 0.5 for very old reviews (2x half-life)
    
    Args:
        last_review_date: ISO datetime string of last review
        half_life_days: Days for factor to decay to 1.0
    
    Returns:
        Recency factor (0, 2]
    """
    if not last_review_date:
        return 1.0  # No date = no boost or penalty
    
    try:
        last_review = datetime.fromisoformat(last_review_date.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        days_ago = (now - last_review).total_seconds() / 86400
        
        # Exponential decay: factor = 2^(-days_ago / half_life_days) * 2
        # This gives: 2.0 at day 0, 1.0 at half_life_days, 0.5 at 2*half_life_days
        decay_rate = 0.693147 / half_life_days  # ln(2) / half_life
        recency_factor = 2.0 * exp(-decay_rate * days_ago)
        
        # Clamp to reasonable range
        return max(0.1, min(2.0, recency_factor))
    
    except (ValueError, AttributeError):
        return 1.0  # Invalid date = no adjustment
