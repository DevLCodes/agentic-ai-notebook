#Arithmetic Operators
print(10 + 3)
print(10 // 3)
print (10 % 3)
print(10 ** 3)
print(10 ** 3)

x = 10 + 3 *2
print(x)

#Comparison Operators

x = 3 > 2
print(x)
price = 25

# Conditional Operators
print(price > 10 and price < 20)

price = 5
print( not price > 10)

# and  (both)
#or (at least one )
not price > 10

#If statements

temperature  = 35
if not temperature > 35:
    print("Temperature is greater than 35")
elif temperature < 35:
    print("Temperature is less than 35")
else:
    print("Temperature is good")


print("Done")

weight = int(input ("Weight"))
type = input ("Kg(K) or Lbs(L)")
if(type.upper() == "K"):
    converted = weight / 0.45
    print("Weight " + str(converted) + " in LBS" )
elif(type.upper() == "L"):
    converted = weight * 0.45
    print("Weight " + str(converted) + " in KGS")
