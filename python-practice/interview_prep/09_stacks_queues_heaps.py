# =============================================================
# LESSON 09: Stacks, Queues, Heaps (and the collections module)
# =============================================================
from collections import deque
import heapq

# --- STACK: Last-In-First-Out -> just use a list -------------
stack = []
stack.append(1)        # push   O(1)
stack.append(2)
print(stack[-1])       # peek   -> 2
print(stack.pop())     # pop    -> 2
print(len(stack) == 0) # is empty? (or simply: "if not stack:")

# --- QUEUE: First-In-First-Out -> use deque (NOT list.pop(0)) -
queue = deque()
queue.append("a")      # enqueue at right   O(1)
queue.append("b")
print(queue.popleft()) # dequeue from left  O(1) -> "a"
queue.appendleft("z")  # deque works at both ends
print(queue)

# --- HEAP / Priority Queue: always get the SMALLEST fast -----
# Python's heapq is a MIN-heap on a plain list.
# push/pop O(log n), peek heap[0] O(1), heapify O(n)
heap = []
heapq.heappush(heap, 5)
heapq.heappush(heap, 1)
heapq.heappush(heap, 3)
print(heap[0])                 # 1 (smallest)
print(heapq.heappop(heap))     # 1

nums = [9, 4, 7, 1]
heapq.heapify(nums)            # turn a list into a heap in place
print(heapq.nsmallest(2, [9, 4, 7, 1]), heapq.nlargest(2, [9, 4, 7, 1]))

# MAX-heap trick: push negatives
max_heap = []
for x in [3, 10, 6]:
    heapq.heappush(max_heap, -x)
print(-heapq.heappop(max_heap))   # 10

# Heap of tuples: sorted by first element, then second...
tasks = []
heapq.heappush(tasks, (2, "write code"))
heapq.heappush(tasks, (1, "drink coffee"))
print(heapq.heappop(tasks))       # (1, 'drink coffee')

# =============================================================
# INTERVIEW CLASSICS
# =============================================================
def valid_parentheses(s):
    """'({[]})' -> True. Classic STACK problem."""
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack

def daily_temperatures(temps):
    """Days until a warmer temperature. MONOTONIC STACK pattern. O(n)"""
    answer = [0] * len(temps)
    stack = []                         # indices with decreasing temps
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            answer[j] = i - j
        stack.append(i)
    return answer

def kth_largest(nums, k):
    """Keep a min-heap of size k -> top is the kth largest. O(n log k)"""
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]

def merge_k_sorted(lists):
    """Merge k sorted lists with a heap. O(N log k)"""
    heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]
    heapq.heapify(heap)
    result = []
    while heap:
        val, li, idx = heapq.heappop(heap)
        result.append(val)
        if idx + 1 < len(lists[li]):
            heapq.heappush(heap, (lists[li][idx + 1], li, idx + 1))
    return result

def sliding_window_max(nums, k):
    """Max of each window of size k. MONOTONIC DEQUE. O(n)"""
    dq = deque()                       # indices, values decreasing
    result = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] < x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:             # front fell out of the window
            dq.popleft()
        if i >= k - 1:
            result.append(nums[dq[0]])
    return result

assert valid_parentheses("({[]})") and not valid_parentheses("(]")
assert daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73]) == [1, 1, 4, 2, 1, 1, 0, 0]
assert kth_largest([3, 2, 1, 5, 6, 4], 2) == 5
assert merge_k_sorted([[1, 4, 5], [1, 3, 4], [2, 6]]) == [1, 1, 2, 3, 4, 4, 5, 6]
assert sliding_window_max([1, 3, -1, -3, 5, 3, 6, 7], 3) == [3, 3, 5, 5, 6, 7]
print("\nLesson 09 complete ✅")
