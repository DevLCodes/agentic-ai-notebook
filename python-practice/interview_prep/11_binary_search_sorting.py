# =============================================================
# LESSON 11: Binary Search & Sorting
# Binary search: O(log n) on SORTED data (or any monotonic yes/no).
# =============================================================
import bisect

def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

def lower_bound(nums, target):
    """First index where nums[i] >= target (insert position)."""
    left, right = 0, len(nums)        # note: right = len, and "<"
    while left < right:
        mid = (left + right) // 2
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid
    return left

# Python's built-in version:
data = [1, 3, 3, 3, 7]
print(bisect.bisect_left(data, 3), bisect.bisect_right(data, 3))   # 1 4
print(lower_bound(data, 3))

def search_rotated(nums, target):
    """[4,5,6,7,0,1,2], 0 -> 4. One half is always sorted."""
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[left] <= nums[mid]:               # left half sorted
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:                                     # right half sorted
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1
    return -1

def min_eating_speed(piles, hours):
    """'Binary search on the answer': smallest speed that finishes in time."""
    def can_finish(speed):
        return sum((p + speed - 1) // speed for p in piles) <= hours   # ceil div
    left, right = 1, max(piles)
    while left < right:
        mid = (left + right) // 2
        if can_finish(mid):
            right = mid
        else:
            left = mid + 1
    return left

# =============================================================
# SORTING - know how these work; in interviews you'll use sorted()
# (Timsort, O(n log n), stable).
# =============================================================
def merge_sort(nums):
    if len(nums) <= 1:
        return nums
    mid = len(nums) // 2
    left, right = merge_sort(nums[:mid]), merge_sort(nums[mid:])
    merged, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i]); i += 1
        else:
            merged.append(right[j]); j += 1
    return merged + left[i:] + right[j:]

def quick_sort(nums):
    if len(nums) <= 1:
        return nums
    pivot = nums[len(nums) // 2]
    return (quick_sort([x for x in nums if x < pivot])
            + [x for x in nums if x == pivot]
            + quick_sort([x for x in nums if x > pivot]))

def merge_intervals(intervals):
    """Sort-first pattern. [[1,3],[2,6],[8,10]] -> [[1,6],[8,10]]"""
    intervals.sort(key=lambda iv: iv[0])
    merged = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged

assert binary_search([1, 3, 5, 7, 9], 7) == 3
assert binary_search([1, 3, 5], 4) == -1
assert lower_bound([1, 3, 5], 4) == 2
assert search_rotated([4, 5, 6, 7, 0, 1, 2], 0) == 4
assert min_eating_speed([3, 6, 7, 11], 8) == 4
assert merge_sort([5, 2, 9, 1]) == [1, 2, 5, 9]
assert quick_sort([3, 3, 1, 8]) == [1, 3, 3, 8]
assert merge_intervals([[1, 3], [2, 6], [8, 10], [15, 18]]) == [[1, 6], [8, 10], [15, 18]]
print("\nLesson 11 complete ✅")
