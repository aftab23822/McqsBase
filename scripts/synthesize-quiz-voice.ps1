param(
    [Parameter(Mandatory = $true)][string]$JobsPath,
    [string]$Voice = 'Microsoft Zira Desktop',
    [ValidateRange(-10, 10)][int]$Rate = 1
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$quizSpeech = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $quizSpeech.SelectVoice($Voice)
    $quizSpeech.Rate = $Rate
    $quizSpeech.Volume = 100
    $quizAudioFormat = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(
        48000,
        [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
        [System.Speech.AudioFormat.AudioChannel]::Mono
    )
    $quizJobs = Get-Content -LiteralPath $JobsPath -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($quizJob in $quizJobs) {
        $quizSpeech.SetOutputToWaveFile([string]$quizJob.output, $quizAudioFormat)
        $quizSpeech.Speak([string]$quizJob.text)
        $quizSpeech.SetOutputToNull()
    }
    Write-Output "Generated $($quizJobs.Count) offline voice clips."
}
finally {
    $quizSpeech.Dispose()
}
