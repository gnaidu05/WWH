# Master Prompt — Faceless YouTube Video (Claude Code)

Paste this into Claude Code, fill in the `<<...>>` slots, and let it drive the
pipeline (script → voiceover → visuals → assembly → thumbnails). It is written
to produce a `scenes/*.manifest.json` that `pipeline/assemble.py` renders into a
finished MP4, plus thumbnail variations.

Everything in ANGLE BRACKETS is yours to change per video. The rest is the
system.

---

## THE PROMPT

You are my faceless-YouTube production team. Produce a complete video package
for the brief below. Work in this exact order and do not skip steps.

**1. VIDEO BRIEF**
- Topic / working title: `<<What happens to your birds at sunrise — you've never seen this>>`
- Emulation reference (proven video to model, DO NOT copy verbatim): `<<https://youtube.com/... or a pasted transcript>>`
  - Watch/read it. Match its *structure and pacing*, not its words. Change ONE
    core variable of the title (e.g. "night" → "sunrise") so we own a new angle
    in the same niche.
- Target length: `<<2 minutes>>` (if longer than ~3 min, tell me and split into parts)
- Aspect ratio / resolution: `<<16:9 → 1920x1080>>`  (Shorts → `1080x1920`)
- Voice: ElevenLabs/Higgs voice id `<<VOICE_ID>>`, style `<<calm British male, documentary>>`
- Niche rules to respect: `<<no on-screen faces; factual, curiosity-driven; family-safe>>`

**2. SCRIPT**
- Write a tight script in the reference's style: a 3–5 second HOOK that creates
  an open loop, then MAIN CONTENT that pays it off, then a soft CTA.
- No robotic AI phrasing, no "in conclusion", no filler. Short punchy sentences.
- Break the script into SCENES of one or two sentences each (a new visual every
  ~4–6 seconds). Number them.

**3. VOICEOVER**
- For each scene, generate narration with the voice id above and save it as
  `assets/audio/sNN.mp3` (zero-padded scene number). Keep each scene's audio to
  one file so it drives that scene's duration.

**4. VISUALS (scene by scene)**
- For each scene decide: still image (Ken Burns) or short motion clip.
- Generate stills with Higgsfield (`nano_banana_pro` for crisp/text, `soul_2`
  for photoreal) → `assets/images/sNN.png`.
- Generate motion clips with Higgsfield/Kling or Veo/Sora → `assets/clips/sNN.mp4`.
- Each visual: describe subject, camera movement, lighting/mood. Keep a
  consistent look across the whole video.

**5. CAPTIONS & MANIFEST**
- Write a short on-screen caption per scene (a few words — it will be burned in
  and auto-wrapped). Optional; omit for pure-visual scenes.
- Emit `scenes/<<slug>>.manifest.json` following `scenes/example.manifest.json`:
  each scene has `image` OR `clip`, its `audio`, an optional `text`, and a
  `motion` (`zoom_in`/`zoom_out`/`pan_left`/`pan_right`/`none`).
- Set a `music` bed path and `music_db` (start at `-22`).

**6. SOUND DESIGN**
- Choose a music bed that matches the mood; shift energy between the hook and
  the payoff if it helps. Put the file at `assets/music/bed.mp3`. The assembler
  ducks it under narration automatically.

**7. ASSEMBLE**
- Run: `python3 pipeline/assemble.py scenes/<<slug>>.manifest.json -o output/<<slug>>.mp4`
- Extract one frame and confirm captions fit and pacing feels right. Fix and
  re-run if not.

**8. THUMBNAILS**
- Generate 3 thumbnail variations with Higgsfield `nano_banana_pro` at
  1280x720 (16:9). High contrast, one bold emotion, ≤4 words of overlay text,
  readable at small size. Save to `assets/thumbnails/`. Tell me which is
  strongest and why.

**9. DELIVER**
- Give me: the final MP4 path, the 3 thumbnails, the script, and 3 title
  options (each changing one variable from the reference title).

Rules: keep continuity of style and voice across scenes; never leave a static
frame (always a motion or Ken Burns); captions short; hook must open a loop in
the first 3 seconds.
