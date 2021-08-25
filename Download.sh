#! /bin/bash
killall node

cd src

cd Assets

rm AssetPairs.tsx

array=( $(curl https://api.kraken.com/0/public/AssetPairs | grep -o "wsname\":\"[A-Z]*./[A-Z]*") )

echo -n "export const assetPairs = [" >> AssetPairs.tsx

for((i=0; i<${#array[@]}; i++))
    do
        x=$(echo ${array[$i]} | sed s/wsname\":\"//)
        x=$(echo $x | sed 's/\\//g')
        x="\"$x\""
        if [[ $x =~ "XBT" ]]; then
            x="${x/XBT/BTC}"   
        fi
        if [[ $x =~ "XDG" ]]; then
            x="${x/XDG/DOGE}"
        fi
        if [ "$i" -ne "$((${#array[@]}-1))" ]; then
            echo -n $x, >> AssetPairs.tsx
        fi
        if [ "$i" -eq "$((${#array[@]}-1))" ]; then
            echo -n $x >> AssetPairs.tsx
        fi
    done

 echo -n "].sort();" >> AssetPairs.tsx

 cd ..

 cd ..

 rm -R ../crypto-ticker-prod/build

 npm run build

 cp -R ./build ../crypto-ticker-prod

 cd ../crypto-ticker-prod

 npm start