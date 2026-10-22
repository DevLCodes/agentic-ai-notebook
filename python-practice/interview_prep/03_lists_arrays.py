# =============================================================
# LESSON 03: Lists (Python's "array")
# A list is a dynamic array: ordered, mutable, allows duplicates.
# =============================================================

nums = [5, 3, 8, 1]
empty = []
zeros = [0] * 5                 # [0, 0, 0, 0, 0]

# --- Access & slicing (same rules as strings) ----------------
print(nums[0], nums[-1])        # 5 1
print(nums[1:3])                # [3, 8]
print(nums[::-1])               # reversed copy
copy = nums[:]                  # shallow copy (also: list(nums), nums.copy())

# --- Adding / removing ---------------------------------------
nums.append(10)                 # add to end            O(1)
nums.insert(0, 99)              # insert at index       O(n)  - shifts elements
nums.extend([7, 7])             # add many
print(nums)
last = nums.pop()               # remove & return last  O(1)
first = nums.pop(0)             # remove at index       O(n)  - use deque instead!
nums.remove(7)                  # remove first matching VALUE  O(n)
print(nums, last, first)

# --- Searching -----------------------------------------------
print(8 in nums)                # membership test: O(n) for lists!
print(nums.index(8))            # position of value (ValueError if missing)
print(nums.count(5))

# --- Sorting -------------------------------------------------
data = [3, 1, 2]
data.sort()                     # in place, returns None
print(data)
print(sorted([3, 1, 2], reverse=True))   # returns NEW list
words = ["banana", "kiwi", "apple"]
print(sorted(words, key=len))            # sort by custom key
pairs = [(1, "b"), (0, "z"), (1, "a")]
print(sorted(pairs, key=lambda p: (-p[0], p[1])))  # multi-key: desc first, asc second

# --- Built-ins you'll use constantly -------------------------
print(len(data), sum(data), min(data), max(data))
print(list(reversed(data)))
print(list(zip([1, 2, 3], ["a", "b", "c"])))  # pair up two lists
print(any(x > 2 for x in data), all(x > 0 for x in data))

# --- 2D lists (grids / matrices) -----------------------------
rows, cols = 3, 4
grid = [[0] * cols for _ in range(rows)]   # CORRECT
# grid = [[0] * cols] * rows               # WRONG! all rows are the SAME list
grid[0][0] = 1
print(grid)
matrix = [[1, 2, 3], [4, 5, 6]]
transposed = [list(row) for row in zip(*matrix)]
print(transposed)               # [[1, 4], [2, 5], [3, 6]]

# --- Unpacking -----------------------------------------------
first, *middle, last = [1, 2, 3, 4, 5]
print(first, middle, last)      # 1 [2, 3, 4] 5

# --- Big-O cheat sheet for lists ------------------------------
# index / append / pop()         O(1)
# insert / pop(0) / remove / in  O(n)
# sort                           O(n log n)
# slicing nums[a:b]              O(b - a)

# =============================================================
# INTERVIEW CLASSICS
# =============================================================
def max_subarray(nums):
    """Kadane's algorithm: largest sum of a contiguous subarray. O(n)"""
    best = current = nums[0]
    for x in nums[1:]:
        current = max(x, current + x)   # extend the run, or start fresh
        best = max(best, current)
    return best

def move_zeros(nums):
    """Move all 0s to the end in place, keeping order of others."""
    write = 0
    for read in range(len(nums)):
        if nums[read] != 0:
            nums[write], nums[read] = nums[read], nums[write]
            write += 1
    return nums

def product_except_self(nums):
    """Prefix/suffix products, no division. O(n)"""
    n = len(nums)
    result = [1] * n
    prefix = 1
    for i in range(n):
        result[i] = prefix
        prefix *= nums[i]
    suffix = 1
    for i in range(n - 1, -1, -1):
        result[i] *= suffix
        suffix *= nums[i]
    return result

def rotate(nums, k):
    k %= len(nums)
    return nums[-k:] + nums[:-k]

assert max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6
assert move_zeros([0, 1, 0, 3, 12]) == [1, 3, 12, 0, 0]
assert product_except_self([1, 2, 3, 4]) == [24, 12, 8, 6]
assert rotate([1, 2, 3, 4, 5], 2) == [4, 5, 1, 2, 3]
print("\nLesson 03 complete ✅")
