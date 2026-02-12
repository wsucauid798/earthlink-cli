$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node "$ScriptDir/bin/earthlink.js" @args
