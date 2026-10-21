$ErrorActionPreference = 'Stop'
# Preserve source resolution and frame timing while making every frame independently seekable.
ffmpeg -hide_banner -loglevel error -y -i site/assets/concert/concert-flight.mp4 -an -c:v libx264 -preset fast -crf 18 -g 1 -bf 0 -pix_fmt yuv420p -movflags +faststart site/assets/concert/concert-scrub.mp4
if ($LASTEXITCODE -ne 0) { throw 'Concert playback encoding failed.' }
ffmpeg -hide_banner -loglevel error -y -i site/assets/concert/concert-flight.mp4 -frames:v 1 -q:v 2 site/assets/concert/flight-poster.jpg
if ($LASTEXITCODE -ne 0) { throw 'Concert poster encoding failed.' }
ffmpeg -hide_banner -loglevel error -y -ss 10 -i site/assets/concert/concert-flight.mp4 -frames:v 1 -q:v 2 site/assets/concert/flight-finale.jpg
if ($LASTEXITCODE -ne 0) { throw 'Concert finale encoding failed.' }
