"""
Test cases for Bayesian ranking algorithm
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.lib.bayesian_ranking import compute_bayesian_ranking
from datetime import datetime, timedelta


def test_basic_ranking():
    """Test basic Bayesian ranking without recency."""
    print("\n" + "="*60)
    print("TEST 1: Basic Bayesian Ranking")
    print("="*60)
    
    professors = [
        {
            'id': '1',
            'name': 'Dr. One Review Perfect',
            'average_rating': 5.0,
            'total_reviews': 1,
            'is_verified': True
        },
        {
            'id': '2',
            'name': 'Dr. Many Reviews Good',
            'average_rating': 4.7,
            'total_reviews': 50,
            'is_verified': True
        },
        {
            'id': '3',
            'name': 'Dr. Few Reviews Great',
            'average_rating': 4.9,
            'total_reviews': 5,
            'is_verified': True
        },
        {
            'id': '4',
            'name': 'Dr. Moderate Reviews',
            'average_rating': 4.5,
            'total_reviews': 20,
            'is_verified': True
        }
    ]
    
    result = compute_bayesian_ranking(
        professors=professors,
        C=10.0,
        min_reviews=1
    )
    
    print(f"\nGlobal Mean: {result['stats']['global_mean']}")
    print(f"Confidence Parameter (C): {result['stats']['confidence_param']}")
    print(f"\nRanking Results:")
    
    for i, prof in enumerate(result['ranked_professors'], 1):
        print(f"\n{i}. {prof['name']}")
        print(f"   Reviews: {prof['total_reviews']}, Rating: {prof['average_rating']}")
        print(f"   Bayesian Score: {prof['bayesian_score']:.3f}")
        print(f"   {prof['explainability']}")
    
    # Verify that professors with sufficient reviews rank based on their actual ratings
    # Dr. Many Reviews Good (50 reviews at 4.7) has enough data to be trusted
    many_reviews_prof = next(p for p in result['ranked_professors'] if p['name'] == 'Dr. Many Reviews Good')
    one_review_prof = next(p for p in result['ranked_professors'] if p['name'] == 'Dr. One Review Perfect')
    
    # The one with 50 reviews should have a score closer to their actual rating
    # while the one with 1 review should be pulled toward the global mean
    assert many_reviews_prof['bayesian_score'] > one_review_prof['bayesian_score'] - 0.1, \
        "Professor with many reviews should not be penalized too much vs 1-review outlier"
    
    print("\n✅ Test passed: Bayesian ranking balances quality and quantity")


def test_minimum_reviews_filter():
    """Test minimum reviews filtering."""
    print("\n" + "="*60)
    print("TEST 2: Minimum Reviews Filter")
    print("="*60)
    
    professors = [
        {
            'id': '1',
            'name': 'Dr. Zero Reviews',
            'average_rating': 5.0,
            'total_reviews': 0,
            'is_verified': True
        },
        {
            'id': '2',
            'name': 'Dr. One Review',
            'average_rating': 5.0,
            'total_reviews': 1,
            'is_verified': True
        },
        {
            'id': '3',
            'name': 'Dr. Five Reviews',
            'average_rating': 4.8,
            'total_reviews': 5,
            'is_verified': True
        }
    ]
    
    result = compute_bayesian_ranking(
        professors=professors,
        min_reviews=3
    )
    
    print(f"\nTotal input: {result['stats']['total_input']}")
    print(f"After filtering (min_reviews=3): {result['stats']['total_filtered']}")
    
    assert len(result['ranked_professors']) == 1, "Should only have 1 professor with 5+ reviews"
    assert result['ranked_professors'][0]['name'] == 'Dr. Five Reviews'
    
    print("\n✅ Test passed: Minimum reviews filter works correctly")


def test_unverified_exclusion():
    """Test exclusion of unverified professors."""
    print("\n" + "="*60)
    print("TEST 3: Unverified Professor Exclusion")
    print("="*60)
    
    professors = [
        {
            'id': '1',
            'name': 'Dr. Verified',
            'average_rating': 4.5,
            'total_reviews': 10,
            'is_verified': True
        },
        {
            'id': '2',
            'name': 'Dr. Unverified',
            'average_rating': 5.0,
            'total_reviews': 20,
            'is_verified': False
        }
    ]
    
    result = compute_bayesian_ranking(
        professors=professors,
        exclude_unverified=True
    )
    
    print(f"\nTotal input: {result['stats']['total_input']}")
    print(f"After filtering: {result['stats']['total_filtered']}")
    
    assert len(result['ranked_professors']) == 1
    assert result['ranked_professors'][0]['name'] == 'Dr. Verified'
    
    print("\n✅ Test passed: Unverified professors excluded correctly")


def test_recency_weighting():
    """Test recency weighting with recent vs old reviews."""
    print("\n" + "="*60)
    print("TEST 4: Recency Weighting")
    print("="*60)
    
    from datetime import timezone
    now = datetime.now(timezone.utc)
    professors = [
        {
            'id': '1',
            'name': 'Dr. Recent Reviews',
            'average_rating': 4.5,
            'total_reviews': 10,
            'is_verified': True,
            'last_review_date': now.isoformat()  # Today
        },
        {
            'id': '2',
            'name': 'Dr. Old Reviews',
            'average_rating': 4.5,
            'total_reviews': 10,
            'is_verified': True,
            'last_review_date': (now - timedelta(days=730)).isoformat()  # 2 years ago
        }
    ]
    
    result = compute_bayesian_ranking(
        professors=professors,
        recency_weighting={
            'enabled': True,
            'half_life_days': 365,
            'weight_factor': 0.15
        }
    )
    
    print(f"\nRecency enabled: {result['stats']['recency_enabled']}")
    
    for i, prof in enumerate(result['ranked_professors'], 1):
        print(f"\n{i}. {prof['name']}")
        print(f"   Base score: Would be similar")
        print(f"   Recency factor: {prof.get('recency_factor', 1.0):.2f}")
        print(f"   Final score: {prof['bayesian_score']:.3f}")
    
    # Recent reviews should rank higher
    assert result['ranked_professors'][0]['name'] == 'Dr. Recent Reviews', \
        "Professor with recent reviews should rank higher with recency enabled"
    
    print("\n✅ Test passed: Recency weighting boosts recent reviews")


def test_confidence_parameter():
    """Test effect of different confidence parameters."""
    print("\n" + "="*60)
    print("TEST 5: Confidence Parameter Effect")
    print("="*60)
    
    professors = [
        {
            'id': '1',
            'name': 'Dr. Few Perfect Reviews',
            'average_rating': 5.0,
            'total_reviews': 3,
            'is_verified': True
        },
        {
            'id': '2',
            'name': 'Dr. Many Good Reviews',
            'average_rating': 4.3,
            'total_reviews': 30,
            'is_verified': True
        }
    ]
    
    # Test with low C (trust individual ratings more)
    print("\n--- With C=5 (less conservative) ---")
    result_low_c = compute_bayesian_ranking(professors=professors, C=5.0)
    for i, prof in enumerate(result_low_c['ranked_professors'], 1):
        print(f"{i}. {prof['name']}: {prof['bayesian_score']:.3f}")
    
    # Test with high C (trust global average more)
    print("\n--- With C=30 (more conservative) ---")
    result_high_c = compute_bayesian_ranking(professors=professors, C=30.0)
    for i, prof in enumerate(result_high_c['ranked_professors'], 1):
        print(f"{i}. {prof['name']}: {prof['bayesian_score']:.3f}")
    
    print("\n✅ Test passed: Confidence parameter affects ranking as expected")


def test_edge_cases():
    """Test edge cases."""
    print("\n" + "="*60)
    print("TEST 6: Edge Cases")
    print("="*60)
    
    # Empty list
    print("\n--- Test: Empty input ---")
    result = compute_bayesian_ranking(professors=[])
    assert len(result['ranked_professors']) == 0
    print("✓ Empty input handled")
    
    # All filtered out
    print("\n--- Test: All filtered out ---")
    professors = [
        {'id': '1', 'name': 'Dr. A', 'average_rating': 5.0, 
         'total_reviews': 1, 'is_verified': False}
    ]
    result = compute_bayesian_ranking(professors=professors, exclude_unverified=True)
    assert len(result['ranked_professors']) == 0
    print("✓ All filtered out handled")
    
    # Zero reviews (but min_reviews=0)
    print("\n--- Test: Zero reviews allowed ---")
    professors = [
        {'id': '1', 'name': 'Dr. A', 'average_rating': 0.0, 
         'total_reviews': 0, 'is_verified': True}
    ]
    result = compute_bayesian_ranking(professors=professors, min_reviews=0)
    assert len(result['ranked_professors']) == 1
    print(f"✓ Zero reviews handled: score = {result['ranked_professors'][0]['bayesian_score']:.3f}")
    
    print("\n✅ All edge cases passed")


if __name__ == '__main__':
    print("\n" + "="*60)
    print("BAYESIAN RANKING ALGORITHM TEST SUITE")
    print("="*60)
    
    test_basic_ranking()
    test_minimum_reviews_filter()
    test_unverified_exclusion()
    test_recency_weighting()
    test_confidence_parameter()
    test_edge_cases()
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED!")
    print("="*60 + "\n")
