# =============================================================
# LESSON 01: Variables, Types, and Operators
# Run:  python3 01_variables_and_types.py
# =============================================================

# --- Variables -----------------------------------------------
# Python is dynamically typed: no type declarations needed.
age = 25            # int    (unlimited size - no overflow in Python!)
price = 19.99       # float
name = "Sam"       # str
is_ready = True     # bool   (capital T / F)
nothing = None      # None   (like null)

print(type(age), type(price), type(name), type(is_ready), type(nothing))

# Multiple assignment & swapping (very common in interviews)
a, b = 1, 2
a, b = b, a          # swap without a temp variable
print("swapped:", a, b)  # 2 1

# --- Type conversion -----------------------------------------
print(int("42") + 1)      # 43
print(str(42) + "!")      # "42!"
print(float("3.5"))       # 3.5
print(int(3.9))           # 3  (truncates toward zero)
print(bool(0), bool(""), bool([]), bool(None))   # all False ("falsy")
print(bool(1), bool("a"), bool([0]))             # all True  ("truthy")

# --- Arithmetic ----------------------------------------------
print(7 / 2)    # 3.5  true division ALWAYS returns float
print(7 // 2)   # 3    floor division
print(-7 // 2)  # -4   careful: floors toward -infinity, not zero!
print(7 % 2)    # 1    modulo -> handy for "is even?" checks
print(2 ** 10)  # 1024 power
print(divmod(17, 5))  # (3, 2) quotient and remainder at once

# Infinity - great as a starting value for min/max searches
best = float("inf")
worst = float("-inf")
print(best > 10**100)  # True

# --- Comparison & logic --------------------------------------
x = 5
print(1 < x < 10)          # chained comparison - Pythonic!
print(x > 3 and x < 10)    # and / or / not are words, not && || !
print(not x == 5)

# == compares VALUE, "is" compares IDENTITY (same object in memory)
list1 = [1, 2]
list2 = [1, 2]
print(list1 == list2)  # True
print(list1 is list2)  # False
print(nothing is None) # Always use "is None", not "== None"

# --- Conditionals --------------------------------------------
score = 85
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
else:
    grade = "C"
print("grade:", grade)

# Ternary (one-line if/else)
label = "even" if score % 2 == 0 else "odd"
print(label)

# --- Mutable vs Immutable (IMPORTANT for interviews) ---------
# Immutable: int, float, str, bool, tuple, frozenset  -> can't change in place
# Mutable:   list, dict, set, objects                 -> can change in place
s = "hello"
t = s
s += " world"         # creates a NEW string; t is unchanged
print(t)              # hello

nums = [1, 2]
alias = nums
nums.append(3)        # modifies the SAME list; alias sees it too
print(alias)          # [1, 2, 3]

# --- Bit tricks (show up occasionally) -----------------------
print(5 & 3, 5 | 3, 5 ^ 3)  # AND=1, OR=7, XOR=6
print(1 << 4)               # 16  (shift left = multiply by 2^4)
print(bin(10))              # '0b1010'
print(x ^ x)                # 0 -> XOR of a number with itself is 0

# =============================================================
# EXERCISES (try them, then check against the asserts)
# =============================================================
def is_even(n):
    return n % 2 == 0

def celsius_to_f(c):
    return c * 9 / 5 + 32

assert is_even(4) and not is_even(7)
assert celsius_to_f(100) == 212
print("\nLesson 01 complete ✅")
