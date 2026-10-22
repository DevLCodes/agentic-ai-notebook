# =============================================================
# LESSON 08: Classes & Objects (OOP)
# A class is a blueprint; an object is an instance of it.
# Interviews use classes for: ListNode, TreeNode, "design X" questions
# (LRU cache, stack with min, rate limiter...).
# =============================================================

class Dog:
    species = "Canis familiaris"       # CLASS attribute - shared by all dogs

    def __init__(self, name, age):     # constructor; runs on Dog(...)
        self.name = name               # INSTANCE attributes - per object
        self.age = age
        self._tricks = []              # leading _ = "private by convention"

    def add_trick(self, trick):        # method: first param is always self
        self._tricks.append(trick)

    def describe(self):
        return f"{self.name} ({self.age}) knows {len(self._tricks)} tricks"

    def __repr__(self):                # how the object prints (debugging)
        return f"Dog({self.name!r}, {self.age})"

    def __eq__(self, other):           # define == between objects
        return isinstance(other, Dog) and self.name == other.name


rex = Dog("Rex", 3)
rex.add_trick("sit")
print(rex, rex.describe(), Dog.species)
print(Dog("Rex", 9) == rex)            # True because of __eq__

# --- Inheritance ---------------------------------------------
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        raise NotImplementedError

    def intro(self):
        return f"I am {self.name} and I say {self.speak()}"


class Cat(Animal):
    def speak(self):                   # override (polymorphism)
        return "meow"


class Cow(Animal):
    def __init__(self, name, spots):
        super().__init__(name)         # call parent constructor
        self.spots = spots

    def speak(self):
        return "moo"


for animal in [Cat("Tom"), Cow("Bessie", 12)]:
    print(animal.intro())              # same call, different behavior

# --- @property, @staticmethod, @classmethod ------------------
class Circle:
    def __init__(self, radius):
        self.radius = radius

    @property
    def area(self):                    # accessed like an attribute: c.area
        return 3.14159 * self.radius ** 2

    @staticmethod
    def unit_name():                   # no self; just grouped in the class
        return "cm"

    @classmethod
    def from_diameter(cls, d):         # alternative constructor
        return cls(d / 2)

c = Circle.from_diameter(10)
print(round(c.area, 2), Circle.unit_name())

# --- Dataclasses: less boilerplate ---------------------------
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

print(Point(1, 2), Point(1, 2) == Point(1, 2))   # free __init__, __repr__, __eq__

# --- Dunder methods worth knowing ----------------------------
# __init__ __repr__ __str__ __eq__ __lt__ (for sorting/heaps)
# __len__ __getitem__ __iter__ __contains__ __hash__

# =============================================================
# INTERVIEW-STYLE CLASS DESIGN
# =============================================================
class MinStack:
    """Stack that returns the minimum in O(1)."""
    def __init__(self):
        self.stack = []
        self.mins = []

    def push(self, val):
        self.stack.append(val)
        self.mins.append(min(val, self.mins[-1] if self.mins else val))

    def pop(self):
        self.mins.pop()
        return self.stack.pop()

    def top(self):
        return self.stack[-1]

    def get_min(self):
        return self.mins[-1]


from collections import OrderedDict

class LRUCache:
    """Least-Recently-Used cache, O(1) get/put. Very common at Google."""
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)          # mark as recently used
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)   # evict least recently used


ms = MinStack()
for v in [5, 2, 8]:
    ms.push(v)
assert ms.get_min() == 2
ms.pop(); ms.pop()
assert ms.get_min() == 5

lru = LRUCache(2)
lru.put(1, "a"); lru.put(2, "b")
lru.get(1)                 # 1 is now most recent
lru.put(3, "c")            # evicts 2
assert lru.get(2) == -1 and lru.get(1) == "a"
print("\nLesson 08 complete ✅")
