const fragmentShader = `

  uniform float uTime;

  uniform vec2 uMouse;

  uniform float uScroll;

  uniform vec2 uResolution;


  varying vec2 vUv;


  /* =====================================
     RANDOM
  ===================================== */

  float random(
    vec2 st
  ) {

    return fract(
      sin(
        dot(
          st,
          vec2(
            12.9898,
            78.233
          )
        )
      )
      *
      43758.5453123
    );

  }


  /* =====================================
     NOISE
  ===================================== */

  float noise(
    vec2 st
  ) {

    vec2 i =
      floor(st);

    vec2 f =
      fract(st);


    float a =
      random(i);


    float b =
      random(
        i +
        vec2(
          1.0,
          0.0
        )
      );


    float c =
      random(
        i +
        vec2(
          0.0,
          1.0
        )
      );


    float d =
      random(
        i +
        vec2(
          1.0,
          1.0
        )
      );


    vec2 u =
      f *
      f *
      (
        3.0 -
        2.0 *
        f
      );


    return mix(
      a,
      b,
      u.x
    )
    +
    (
      c -
      a
    )
    *
    u.y
    *
    (
      1.0 -
      u.x
    )
    +
    (
      d -
      b
    )
    *
    u.x
    *
    u.y;

  }


  /* =====================================
     ROTATION
     Used between fbm octaves so the noise doesn't read as
     axis-aligned / grid-like at higher amplitudes.
  ===================================== */

  mat2 rotate2d(
    float angle
  ) {

    float s = sin(angle);
    float c = cos(angle);

    return mat2(
      c, -s,
      s,  c
    );

  }


  /* =====================================
     FBM
  ===================================== */

  float fbm(
    vec2 st
  ) {

    float value =
      0.0;


    float amplitude =
      0.5;


    mat2 rot =
      rotate2d(0.5);


    for (
      int i = 0;
      i < 6;
      i++
    ) {

      value +=
        amplitude *
        noise(st);


      st =
        rot * st * 2.0;


      amplitude *=
        0.5;

    }


    return value;

  }


  /* =====================================
     STARS
     A layer of small glowing points, each on its own twinkle
     cycle. This is the single biggest visual change here — it
     turns a flat color gradient into a scene with depth.
  ===================================== */

  float starLayer(
    vec2 uv,
    float density,
    float twinkleSpeed
  ) {

    vec2 grid =
      floor(uv * density);

    vec2 cellUv =
      fract(uv * density) - 0.5;


    float seed =
      random(grid);


    // Only a small fraction of cells actually contain a star —
    // this is what keeps them sparse instead of a solid layer.
    float isStar =
      step(0.982, seed);


    // Random offset within the cell so stars don't sit in a
    // perfect grid.
    vec2 jitter =
      vec2(
        random(grid + 4.7),
        random(grid + 9.3)
      )
      - 0.5;


    float dist =
      length(cellUv - jitter * 0.6);


    float twinkle =
      sin(
        uTime * twinkleSpeed +
        seed * 62.0
      )
      * 0.5
      + 0.5;


    float point =
      smoothstep(0.09, 0.0, dist)
      * isStar
      * (0.35 + twinkle * 0.65);


    return point;

  }


  /* =====================================
     MAIN
  ===================================== */

  void main() {

    vec2 uv =
      vUv;


    /* =================================
       MOVEMENT
    ================================= */

    vec2 movement =
      vec2(
        uTime *
        0.045,

        uTime *
        0.03
      );


    vec2 scrollMovement =
      vec2(
        uScroll *
        0.3,

        uScroll *
        0.12
      );


    uv +=
      scrollMovement;


    /* =================================
       LARGE NOISE
    ================================= */

    float largeNoise =
      fbm(
        uv *
        2.6 +
        movement
      );


    /* =================================
       MOUSE
    ================================= */

    float mouseDistance =
      distance(
        uv,
        uMouse
      );


    float mouseInfluence =
      1.0 -
      smoothstep(
        0.0,
        0.6,
        mouseDistance
      );


    vec2 direction =
      uv -
      uMouse;


    uv +=
      direction *
      mouseInfluence *
      largeNoise *
      0.14;


    /* =================================
       MAIN NOISE
    ================================= */

    float n =
      fbm(
        uv *
        3.6 +
        movement
      );


    /* =================================
       DETAIL
    ================================= */

    float detail =
      fbm(
        uv *
        7.5 -
        movement *
        1.4
      );


    float fluid =
      n *
      0.72 +
      detail *
      0.28;


    /* =================================
       ACCENT FIELD
       A second, offset noise field used to place the cyan/teal
       accent — purple + teal is a classic complementary pairing
       that reads as far richer than a single-hue gradient.
    ================================= */

    float accentNoise =
      fbm(
        uv *
        2.1
        -
        movement * 0.6
        +
        vec2(19.3, 7.1)
      );


    /* =================================
       COLORS
    ================================= */

    vec3 dark    = vec3(0.004, 0.003, 0.014);
    vec3 indigo  = vec3(0.05,  0.02,  0.16);
    vec3 violet  = vec3(0.16,  0.03,  0.42);
    vec3 magenta = vec3(0.55,  0.07,  0.5);
    vec3 gold    = vec3(0.95,  0.55,  0.35);
    vec3 teal    = vec3(0.05,  0.35,  0.55);


    /* =================================
       COLOR MIX
    ================================= */

    vec3 color =
      mix(
        dark,
        indigo,
        smoothstep(0.10, 0.38, fluid)
      );


    color =
      mix(
        color,
        violet,
        smoothstep(0.36, 0.62, fluid)
      );


    color =
      mix(
        color,
        magenta,
        smoothstep(0.62, 0.86, fluid)
      );


    // Teal accent patches, blended in wherever the accent noise
    // field peaks — softly, so it reads as a color shift within
    // the nebula rather than a separate patch of solid teal.
    color +=
      teal
      * smoothstep(0.62, 0.92, accentNoise)
      * 0.22;


    // Gold highlight at the very brightest peaks — gives the eye
    // a clear focal point instead of everything living in the
    // same purple/pink range.
    color =
      mix(
        color,
        gold,
        smoothstep(0.90, 1.05, fluid) * 0.35
      );


    /* =================================
       DRIFTING LIGHT BANDS
       Slow diagonal bands layered on top of the base noise for
       a sense of depth and motion beyond the fluid noise alone.
    ================================= */

    float bands =
      sin(
        (uv.x + uv.y) * 6.0
        +
        uTime * 0.25
      )
      * 0.5
      + 0.5;


    color +=
      vec3(0.05, 0.02, 0.08)
      * bands
      * fluid
      * 0.35;


    /* =================================
       SCROLL GLOW
    ================================= */

    float scrollGlow =
      sin(
        uScroll *
        6.2831
      )
      *
      0.5
      +
      0.5;


    color +=
      vec3(
        0.02,
        0.004,
        0.03
      )
      *
      scrollGlow
      *
      fluid;


    /* =================================
       LIGHT
    ================================= */

    vec2 lightPosition =
      vec2(
        0.32,
        0.38
      );


    float lightDistance =
      distance(
        uv,
        lightPosition
      );


    float light =
      1.0 -
      smoothstep(
        0.0,
        0.7,
        lightDistance
      );


    color +=
      vec3(
        0.09,
        0.015,
        0.14
      )
      *
      light
      *
      fluid;


    /* =================================
       MOUSE LIGHT
       Warmer and stronger than before — this should now feel
       like a deliberate glow following the cursor, not a subtle
       tint.
    ================================= */

    color +=
      gold
      *
      mouseInfluence
      *
      smoothstep(
        0.2,
        0.9,
        fluid
      )
      * 0.3;


    /* =================================
       STARS
       Two layers — a dense field of faint distant stars, and a
       sparser field of bigger, brighter ones for depth.
    ================================= */

    vec2 starUv =
      vUv
      +
      scrollMovement * 0.4;


    float starsFar =
      starLayer(starUv, 55.0, 1.4);


    float starsNear =
      starLayer(starUv * 1.6 + 11.0, 22.0, 0.8);


    color +=
      vec3(0.85, 0.85, 0.95) * starsFar * 0.5;


    color +=
      vec3(0.95, 0.9, 1.0) * starsNear * 0.85;


    /* =================================
       VIGNETTE
    ================================= */

    vec2 vignetteUV =
      vUv -
      0.5;


    float vignette =
      1.0 -
      dot(
        vignetteUV,
        vignetteUV
      )
      *
      1.1;


    vignette =
      clamp(
        vignette,
        0.0,
        1.0
      );


    color *=
      0.82 +
      vignette *
      0.28;


    /* =================================
       FINAL COLOR
    ================================= */

    color =
      pow(
        color,
        vec3(
          0.92
        )
      );


    /* =================================
       GRAIN
       Resolution-based (not just UV-based) so it looks like a
       consistent film grain texture rather than stretching with
       the viewport's aspect ratio. Stronger and more visible
       than plain anti-banding dither — this is meant to be seen,
       giving the whole thing a cinematic, slightly filmic feel.
    ================================= */

    float grain =
      (
        random(
          vUv * uResolution
          +
          uTime * 60.0
        )
        -
        0.5
      )
      *
      0.035;


    color +=
      grain;


    gl_FragColor =
      vec4(
        color,
        1.0
      );

  }

`;

export default fragmentShader;