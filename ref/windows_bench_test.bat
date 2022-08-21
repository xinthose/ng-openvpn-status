@ECHO OFF

setlocal

cd C:\Users\adamd\Documents\GitHub\ng-openvpn-status

@REM client
START C:\Windows\System32\cmd.exe /k "cd client && ng serve"

@REM server
START C:\Windows\System32\cmd.exe /k "cd server && gulp test"

endlocal

exit 0