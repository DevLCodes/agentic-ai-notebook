weight = int(input ("Weight"))
type = input ("Kg(K) or Lbs(L)")
if(type.upper() == "K"):
    converted = weight / 0.45
    print(f"Weight  {converted:.2f}  in LBS" )
elif(type.upper() == "L"):
    converted = weight * 0.45
    print(f"Weight {converted:.2f}  in KGS")
