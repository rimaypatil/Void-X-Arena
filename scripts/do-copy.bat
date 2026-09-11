@echo off
if not exist "public\assets\images\arena" mkdir "public\assets\images\arena"
copy /y "C:\Users\rimay\.gemini\antigravity-ide\brain\763c3685-a12c-4065-a1fe-05b144f0de84\hero_arena_banner_*.jpg" "public\assets\images\arena\hero-arena-banner.jpg"
copy /y "C:\Users\rimay\.gemini\antigravity-ide\brain\763c3685-a12c-4065-a1fe-05b144f0de84\match_br_bermuda_*.jpg" "public\assets\images\arena\match-br-bermuda.jpg"
copy /y "C:\Users\rimay\.gemini\antigravity-ide\brain\763c3685-a12c-4065-a1fe-05b144f0de84\match_clash_squad_*.jpg" "public\assets\images\arena\match-clash-squad.jpg"
copy /y "C:\Users\rimay\.gemini\antigravity-ide\brain\763c3685-a12c-4065-a1fe-05b144f0de84\match_1v1_duel_*.jpg" "public\assets\images\arena\match-1v1-duel.jpg"
copy /y "C:\Users\rimay\.gemini\antigravity-ide\brain\763c3685-a12c-4065-a1fe-05b144f0de84\match_purgatory_solo_*.jpg" "public\assets\images\arena\match-purgatory-solo.jpg"
echo DONE_COPYING
