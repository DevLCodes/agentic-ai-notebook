#While loops
from time import process_time_ns

i = 1
while i <= 10:
    print(i * '*')
    i += 1
print("Done")


#For Loops

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
for number in numbers:
    print(number)


i = 0
while i < len(numbers):
    print(numbers[i])
    i += 1