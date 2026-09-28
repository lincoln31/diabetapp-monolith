ADB="C:/Users/PC/AppData/Local/Android/Sdk/platform-tools/adb.exe"
tap(){ "$ADB" shell input tap "$1" "$2"; }
txt(){ "$ADB" shell input text "$1"; }
shot(){ sleep 2; "$ADB" exec-out screencap -p > "C:/Users/PC/Desktop/Programacion/app_moviles/diabetapp-monolith/.shots/$1.png"; }
