# =============================================================
# LESSON 13: Trees, Graphs, BFS, DFS, Backtracking
# Google LOVES graph/tree questions. Know BFS and DFS cold.
# =============================================================
from collections import deque, defaultdict
import heapq

# =============================================================
# BINARY TREES
# =============================================================
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

#        4
#      /   \
#     2     7
#    / \   / \
#   1   3 6   9
root = TreeNode(4,
                TreeNode(2, TreeNode(1), TreeNode(3)),
                TreeNode(7, TreeNode(6), TreeNode(9)))

# --- DFS traversals (recursive) ------------------------------
def inorder(node):        # left, root, right -> SORTED for a BST
    return inorder(node.left) + [node.val] + inorder(node.right) if node else []

def preorder(node):       # root, left, right
    return [node.val] + preorder(node.left) + preorder(node.right) if node else []

def max_depth(node):
    if not node:
        return 0
    return 1 + max(max_depth(node.left), max_depth(node.right))

def invert(node):
    if node:
        node.left, node.right = invert(node.right), invert(node.left)
    return node

def is_valid_bst(node, low=float("-inf"), high=float("inf")):
    if not node:
        return True
    if not (low < node.val < high):
        return False
    return is_valid_bst(node.left, low, node.val) and is_valid_bst(node.right, node.val, high)

def lowest_common_ancestor(node, p, q):
    if not node or node.val == p or node.val == q:
        return node
    left = lowest_common_ancestor(node.left, p, q)
    right = lowest_common_ancestor(node.right, p, q)
    if left and right:
        return node
    return left or right

# --- BFS / level order (uses a queue) ------------------------
def level_order(root):
    if not root:
        return []
    result, queue = [], deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):        # process exactly one level
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    return result

# =============================================================
# GRAPHS - usually given as an edge list; build an adjacency list.
# =============================================================
def build_graph(edges, directed=False):
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
        if not directed:
            graph[v].append(u)
    return graph

def dfs(graph, start):
    visited, order = set(), []
    def visit(node):
        visited.add(node)
        order.append(node)
        for nb in graph[node]:
            if nb not in visited:
                visit(nb)
    visit(start)
    return order

def shortest_path_unweighted(graph, start, goal):
    """BFS finds the shortest path when all edges cost 1."""
    queue = deque([(start, 0)])
    visited = {start}
    while queue:
        node, dist = queue.popleft()
        if node == goal:
            return dist
        for nb in graph[node]:
            if nb not in visited:
                visited.add(nb)            # mark when ENQUEUED, not dequeued
                queue.append((nb, dist + 1))
    return -1

def num_islands(grid):
    """Grid DFS: count connected groups of '1'."""
    rows, cols = len(grid), len(grid[0])
    seen = set()
    def sink(r, c):
        if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] == "0" or (r, c) in seen:
            return
        seen.add((r, c))
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            sink(r + dr, c + dc)
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and (r, c) not in seen:
                sink(r, c)
                count += 1
    return count

def course_order(num_courses, prereqs):
    """Topological sort (Kahn's algorithm). Returns [] if there's a cycle."""
    graph = defaultdict(list)
    indegree = [0] * num_courses
    for course, pre in prereqs:
        graph[pre].append(course)
        indegree[course] += 1
    queue = deque(i for i in range(num_courses) if indegree[i] == 0)
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in graph[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return order if len(order) == num_courses else []

def dijkstra(graph, start):
    """Weighted shortest paths. graph[u] = [(v, weight), ...]. O(E log V)"""
    dist = {start: 0}
    heap = [(0, start)]
    while heap:
        d, node = heapq.heappop(heap)
        if d > dist.get(node, float("inf")):
            continue                       # stale entry
        for nb, w in graph[node]:
            nd = d + w
            if nd < dist.get(nb, float("inf")):
                dist[nb] = nd
                heapq.heappush(heap, (nd, nb))
    return dist

class UnionFind:
    """Track connected components; near O(1) per operation."""
    def __init__(self, n):
        self.parent = list(range(n))
    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path compression
            x = self.parent[x]
        return x
    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        self.parent[ra] = rb
        return True

# =============================================================
# BACKTRACKING - try a choice, recurse, undo the choice.
# =============================================================
def permutations(nums):
    result = []
    def backtrack(path, used):
        if len(path) == len(nums):
            result.append(path[:])
            return
        for i in range(len(nums)):
            if not used[i]:
                used[i] = True
                path.append(nums[i])
                backtrack(path, used)
                path.pop()
                used[i] = False
    backtrack([], [False] * len(nums))
    return result

def combination_sum(candidates, target):
    result = []
    def backtrack(start, path, remaining):
        if remaining == 0:
            result.append(path[:])
            return
        for i in range(start, len(candidates)):
            if candidates[i] <= remaining:
                path.append(candidates[i])
                backtrack(i, path, remaining - candidates[i])   # i: reuse allowed
                path.pop()
    backtrack(0, [], target)
    return result

assert inorder(root) == [1, 2, 3, 4, 6, 7, 9]
assert preorder(root) == [4, 2, 1, 3, 7, 6, 9]
assert max_depth(root) == 3
assert is_valid_bst(root)
assert lowest_common_ancestor(root, 1, 3).val == 2
assert level_order(root) == [[4], [2, 7], [1, 3, 6, 9]]
assert level_order(invert(root)) == [[4], [7, 2], [9, 6, 3, 1]]

g = build_graph([(0, 1), (0, 2), (1, 3), (2, 3), (3, 4)])
assert dfs(g, 0) == [0, 1, 3, 2, 4]
assert shortest_path_unweighted(g, 0, 4) == 3
assert num_islands([["1", "1", "0"], ["0", "0", "0"], ["0", "1", "1"]]) == 2
assert course_order(4, [(1, 0), (2, 0), (3, 1), (3, 2)]) == [0, 1, 2, 3]
assert course_order(2, [(0, 1), (1, 0)]) == []
wg = defaultdict(list, {"A": [("B", 1), ("C", 4)], "B": [("C", 2)], "C": []})
assert dijkstra(wg, "A") == {"A": 0, "B": 1, "C": 3}
uf = UnionFind(4)
uf.union(0, 1)
assert uf.find(0) == uf.find(1) and uf.find(2) != uf.find(0)
assert len(permutations([1, 2, 3])) == 6
assert combination_sum([2, 3, 6, 7], 7) == [[2, 2, 3], [7]]
print("\nLesson 13 complete ✅")
