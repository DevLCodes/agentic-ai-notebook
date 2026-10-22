# =============================================================
# SOLUTIONS for 16_screening_practice.py - only peek after a real attempt!
# =============================================================
import importlib
import math
import random
from collections import Counter, defaultdict


def top_k_words(text, k):
    # O(n log n): count, then sort by (-count, word)
    counts = Counter(text.lower().split())
    return sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))[:k]


def dedupe_keep_order(items):
    # O(n): a set for fast "seen?" checks, a list to keep order
    seen = set()
    result = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


def first_unique_char(s):
    # O(n): two passes - count, then find the first count of 1
    counts = Counter(s)
    for i, ch in enumerate(s):
        if counts[ch] == 1:
            return i
    return -1


def is_balanced(s):
    # O(n): push openers; each closer must match the top of the stack
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack


def group_by(records, key):
    # O(n): defaultdict(list) creates the empty list on first use
    groups = defaultdict(list)
    for record in records:
        groups[record[key]].append(record)
    return dict(groups)


def moving_average(nums, k):
    # O(n) sliding window: add the new number, drop the old one
    if k > len(nums):
        return []
    window = sum(nums[:k])
    result = [window / k]
    for right in range(k, len(nums)):
        window += nums[right] - nums[right - k]
        result.append(window / k)
    return result


def mean_and_std(nums):
    # O(n): population variance = average squared distance from the mean
    mean = sum(nums) / len(nums)
    variance = sum((x - mean) ** 2 for x in nums) / len(nums)
    return mean, math.sqrt(variance)


def min_max_normalize(nums):
    # O(n); guard against dividing by zero when all values are equal
    low, high = min(nums), max(nums)
    if high == low:
        return [0.0] * len(nums)
    return [(x - low) / (high - low) for x in nums]


def precision_recall_f1(y_true, y_pred):
    # precision: of the predicted positives, how many were right?
    # recall:    of the real positives, how many did we find?
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return precision, recall, f1


def majority_vote(labels):
    # O(n): highest count wins; on a tie, the smallest label wins
    counts = Counter(labels)
    best = max(counts.values())
    return min(label for label, count in counts.items() if count == best)


def knn_predict(points, labels, query, k):
    # O(n log n): sort neighbours by distance, vote among the closest k
    qx, qy = query
    by_distance = sorted(
        zip(points, labels),
        key=lambda pair: math.hypot(pair[0][0] - qx, pair[0][1] - qy),
    )
    return majority_vote([label for _, label in by_distance[:k]])


def train_test_split(data, test_ratio, seed=42):
    # O(n): shuffle a copy so the caller's list is untouched
    shuffled = data[:]
    random.Random(seed).shuffle(shuffled)
    test_size = round(len(data) * test_ratio)
    return shuffled[test_size:], shuffled[:test_size]


if __name__ == "__main__":
    # Reuse the test runner from the practice file, but against these solutions
    practice = importlib.import_module("16_screening_practice")
    practice.run_tests(globals())
