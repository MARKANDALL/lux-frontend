// features/features/selfpb/styles/karaoke.js
// Karaoke (Word Sync) timeline CSS for Self Playback expanded views (modal/float).

export const KARAOKE_CSS = `
    /* ============================================================
       ✅ Expanded-only Karaoke Timeline
       ============================================================ */

    #spb-karaokeWrap{
      display:none; /* ✅ hidden in small drawer */
      margin-top: 10px;
    }

    #spb-karaokeWrap .spb-karaokeTitle{
      font-weight: 900;
      font-size: 12px;
      opacity: .70;
      margin: 2px 0 8px;
    }

    /* ✅ lane wrapper (timeline) */
    #spb-karaokeLaneWrap{
      position: relative;
      border-radius: 14px;
      background: rgba(15,23,42,0.04);
      border: 1px solid rgba(15,23,42,0.10);
      height: 76px;          /* JS can expand this if we need multiple rows */
      overflow: hidden;
      cursor: pointer;
    }

    /* subtle center “timeline rail” */
    #spb-karaokeLaneWrap::before{
      content:"";
      position:absolute;
      left:10px; right:10px;
      top: 38px;
      height: 2px;
      border-radius: 999px;
      background: rgba(15,23,42,0.10);
    }

    /* holds absolute-positioned words */
    #spb-karaokeLane{
      position:absolute;
      inset: 8px 8px 8px 8px;
    }

    /* playback cursor */
    #spb-karaokeCursor{
      position:absolute;
      top: 8px;
      bottom: 8px;
      width: 2px;
      left: 0%;
      transform: translateX(-1px);
      background: rgba(47,111,228,0.55);
      border-radius: 999px;
      pointer-events: none;
    }

    /* each word pill */
    #spb-karaokeLane .spbKWord{
      --p: 0;
      position:absolute;
      height: 24px;
      padding: 0 10px;
      border-radius: 999px;

      border: 1px solid rgba(15,23,42,0.12);
      background:
        linear-gradient(
          90deg,
          rgba(47,111,228,0.22) calc(var(--p) * 100%),
          rgba(255,255,255,0.72) 0
        );

      font-weight: 900;
      font-size: 12px;
      color: rgba(15,23,42,0.86);

      display:flex;
      align-items:center;
      justify-content:center;

      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      cursor: pointer;
      transition: transform .08s ease, filter .12s ease;
    }

    #spb-karaokeLane .spbKWord:hover{
      transform: scale(1.03);
      filter: brightness(1.04);
    }

    #spb-karaokeLane .spbKWord.is-active{
      z-index: 2;
      transform: scale(1.04);
      border-color: rgba(47,111,228,0.40);
      box-shadow: 0 10px 18px rgba(47,111,228,0.14);
    }

    #spb-karaokeLane .spbKWord.is-past{ opacity: .50; }
    #spb-karaokeLane .spbKWord.is-future{ opacity: .78; }

    /* ✅ error glow if word accuracy is low */
    #spb-karaokeLane .spbKWord.is-bad{
      border-color: rgba(220,38,38,0.35);
      box-shadow: 0 10px 20px rgba(220,38,38,0.14);
      background:
        linear-gradient(
          90deg,
          rgba(220,38,38,0.18) calc(var(--p) * 100%),
          rgba(255,255,255,0.72) 0
        );
    }

    /* ✅ great words get a soft “good glow” */
    #spb-karaokeLane .spbKWord.is-great{
      border-color: rgba(47,111,228,0.30);
      box-shadow: 0 10px 20px rgba(47,111,228,0.12);
    }

    /* ✅ show karaoke ONLY inside Expanded containers */
    #spb-modalCard #spb-karaokeWrap,
    #spb-float #spb-karaokeWrap{
      display:block;
    }
`;
