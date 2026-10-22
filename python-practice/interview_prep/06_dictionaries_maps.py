# =============================================================
# LESSON 06: Dictionaries (Hash Maps) - THE most important
# data structure for coding interviews.
# key -> value, O(1) average insert / lookup / delete.
# Keys must be hashable (str, int, tuple...). Insertion order is kept.
# =============================================================

ages = {"alice": 30, "bob": 25}
ages["carol"] = 35            # add / update
print(ages["alice"])          # 30 (KeyError if missing!)
print(ages.get("zed"))        # None - safe lookup
print(ages.get("zed", 0))     # 0    - with default
print("bob" in ages)          # checks KEYS, O(1)
del ages["bob"]
removed = ages.pop("carol")   # remove & return value
print(ages, removed)

# --- Iterating -----------------------------------------------
scores = {"a": 3, "b": 1, "c": 2}
for key in scores:
    print(key, end=" ")
print()
for key, value in scores.items():     # most common form
    print(f"{key}={value}", end=" ")
print()
print(list(scores.keys()), list(scores.values()))

# Sort a dict by value
print(sorted(scores.items(), key=lambda kv: kv[1]))   # [('b',1),('c',2),('a',3)]
print(max(scores, key=scores.get))                    # key with max value: 'a'

# --- Counting pattern (you'll write this a LOT) --------------
counts = {}
for ch in "banana":
    counts[ch] = counts.get(ch, 0) + 1
print(counts)                         # {'b': 1, 'a': 3, 'n': 2}

# Same thing, built in:
from collections import Counter, defaultdict
c = Counter("banana")
print(c, c["a"], c["z"])              # missing keys -> 0, no KeyError
print(c.most_common(1))               # [('a', 3)]

# --- Grouping pattern ----------------------------------------
groups = defaultdict(list)            # missing keys start as []
for word in ["eat", "tea", "tan", "ate", "nat", "bat"]:
    key = "".join(sorted(word))
    groups[key].append(word)
print(list(groups.values()))          # [['eat','tea','ate'], ['tan','nat'], ['bat']]

# --- Tuples as keys (e.g. coordinates, memoization) ----------
distances = {(0, 0): 0, (0, 1): 1}
print(distances[(0, 1)])

# --- Nested dicts --------------------------------------------
user = {"name": "Sam", "skills": {"python": 7, "sql": 5}}
print(user["skills"]["python"])

# =============================================================
# INTERVIEW CLASSICS
# =============================================================
def two_sum(nums, target):
    """THE classic. Store what we've seen -> O(n)."""
    seen = {}                         # value -> index
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return []

def is_anagram(a, b):
    return Counter(a) == Counter(b)   # O(n)

def top_k_frequent(nums, k):
    return [num for num, _ in Counter(nums).most_common(k)]

def subarray_sum_equals_k(nums, k):
    """Count subarrays summing to k using prefix sums + hash map. O(n)"""
    count = 0
    prefix = 0
    seen = {0: 1}                     # prefix_sum -> how many times seen
    for x in nums:
        prefix += x
        count += seen.get(prefix - k, 0)
        seen[prefix] = seen.get(prefix, 0) + 1
    return count

def first_repeated_char(s):
    seen = set()
    for ch in s:
        if ch in seen:
            return ch
        seen.add(ch)
    return None

assert two_sum([2, 7, 11, 15], 9) == [0, 1]
assert two_sum([3, 2, 4], 6) == [1, 2]
assert is_anagram("anagram", "nagaram")
assert sorted(top_k_frequent([1, 1, 1, 2, 2, 3], 2)) == [1, 2]
assert subarray_sum_equals_k([1, 1, 1], 2) == 2
assert first_repeated_char("abcba") == "b"
print("\nLesson 06 complete ✅")
