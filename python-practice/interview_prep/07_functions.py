# =============================================================
# LESSON 07: Functions, Lambdas, Scope, Recursion basics
# =============================================================

def greet(name, greeting="Hello"):     # default argument
    """Docstring: describe what the function does."""
    return f"{greeting}, {name}!"

print(greet("Sam"))
print(greet("Sam", greeting="Hi"))    # keyword argument

# --- *args and **kwargs --------------------------------------
def total(*args):                      # any number of positional args -> tuple
    return sum(args)

def describe(**kwargs):                # any number of keyword args -> dict
    return ", ".join(f"{k}={v}" for k, v in kwargs.items())

print(total(1, 2, 3), describe(lang="python", level=3))

# --- DEFAULT ARGUMENT TRAP (classic interview question) ------
def bad_append(item, bucket=[]):       # the [] is created ONCE, then shared!
    bucket.append(item)
    return bucket

def good_append(item, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket

print(bad_append(1), bad_append(2))    # [1, 2] [1, 2]  <- surprise!
print(good_append(1), good_append(2))  # [1] [2]

# --- Functions are objects -----------------------------------
def apply(func, value):
    return func(value)

print(apply(len, "hello"))
square = lambda x: x * x               # anonymous one-line function
print(apply(square, 7))
print(list(map(square, [1, 2, 3])))
print(list(filter(lambda x: x > 1, [1, 2, 3])))

# --- Scope ---------------------------------------------------
def make_counter():
    count = 0
    def increment():
        nonlocal count                 # modify enclosing variable
        count += 1
        return count
    return increment

counter = make_counter()
counter(); counter()
print("counter:", counter())           # 3

# --- Type hints (optional, but look professional) ------------
from typing import List, Optional

def find_index(nums: List[int], target: int) -> Optional[int]:
    for i, x in enumerate(nums):
        if x == target:
            return i
    return None

print(find_index([4, 5, 6], 6))

# =============================================================
# RECURSION - a function that calls itself.
# Always need: (1) a BASE CASE, (2) progress toward it.
# =============================================================
def factorial(n):
    if n <= 1:                         # base case
        return 1
    return n * factorial(n - 1)        # recursive case

def fib_slow(n):                       # O(2^n) - exponential!
    if n < 2:
        return n
    return fib_slow(n - 1) + fib_slow(n - 2)

# Memoization: cache results -> O(n)
from functools import lru_cache

@lru_cache(maxsize=None)               # a "decorator" wraps the function
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(factorial(5), fib_slow(10), fib(80))

# Generate all subsets (backtracking preview - see lesson 13)
def subsets(nums):
    result = []
    def backtrack(start, current):
        result.append(current[:])      # copy!
        for i in range(start, len(nums)):
            current.append(nums[i])
            backtrack(i + 1, current)
            current.pop()              # undo the choice
    backtrack(0, [])
    return result

print(subsets([1, 2, 3]))

# --- Generators: yield values lazily -------------------------
def countdown(n):
    while n > 0:
        yield n
        n -= 1
print(list(countdown(3)))

assert factorial(5) == 120
assert fib(10) == 55
assert len(subsets([1, 2, 3])) == 8
print("\nLesson 07 complete ✅")
