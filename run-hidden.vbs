' Runs the scraper (one pass) without a console window. Used by the Scheduled Task "PsychJobsScraper".
Set sh = CreateObject("WScript.Shell")
root = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)
sh.CurrentDirectory = root
sh.Run "cmd /c node --experimental-strip-types --disable-warning=ExperimentalWarning src\scrape.ts", 0, True
