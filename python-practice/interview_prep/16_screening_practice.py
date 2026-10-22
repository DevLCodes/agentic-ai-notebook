# =============================================================
# LESSON 16: SCREENING-STYLE PYTHON PRACTICE
# The kind of short problem asked in a 30-minute ML screening call:
# plain Python (no numpy/pandas), 10-15 minutes each.
#
# How to practise each one, like the real call:
#   1. Ask one clarifying question out loud (empty input? ties?)
#   2. Say your approach and its Big-O BEFORE coding
#   3. Code it, then trace one example by hand
#   4. Run this file to check
# Answers: 16_screening_solutions.py (only after a real attempt!)
# =============================================================
import random
import math
from collections import Counter


# ---------- Part A: core data structures (maps, sets, stacks) ----------
#most_frequent_word(["apple", "banana", "apple", "cherry", "banana"])  →  "apple"
#most_frequent_word(["x", "y", "y", "x"])                              →  "x"
def most_freq_word(words):
    return Counter(words).most_common(1)[0][0]

def top_k_words(text, k):

    words = sorted(text.lower().split())
    c = Counter(words).most_common(k)
    return c

def dedupe_keep_order(items):
    """Remove duplicates but keep the first-seen order.
    [3, 1, 3, 2, 1] -> [3, 1, 2]"""
    unique_set = set()
    for index, item in enumerate(items):
        if item in unique_set:
            items.pop(index)
        else:
            unique_set.add(item)

    return items


def first_unique_char(s):
    """Index of the first character that appears exactly once, or -1.
    "leetcode" -> 0, "aabb" -> -1"""
    count = Counter(s)
    for index, letter in enumerate(list(s)):
       if count[letter] == 1:
               return index
    return -1

def is_balanced(s):
    """True if every bracket ()[]{} is closed in the right order.
    Other characters are ignored. "f(a[1]) {x}" -> True, "(]" -> False"""
    pass


def group_by(records, key):
    """Group a list of dicts by the value of `key`, keeping input order.
    group_by([{"team": "a", "n": 1}, {"team": "b", "n": 2}, {"team": "a", "n": 3}], "team")
      -> {"a": [{"team": "a", "n": 1}, {"team": "a", "n": 3}], "b": [{"team": "b", "n": 2}]}"""
    pass


def moving_average(nums, k):
    """Average of every window of k consecutive numbers, in O(n).
    moving_average([1, 2, 3, 4, 5], 2) -> [1.5, 2.5, 3.5, 4.5]
    Return [] if k is larger than the list."""
    pass


# ---------- Part B: ML and statistics in plain Python ----------

def mean_and_std(nums):
    """Return (mean, population standard deviation).
    mean_and_std([2, 4, 4, 4, 5, 5, 7, 9]) -> (5.0, 2.0)"""
    mean = sum(nums) / len(nums)
    total_dist = 0
    for num in nums:
        dist = mean - num
        dist *= dist
        total_dist += dist

    variance = total_dist / len(nums)
    return (mean, math.sqrt(variance))


def min_max_normalize(nums):
    """Scale values to the range [0, 1]: (x - min) / (max - min).
    If every value is the same, return all zeros.
    [10, 20, 30] -> [0.0, 0.5, 1.0]"""
    pass


def precision_recall_f1(y_true, y_pred):
    """Binary labels (1 = positive). Return (precision, recall, f1).
    If a denominator is 0, that metric is 0.0.
    y_true = [1, 0, 1, 1, 0], y_pred = [1, 1, 0, 1, 0] -> (0.667, 0.667, 0.667) approx."""
    pass


def majority_vote(labels):
    """Most common label. On a tie, return the label that is smallest
    when sorted. ["cat", "dog", "dog", "cat", "bird"] -> "cat" """
    pass


def knn_predict(points, labels, query, k):
    """k-nearest-neighbours classifier.
    points: list of (x, y) tuples, labels: their labels, query: an (x, y) tuple.
    Find the k closest points (Euclidean distance) and return majority_vote
    of their labels."""
    pass


def train_test_split(data, test_ratio, seed=42):
    """Shuffle a COPY of data with random.Random(seed), then split it.
    The test set gets round(len(data) * test_ratio) items.
    Return (train, test). Don't modify the input list."""
    pass


# ----------------------------- test runner -----------------------------
def _close(a, b, tol=1e-3):
    return all(abs(x - y) < tol for x, y in zip(a, b)) and len(a) == len(b)


def _split_ok(f):
    data = list(range(10))
    train, test = f(data, 0.3)
    return (len(test) == 3 and len(train) == 7
            and sorted(train + test) == data
            and data == list(range(10))           # input not modified
            and f(data, 0.3) == (train, test))    # same seed -> same split


TESTS = [
    (top_k_words, lambda f: f("the cat the dog the cat", 2) == [("the", 3), ("cat", 2)]
        and f("B a b A c", 2) == [("a", 2), ("b", 2)]),
    (dedupe_keep_order, lambda f: f([3, 1, 3, 2, 1]) == [3, 1, 2] and f([]) == []),
    (first_unique_char, lambda f: f("leetcode") == 0 and f("loveleetcode") == 2 and f("aabb") == -1),
    (is_balanced, lambda f: f("f(a[1]) {x}") and not f("(]") and not f("((") and f("")),
    (group_by, lambda f: f([{"team": "a", "n": 1}, {"team": "b", "n": 2}, {"team": "a", "n": 3}], "team")
        == {"a": [{"team": "a", "n": 1}, {"team": "a", "n": 3}], "b": [{"team": "b", "n": 2}]}),
    (moving_average, lambda f: _close(f([1, 2, 3, 4, 5], 2), [1.5, 2.5, 3.5, 4.5])
        and _close(f([4, 8, 6], 3), [6.0]) and f([1, 2], 3) == []),
    (mean_and_std, lambda f: _close(f([2, 4, 4, 4, 5, 5, 7, 9]), (5.0, 2.0))),
    (min_max_normalize, lambda f: _close(f([10, 20, 30]), [0.0, 0.5, 1.0]) and f([5, 5]) == [0.0, 0.0]),
    (precision_recall_f1, lambda f: _close(f([1, 0, 1, 1, 0], [1, 1, 0, 1, 0]), (2 / 3, 2 / 3, 2 / 3))
        and _close(f([1, 1], [0, 0]), (0.0, 0.0, 0.0))),
    (majority_vote, lambda f: f(["cat", "dog", "dog", "cat", "bird"]) == "cat" and f([2, 2, 1]) == 2),
    (knn_predict, lambda f: f([(0, 0), (1, 0), (5, 5), (6, 5), (5, 6)], ["a", "a", "b", "b", "b"], (0.5, 0.2), 2) == "a"
        and f([(0, 0), (1, 0), (5, 5), (6, 5), (5, 6)], ["a", "a", "b", "b", "b"], (4, 4), 3) == "b"),
    (train_test_split, _split_ok),
]


def run_tests(module_globals=None):
    passed = 0
    for func, check in TESTS:
        if module_globals:
            func = module_globals[func.__name__]
        try:
            ok = bool(check(func))
        except Exception:  # unfinished stubs return None and may raise
            ok = False
        print(f"{'✅' if ok else '❌'} {func.__name__}")
        passed += ok
    print(f"\n{passed}/{len(TESTS)} passed")


if __name__ == "__main__":
    run_tests()
