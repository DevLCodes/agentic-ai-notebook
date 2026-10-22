
import importlib
import math
import random
import heapq
from collections import Counter, defaultdict

def min_finish_time(n_cpus, tasks):
    heap = [0] * n_cpus
    heapq.heapify(heap)
    for task in tasks:
        min = heapq.heappop(heap)
        heapq.heappush(heap,min+task)
    print(max(heap))
    return max(heap)



print(min_finish_time(3, [4, 2, 8, 3]))    # expected 8

