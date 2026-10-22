# =============================================================
# LESSON 04: Loops & Comprehensions
# =============================================================

# --- range(start, stop, step) - stop is EXCLUDED --------------
print(list(range(5)))           # [0, 1, 2, 3, 4]
print(list(range(2, 10, 3)))    # [2, 5, 8]
print(list(range(5, 0, -1)))    # [5, 4, 3, 2, 1]  counting down

# --- for loops -----------------------------------------------
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:                       # loop over values
    print(fruit, end=" ")
print()
for i, fruit in enumerate(fruits):         # index + value (preferred over range(len()))
    print(i, fruit, end=" | ")
print()
for i, fruit in enumerate(fruits, start=1):
    print(i, fruit, end=" | ")
print()
prices = [1.2, 0.5, 3.0]
for fruit, price in zip(fruits, prices):   # two lists in parallel
    print(f"{fruit}=${price}", end=" ")
print()

# --- while loops ---------------------------------------------
n = 10
steps = 0
while n != 1:                      # loop until a condition changes
    n = n // 2 if n % 2 == 0 else 3 * n + 1
    steps += 1
print("collatz steps:", steps)

# --- break / continue / else ---------------------------------
for x in range(10):
    if x % 2 == 0:
        continue                   # skip to next iteration
    if x > 6:
        break                      # exit loop
    print(x, end=" ")              # 1 3 5
print()

# for...else: the else runs only if the loop did NOT break
for x in [1, 3, 5]:
    if x % 2 == 0:
        print("found an even number")
        break
else:
    print("no even numbers")

def is_prime(n):
    if n < 2:
        return False
    for d in range(2, int(n ** 0.5) + 1):
        if n % d == 0:
            return False
    return True
print([p for p in range(20) if is_prime(p)])

# --- Nested loops (watch the Big-O: usually O(n^2)) ----------
for i in range(3):
    for j in range(i + 1, 3):      # every unique pair
        print((i, j), end=" ")
print()

# --- Looping over a grid with neighbors (VERY common) --------
grid = [[1, 2, 3],
        [4, 5, 6]]
ROWS, COLS = len(grid), len(grid[0])
DIRECTIONS = [(0, 1), (1, 0), (0, -1), (-1, 0)]   # right, down, left, up
r, c = 0, 1
neighbors = []
for dr, dc in DIRECTIONS:
    nr, nc = r + dr, c + dc
    if 0 <= nr < ROWS and 0 <= nc < COLS:          # bounds check
        neighbors.append(grid[nr][nc])
print("neighbors of 2:", neighbors)

# =============================================================
# COMPREHENSIONS - concise, fast, and interviewers like them
# [expression for item in iterable if condition]
# =============================================================
squares = [x * x for x in range(6)]
evens = [x for x in range(10) if x % 2 == 0]
labels = ["even" if x % 2 == 0 else "odd" for x in range(4)]
flat = [x for row in [[1, 2], [3, 4]] for x in row]   # flatten 2D
print(squares, evens, labels, flat)

word_lengths = {w: len(w) for w in ["hi", "hello"]}    # dict comprehension
unique_mods = {x % 3 for x in range(10)}               # set comprehension
print(word_lengths, unique_mods)

total = sum(x * x for x in range(1000))                # generator: no list built
print(total)

# =============================================================
# EXERCISES
# =============================================================
def fizzbuzz(n):
    out = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            out.append("FizzBuzz")
        elif i % 3 == 0:
            out.append("Fizz")
        elif i % 5 == 0:
            out.append("Buzz")
        else:
            out.append(str(i))
    return out

def two_sum_brute(nums, target):
    """O(n^2) version - see lesson 06 for the O(n) hash-map version."""
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []

assert fizzbuzz(15)[-1] == "FizzBuzz" and fizzbuzz(5)[2] == "Fizz"
assert two_sum_brute([2, 7, 11, 15], 9) == [0, 1]
print("\nLesson 04 complete ✅")
