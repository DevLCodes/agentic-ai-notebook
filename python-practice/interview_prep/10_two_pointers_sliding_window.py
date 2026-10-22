# =============================================================
# LESSON 10: Two Pointers & Sliding Window
# These two patterns turn many O(n^2) brute-force answers into O(n).
# =============================================================

# -------------------------------------------------------------
# TWO POINTERS - usually on a SORTED array or a string.
# Pattern A: one pointer at each end, move them inward.
# -------------------------------------------------------------
def two_sum_sorted(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target:
            return [left, right]
        if s < target:
            left += 1          # need a bigger sum
        else:
            right -= 1         # need a smaller sum
    return []

def container_with_most_water(heights):
    left, right = 0, len(heights) - 1
    best = 0
    while left < right:
        width = right - left
        best = max(best, width * min(heights[left], heights[right]))
        if heights[left] < heights[right]:   # move the shorter wall
            left += 1
        else:
            right -= 1
    return best

def three_sum(nums):
    """All unique triplets summing to 0. Sort + two pointers. O(n^2)"""
    nums.sort()
    result = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue                          # skip duplicate anchors
        left, right = i + 1, len(nums) - 1
        while left < right:
            s = nums[i] + nums[left] + nums[right]
            if s < 0:
                left += 1
            elif s > 0:
                right -= 1
            else:
                result.append([nums[i], nums[left], nums[right]])
                left += 1
                while left < right and nums[left] == nums[left - 1]:
                    left += 1
    return result

# Pattern B: slow & fast pointers moving the same direction.
def remove_duplicates_sorted(nums):
    """In place; return new length. [1,1,2,3,3] -> 3"""
    if not nums:
        return 0
    slow = 0
    for fast in range(1, len(nums)):
        if nums[fast] != nums[slow]:
            slow += 1
            nums[slow] = nums[fast]
    return slow + 1

# -------------------------------------------------------------
# SLIDING WINDOW - contiguous subarray / substring problems.
# Grow the window with "right", shrink it with "left" when invalid.
# -------------------------------------------------------------
def max_sum_window(nums, k):
    """Fixed-size window: max sum of k consecutive elements."""
    window = sum(nums[:k])
    best = window
    for right in range(k, len(nums)):
        window += nums[right] - nums[right - k]   # slide: add new, drop old
        best = max(best, window)
    return best

def longest_unique_substring(s):
    """Variable window: 'abcabcbb' -> 3 ('abc')."""
    last_seen = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1              # shrink past the duplicate
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best

def min_subarray_len(target, nums):
    """Smallest window with sum >= target."""
    left = 0
    total = 0
    best = float("inf")
    for right, x in enumerate(nums):
        total += x
        while total >= target:                    # valid -> try to shrink
            best = min(best, right - left + 1)
            total -= nums[left]
            left += 1
    return 0 if best == float("inf") else best

# TEMPLATE for variable sliding window:
#   left = 0
#   for right in range(len(arr)):
#       add arr[right] to window state
#       while window is invalid:
#           remove arr[left] from state; left += 1
#       update answer using (right - left + 1)

assert two_sum_sorted([1, 3, 4, 6, 9], 10) == [0, 4]   # 1 + 9
assert two_sum_sorted([2, 7, 11, 15], 9) == [0, 1]
assert container_with_most_water([1, 8, 6, 2, 5, 4, 8, 3, 7]) == 49
assert three_sum([-1, 0, 1, 2, -1, -4]) == [[-1, -1, 2], [-1, 0, 1]]
assert remove_duplicates_sorted([1, 1, 2, 3, 3]) == 3
assert max_sum_window([2, 1, 5, 1, 3, 2], 3) == 9
assert longest_unique_substring("abcabcbb") == 3
assert longest_unique_substring("pwwkew") == 3
assert min_subarray_len(7, [2, 3, 1, 2, 4, 3]) == 2
print("\nLesson 10 complete ✅")
