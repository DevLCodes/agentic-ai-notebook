# =============================================================
# SOLUTIONS for 15_practice.py - only peek after a real attempt!
# =============================================================
import heapq
import importlib
from collections import Counter, defaultdict, deque


def valid_anagram(s, t):
    # O(n) time, O(1) space (alphabet is fixed size)
    return Counter(s) == Counter(t)


def group_anagrams(words):
    # O(n * k log k) where k = word length
    groups = defaultdict(list)
    for w in words:
        groups["".join(sorted(w))].append(w)
    return list(groups.values())


def best_time_to_buy_sell(prices):
    # O(n): best profit if we sell today = today - cheapest so far
    lowest = float("inf")
    best = 0
    for p in prices:
        lowest = min(lowest, p)
        best = max(best, p - lowest)
    return best


def longest_palindrome_substring(s):
    # O(n^2): every palindrome has a center (a char, or a gap between two)
    def expand(left, right):
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        return s[left + 1:right]
    best = ""
    for i in range(len(s)):
        for candidate in (expand(i, i), expand(i, i + 1)):
            if len(candidate) > len(best):
                best = candidate
    return best


def merge_sorted_arrays(a, b):
    # O(n + m)
    i = j = 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    return out + a[i:] + b[j:]


def find_peak(nums):
    # O(log n): if mid < mid+1, a peak must exist to the right
    left, right = 0, len(nums) - 1
    while left < right:
        mid = (left + right) // 2
        if nums[mid] < nums[mid + 1]:
            left = mid + 1
        else:
            right = mid
    return left


def rotting_oranges(grid):
    # O(rows * cols): BFS starting from ALL rotten oranges at once
    rows, cols = len(grid), len(grid[0])
    queue = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1
    minutes = 0
    while queue and fresh:
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc))
        minutes += 1
    return minutes if fresh == 0 else -1


def min_meeting_rooms(intervals):
    # O(n log n): heap holds end times of meetings currently using a room
    ends = []
    for start, end in sorted(intervals):
        if ends and ends[0] <= start:
            heapq.heapreplace(ends, end)   # reuse the room that freed up first
        else:
            heapq.heappush(ends, end)
    return len(ends)


def decode_ways(s):
    # O(n): dp[i] = ways to decode s[:i]
    if not s:
        return 0
    prev2, prev1 = 1, 1                    # dp[i-2], dp[i-1]
    for i in range(1, len(s) + 1):
        current = 0
        if s[i - 1] != "0":
            current += prev1
        if i >= 2 and 10 <= int(s[i - 2:i]) <= 26:
            current += prev2
        prev2, prev1 = prev1, current
    return prev1


def generate_parentheses(n):
    # Backtracking: add "(" while we have some left; ")" only if it stays valid
    result = []
    def backtrack(path, opened, closed):
        if len(path) == 2 * n:
            result.append("".join(path))
            return
        if opened < n:
            path.append("(")
            backtrack(path, opened + 1, closed)
            path.pop()
        if closed < opened:
            path.append(")")
            backtrack(path, opened, closed + 1)
            path.pop()
    backtrack([], 0, 0)
    return result


if __name__ == "__main__":
    # Reuse the test runner from the practice file, but against these solutions
    practice = importlib.import_module("15_practice")
    practice.run_tests(globals())
