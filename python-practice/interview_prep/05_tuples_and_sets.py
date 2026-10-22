# =============================================================
# LESSON 05: Tuples & Sets
# =============================================================

# --- TUPLES: ordered, IMMUTABLE ------------------------------
point = (3, 4)
single = (5,)            # the comma makes it a tuple; (5) is just 5
x, y = point             # unpacking
print(point[0], x, y)
# point[0] = 10          # TypeError - tuples can't be changed

# Why use tuples?
# 1) Return multiple values from a function
def min_max(nums):
    return min(nums), max(nums)
lo, hi = min_max([4, 1, 9])
print(lo, hi)

# 2) They're HASHABLE -> can be dict keys or set members (lists can't!)
visited = set()
visited.add((0, 0))      # store grid coordinates
print((0, 0) in visited)

# 3) Tuples compare element by element -> great for sorting/heaps
print((1, "b") < (1, "c") < (2, "a"))   # True

# =============================================================
# SETS: unordered, UNIQUE items, O(1) average lookup
# =============================================================
s = {1, 2, 3}
empty_set = set()        # NOT {} - that's an empty dict!
s.add(4)
s.add(2)                 # duplicate ignored
s.remove(1)              # KeyError if missing
s.discard(100)           # no error if missing
print(s, len(s), 3 in s)

# Remove duplicates from a list (order not kept)
print(set([1, 1, 2, 3, 3]))
# Remove duplicates AND keep order
print(list(dict.fromkeys([3, 1, 3, 2, 1])))   # [3, 1, 2]

# --- Set math ------------------------------------------------
a, b = {1, 2, 3, 4}, {3, 4, 5}
print(a | b)   # union         {1, 2, 3, 4, 5}
print(a & b)   # intersection  {3, 4}
print(a - b)   # difference    {1, 2}
print(a ^ b)   # symmetric diff {1, 2, 5}
print({1, 2} <= a)   # subset

# --- Why sets matter in interviews ---------------------------
# "x in list" is O(n). "x in set" is O(1).
# Converting a list to a set first can turn O(n^2) into O(n).
big_list = list(range(100_000))
big_set = set(big_list)
print(99_999 in big_set)   # instant

# =============================================================
# INTERVIEW CLASSICS
# =============================================================
def contains_duplicate(nums):
    return len(nums) != len(set(nums))

def longest_consecutive(nums):
    """[100, 4, 200, 1, 3, 2] -> 4 (1,2,3,4). O(n) using a set."""
    num_set = set(nums)
    best = 0
    for n in num_set:
        if n - 1 not in num_set:          # n is the START of a run
            length = 1
            while n + length in num_set:
                length += 1
            best = max(best, length)
    return best

def intersection(nums1, nums2):
    return sorted(set(nums1) & set(nums2))

assert contains_duplicate([1, 2, 3, 1])
assert not contains_duplicate([1, 2, 3])
assert longest_consecutive([100, 4, 200, 1, 3, 2]) == 4
assert intersection([1, 2, 2, 1], [2, 2]) == [2]
print("\nLesson 05 complete ✅")
