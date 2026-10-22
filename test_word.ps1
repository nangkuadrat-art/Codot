$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $filePath = (Get-Item 'test_single.docx').FullName
    $doc = $word.Documents.Open($filePath)
    Write-Host "SUCCESS: Word opened document! Paragraphs count: " $doc.Paragraphs.Count
    $doc.Close()
} catch {
    Write-Host "FAILED: " $_.Exception.Message
} finally {
    $word.Quit()
}
