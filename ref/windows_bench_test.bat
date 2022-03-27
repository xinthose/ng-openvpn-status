@ECHO OFF

setlocal

cd C:\Users\adamd\Documents\GitHub\ng-openvpn-status

@REM client
START C:\Windows\System32\cmd.exe /k "cd client && cd && ng serve"

@REM server
START C:\Windows\System32\cmd.exe /k "cd server && gulp && node dist/app.js"

endlocal

exit 0