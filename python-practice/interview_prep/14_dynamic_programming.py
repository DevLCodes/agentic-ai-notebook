# =============================================================
# LESSON 14: Dynamic Programming (DP)
# DP = recursion + remembering answers to subproblems.
# Recipe:
#   1. Define state:   dp[i] = "answer for the first i items" (say it out loud!)
#   2. Recurrence:     how dp[i] is built from smaller states
#   3. Base cases
#   4. Order:          fill so dependencies are computed first
#   5. (Optional) shrink memory to O(1) if you only need the last few states
# =============================================================
from functools import lru_cache

# --- 1D DP ---------------------------------------------------
def climb_stairs(n):
    """Ways to climb n stairs taking 1 or 2 steps. dp[i] = dp[i-1] + dp[i-2]"""
    a, b = 1, 1
    for _ in range(n):
        a, b = b, a + b
    return a

def house_robber(nums):
    """Max sum with no two adjacent. dp[i] = max(dp[i-1], dp[i-2] + nums[i])"""
    prev2, prev1 = 0, 0
    for x in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + x)
    return prev1

def coin_change(coins, amount):
    """Fewest coins to make amount. dp[a] = min(dp[a - c] + 1)"""
    dp = [0] + [float("inf")] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] != float("inf") else -1

def longest_increasing_subsequence(nums):
    """O(n^2) DP: dp[i] = longest LIS ending at i."""
    dp = [1] * len(nums)
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp, default=0)

def word_break(s, words):
    word_set = set(words)
    dp = [True] + [False] * len(s)       # dp[i]: s[:i] can be segmented
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in word_set:
                dp[i] = True
                break
    return dp[len(s)]

# --- 2D DP ---------------------------------------------------
def unique_paths(rows, cols):
    dp = [[1] * cols for _ in range(rows)]
    for r in range(1, rows):
        for c in range(1, cols):
            dp[r][c] = dp[r - 1][c] + dp[r][c - 1]
    return dp[-1][-1]

def longest_common_subsequence(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[-1][-1]

def edit_distance(a, b):
    """Min insert/delete/replace ops to turn a into b."""
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j],      # delete
                                   dp[i][j - 1],      # insert
                                   dp[i - 1][j - 1])  # replace
    return dp[m][n]

# --- Top-down version (often easier to come up with first) ---
def knapsack(weights, values, capacity):
    @lru_cache(maxsize=None)
    def best(i, cap):
        if i == len(weights):
            return 0
        skip = best(i + 1, cap)
        take = 0
        if weights[i] <= cap:
            take = values[i] + best(i + 1, cap - weights[i])
        return max(skip, take)
    return best(0, capacity)

assert climb_stairs(5) == 8
assert house_robber([2, 7, 9, 3, 1]) == 12
assert coin_change([1, 2, 5], 11) == 3
assert coin_change([2], 3) == -1
assert longest_increasing_subsequence([10, 9, 2, 5, 3, 7, 101, 18]) == 4
assert word_break("leetcode", ["leet", "code"])
assert unique_paths(3, 7) == 28
assert longest_common_subsequence("abcde", "ace") == 3
assert edit_distance("horse", "ros") == 3
assert knapsack((1, 3, 4), (15, 20, 30), 4) == 35
print("\nLesson 14 complete ✅")
