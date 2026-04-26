# Portal 771 Dev Log

## Current Architecture
- Frontend: Next.js deployed on Vercel
- Domain: `portal771.com`
- Database/Auth/Storage for images and audio: Supabase
- Video storage: Cloudflare R2
- 360 video player: custom Three.js WebGL player

## Working Features
- `image_2d` portals working
- `image_360` portals working
- `youtube_360` support exists, but it is not the preferred final path
- `video_360` self-hosted playback from Cloudflare R2 working
- Mobile immersive mode working
- iOS gyro working
- Video audio and narrative audio are separated
- Desktop and mobile `video_360` playback working
- R2 CORS configured
- Cloudflare usage alerts configured

## Important Decisions
- YouTube and Vimeo are not the final solution for immersive mobile web 360
- The custom WebGL player is the correct path
- VR/cardboard mode was attempted and removed/postponed
- VR should be developed later in a separate branch or isolated feature
- Current `video_360` mobile flow:
  - portrait -> `gira tu dispositivo`
  - landscape -> `INICIAR`
  - then direct immersive video
- There is no `Normal / VR` choice screen right now

## Known Pending Items
- Polish `INICIAR` button: rectangular, not rounded
- Desktop pre-play button should say `INICIAR` instead of a play icon
- Desktop `INICIAR` should start video with audio ON
- Future feature: upload `video_360` files from admin directly to Cloudflare R2
- Future feature: proper cardboard VR mode
- Future polish: final button design, not emoji/icons

## Warnings
- Do not reintroduce VR mode into the stable viewer without a separate plan
- Do not use Google Drive for 360 video delivery
- Do not move hosting from Vercel
- Do not change Supabase schema unnecessarily
- Do not break `image_2d`, `image_360`, or `youtube_360`
