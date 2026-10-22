# Python Interview Prep: 5-Day Plan

Every lesson is a runnable Python file. Read it top to bottom, run it, then change things and rerun.
The `assert` lines at the bottom check that each example works. If you edit something and break it, Python tells you.

```bash
cd interview_prep
python3 03_lists_arrays.py
```

## Lessons

| # | File | What you learn |
|---|------|----------------|
| 01 | `01_variables_and_types.py` | Types, operators, truthiness, mutable vs immutable |
| 02 | `02_strings.py` | Slicing, string methods, f-strings, palindromes and anagrams |
| 03 | `03_lists_arrays.py` | Lists (arrays), sorting, 2D grids, Kadane's algorithm |
| 04 | `04_loops_and_comprehensions.py` | for, while, enumerate, zip, grid neighbors, comprehensions |
| 05 | `05_tuples_and_sets.py` | Tuples, sets, O(1) membership checks |
| 06 | `06_dictionaries_maps.py` | Hash maps, Counter, defaultdict, Two Sum, prefix sums |
| 07 | `07_functions.py` | Arguments, lambdas, closures, recursion, memoization |
| 08 | `08_classes_objects.py` | Classes and OOP, dataclasses, MinStack, LRU Cache |
| 09 | `09_stacks_queues_heaps.py` | Stacks, deques, heapq, monotonic stacks |
| 10 | `10_two_pointers_sliding_window.py` | Two pointers and sliding window templates |
| 11 | `11_binary_search_sorting.py` | Binary search variants, merge sort and quick sort, intervals |
| 12 | `12_linked_lists.py` | Reversing a list, dummy nodes, fast and slow pointers |
| 13 | `13_trees_graphs.py` | Tree DFS and BFS, graphs, topological sort, Dijkstra, Union-Find, backtracking |
| 14 | `14_dynamic_programming.py` | 1D and 2D DP, knapsack |
| 15 | `15_practice.py` | 10 unsolved problems with a test runner (solutions are in a separate file) |

## 5-day schedule

**Day 1: Python fluency (lessons 01–05)**
Get the syntax to the point where you don't think about it. Retype the "Interview classics" section of each lesson from memory.

**Day 2: Hash maps, functions, and OOP (lessons 06–08)**
Hash maps solve about half of all interview problems. Be able to write `two_sum` and `LRUCache` from a blank file.

**Day 3: Patterns (lessons 09–12)**
Stacks, heaps, two pointers, sliding window, binary search, and linked lists. For each pattern, learn the signal that tells you to use it (see below).

**Day 4: Trees, graphs, and DP (lessons 13–14)**
Google asks a lot of graph questions. Be able to write BFS (with `deque` and a `visited` set) and DFS without hesitating.

**Day 5: Mock interviews (lesson 15)**
Run `python3 15_practice.py`. Give yourself 25 minutes per problem and talk out loud the whole time. Review the solutions only after you've made a real attempt. Then do 2–3 more problems from the LeetCode "Top Interview 150" list.

## Which pattern to use

| If the problem says... | Try |
|---|---|
| "find a pair / check if seen before / count" | Hash map or set |
| "sorted array" | Two pointers or binary search |
| "contiguous subarray / substring" | Sliding window or prefix sums |
| "top k / kth largest / merge k" | Heap |
| "next greater / matching brackets" | Stack (monotonic stack) |
| "shortest path / minimum steps / level by level" | BFS |
| "all combinations / permutations / subsets" | Backtracking |
| "count the ways / min or max cost / can you reach" | Dynamic programming |
| "dependencies / ordering" | Topological sort |
| "connected groups" | DFS, BFS, or Union-Find |
| "minimize the maximum / smallest X that works" | Binary search on the answer |

## Big-O quick reference

| Operation | list | dict / set | deque | heap |
|---|---|---|---|---|
| Access by index | O(1) | – | O(n) | – |
| `x in ...` | O(n) | **O(1)** | O(n) | O(n) |
| Add at end | O(1) | O(1) | O(1) | O(log n) |
| Remove from front | O(n) | – | **O(1)** | O(log n) (min) |
| Sort | O(n log n) | – | – | – |

## In the interview room

1. **Clarify** the inputs, edge cases (empty input, duplicates, negative numbers), and expected output. Repeat the problem back in your own words.
2. **Work an example** by hand before you write any code.
3. **Describe the brute force** and its Big-O, then improve on it. Say out loud which pattern you're using.
4. **Write the code** while explaining what you're doing. Use clear variable names.
5. **Test it** by tracing a small example and one edge case.
6. **State the time and space complexity** without being asked.

Google interviews are usually in a shared doc with no autocomplete, so practice writing code without running it.
