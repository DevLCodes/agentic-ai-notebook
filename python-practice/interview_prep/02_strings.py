# =============================================================
# LESSON 02: Strings
# Strings are IMMUTABLE sequences of characters.
# =============================================================

s = "Hello, World"

# --- Indexing & slicing: s[start:stop:step] (stop is excluded)
print(s[0])       # H
print(s[-1])      # d   (negative = from the end)
print(s[0:5])     # Hello
print(s[7:])      # World
print(s[::-1])    # dlroW ,olleH   <- reverse a string (memorize!)
print(len(s))     # 12

# --- Common methods (each returns a NEW string) --------------
print(s.lower(), s.upper())
print("  padded  ".strip())          # remove surrounding whitespace
print(s.replace("World", "Python"))
print(s.find("o"))                    # 4  (-1 if not found)
print(s.startswith("Hell"), s.endswith("!"))
print("a,b,c".split(","))             # ['a', 'b', 'c']
print("one two  three".split())       # split on any whitespace
print("-".join(["a", "b", "c"]))      # a-b-c
print("abc123".isalnum(), "abc".isalpha(), "123".isdigit())
print("Ha" * 3)                       # HaHaHa

# --- f-strings: the modern way to format ---------------------
name, score = "Sam", 97.456
print(f"{name} scored {score:.1f}%")   # Sam scored 97.5%
print(f"{42:05d}")                     # 00042

# --- Characters <-> numbers ----------------------------------
print(ord("a"), chr(97))               # 97 a
print(ord("c") - ord("a"))             # 2  -> index of letter in alphabet

# --- Iterating -----------------------------------------------
for ch in "abc":
    print(ch, end=" ")
print()
for i, ch in enumerate("abc"):         # index + value together
    print(i, ch, end=" | ")
print()

# --- PERFORMANCE GOTCHA --------------------------------------
# Strings are immutable, so "+=" in a loop copies every time -> O(n^2).
# Build a list and join at the end -> O(n).
parts = []
for i in range(5):
    parts.append(str(i))
print("".join(parts))   # 01234

# =============================================================
# INTERVIEW CLASSICS
# =============================================================
def is_palindrome(text):
    """Ignore case and non-alphanumeric chars. 'A man, a plan...' -> True"""
    cleaned = [c.lower() for c in text if c.isalnum()]
    return cleaned == cleaned[::-1]

def is_anagram(a, b):
    """'listen', 'silent' -> True"""
    return sorted(a) == sorted(b)   # O(n log n); a Counter is O(n) (see lesson 06)

def reverse_words(sentence):
    """'the sky is blue' -> 'blue is sky the'"""
    return " ".join(reversed(sentence.split()))

def first_unique_char(s):
    counts = {}
    for c in s:
        counts[c] = counts.get(c, 0) + 1
    for i, c in enumerate(s):
        if counts[c] == 1:
            return i
    return -1

assert is_palindrome("A man, a plan, a canal: Panama")
assert not is_palindrome("race a car")
assert is_anagram("listen", "silent")
assert reverse_words("the sky  is blue") == "blue is sky the"
assert first_unique_char("leetcode") == 0
assert first_unique_char("aabb") == -1
print("\nLesson 02 complete ✅")
