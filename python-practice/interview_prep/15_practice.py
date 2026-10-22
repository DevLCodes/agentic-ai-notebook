# =============================================================
# LESSON 15: PRACTICE - solve these yourself!
# Replace each "pass" with your solution, then run this file.
# Treat it like an interview: 20-25 min per problem, talk out loud,
# state the Big-O at the end. Answers: 15_practice_solutions.py
# =============================================================


def valid_anagram(s, t):
    """Return True if t is an anagram of s. Hint: hash map / Counter."""
    pass


def group_anagrams(words):
    """Group words that are anagrams. Return a list of lists (any order).
    Hint: dict keyed by sorted word."""
    pass


def best_time_to_buy_sell(prices):
    """Max profit from one buy then one later sell. Hint: track min so far."""
    pass


def longest_palindrome_substring(s):
    """'babad' -> 'bab' or 'aba'. Hint: expand around each center."""
    pass


def merge_sorted_arrays(a, b):
    """Merge two sorted lists into one sorted list. Hint: two pointers."""
    pass


def find_peak(nums):
    """Return the index of any element bigger than its neighbors.
    Hint: binary search - move toward the larger neighbor. O(log n)."""
    pass


def rotting_oranges(grid):
    """0 empty, 1 fresh, 2 rotten. Each minute rot spreads 4-directionally.
    Minutes until no fresh remain, or -1. Hint: multi-source BFS."""
    pass


def min_meeting_rooms(intervals):
    """[[0,30],[5,10],[15,20]] -> 2. Hint: sort by start, min-heap of end times."""
    pass


def decode_ways(s):
    """'226' -> 3 ('BZ', 'VF', 'BBF'), with A=1..Z=26. Hint: 1D DP."""
    pass


def generate_parentheses(n):
    """All valid combos of n pairs. n=3 -> 5 results. Hint: backtracking."""
    pass


# ----------------------------- test runner -----------------------------
TESTS = [
    (valid_anagram, lambda f: f("anagram", "nagaram") is True and f("rat", "car") is False),
    (group_anagrams, lambda f: sorted(sorted(g) for g in f(["eat", "tea", "tan", "ate", "nat", "bat"]))
        == [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]]),
    (best_time_to_buy_sell, lambda f: f([7, 1, 5, 3, 6, 4]) == 5 and f([7, 6, 4, 3, 1]) == 0),
    (longest_palindrome_substring, lambda f: f("babad") in ("bab", "aba") and f("cbbd") == "bb"),
    (merge_sorted_arrays, lambda f: f([1, 4, 7], [2, 3, 9]) == [1, 2, 3, 4, 7, 9]),
    (find_peak, lambda f: f([1, 2, 3, 1]) == 2 and f([1, 2, 1, 3, 5, 6, 4]) in (1, 5)),
    (rotting_oranges, lambda f: f([[2, 1, 1], [1, 1, 0], [0, 1, 1]]) == 4 and f([[2, 1, 1], [0, 1, 1], [1, 0, 1]]) == -1),
    (min_meeting_rooms, lambda f: f([[0, 30], [5, 10], [15, 20]]) == 2 and f([[7, 10], [2, 4]]) == 1),
    (decode_ways, lambda f: f("12") == 2 and f("226") == 3 and f("06") == 0),
    (generate_parentheses, lambda f: sorted(f(3)) == ["((()))", "(()())", "(())()", "()(())", "()()()"]),
]


def run_tests(module_globals=None):
    passed = 0
    for func, check in TESTS:
        if module_globals:
            func = module_globals[func.__name__]
        try:
            ok = bool(check(func))
        except Exception as e:  # unfinished stubs return None and may raise
            ok = False
        print(f"{'✅' if ok else '❌'} {func.__name__}")
        passed += ok
    print(f"\n{passed}/{len(TESTS)} passed")


if __name__ == "__main__":
    run_tests()
