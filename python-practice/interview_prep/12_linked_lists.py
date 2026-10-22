# =============================================================
# LESSON 12: Linked Lists
# Each node holds a value and a pointer to the next node.
# =============================================================

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# Helpers to convert between Python lists and linked lists
def build(values):
    dummy = ListNode()
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next

def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out

# --- Reverse a linked list (MUST know cold) ------------------
def reverse(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next     # 1. save next
        curr.next = prev    # 2. reverse pointer
        prev = curr         # 3. move prev forward
        curr = nxt          # 4. move curr forward
    return prev

# --- Merge two sorted lists (DUMMY NODE trick) ---------------
def merge_two(a, b):
    dummy = ListNode()
    tail = dummy
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next

# --- Fast & slow pointers ------------------------------------
def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow

def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            return True
    return False

def remove_nth_from_end(head, n):
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(n + 1):
        fast = fast.next           # put a gap of n between them
    while fast:
        fast, slow = fast.next, slow.next
    slow.next = slow.next.next
    return dummy.next

assert to_list(reverse(build([1, 2, 3, 4]))) == [4, 3, 2, 1]
assert to_list(merge_two(build([1, 2, 4]), build([1, 3, 4]))) == [1, 1, 2, 3, 4, 4]
assert middle(build([1, 2, 3, 4, 5])).val == 3
cyclic = build([1, 2, 3])
cyclic.next.next.next = cyclic
assert has_cycle(cyclic) and not has_cycle(build([1, 2]))
assert to_list(remove_nth_from_end(build([1, 2, 3, 4, 5]), 2)) == [1, 2, 3, 5]
print("\nLesson 12 complete ✅")
