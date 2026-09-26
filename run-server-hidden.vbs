' Runs the local UI server (http://localhost:3008) without a console window. Used by the Scheduled Task "PsychJobsServer".
Set sh = CreateObject("WScript.Shell")
root = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)
sh.CurrentDirectory = root
sh.Run "cmd /c node --experimental-strip-types --disable-warning=ExperimentalWarning src\server.ts >> data\server.out 2>&1", 0, True
