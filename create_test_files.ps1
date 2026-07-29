# Create a 1KB test image
$pngHeader = @(137, 80, 78, 71, 13, 10, 26, 10)  # PNG signature
$bytes = [byte[]]$pngHeader + @(0) * 1000
[System.IO.File]::WriteAllBytes("$PWD/test_image.png", $bytes)
Write-Host "Created test_image.png"

# Create a 51MB test video (oversized for testing)
$videoBytes = [byte[]]@(0) * (51 * 1024 * 1024)
[System.IO.File]::WriteAllBytes("$PWD/test_video_huge.mp4", $videoBytes)
Write-Host "Created test_video_huge.mp4 (51MB)"

# Create a 9MB test image (oversized for image testing)
$imageBytes = [byte[]]@(0) * (9 * 1024 * 1024)
[System.IO.File]::WriteAllBytes("$PWD/test_image_huge.jpg", $imageBytes)
Write-Host "Created test_image_huge.jpg (9MB)"
