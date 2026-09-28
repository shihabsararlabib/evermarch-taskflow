Set oWS = WScript.CreateObject("WScript.Shell")
sDesktop = oWS.SpecialFolders("Desktop")
sLinkFile = sDesktop & "\Evermarch TaskFlow.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = oWS.CurrentDirectory & "\Start-App.bat"
oLink.WorkingDirectory = oWS.CurrentDirectory
oLink.IconLocation = oWS.CurrentDirectory & "\src\app\favicon.ico, 0"
oLink.Description = "Evermarch Bangladesh - Printer Repair TaskFlow"
oLink.Save
WScript.Echo "[SUCCESS] Desktop shortcut created successfully on your Desktop: Evermarch TaskFlow"
