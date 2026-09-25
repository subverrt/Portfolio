const fragmentShader = `

  uniform float uTime;

  uniform vec2 uMouse;

  uniform float uScroll;


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
     FBM
  ===================================== */

  float fbm(
    vec2 st
  ) {

    float value =
      0.0;


    float amplitude =
      0.5;


    float frequency =
      1.0;


    for (
      int i = 0;
      i < 5;
      i++
    ) {

      value +=
        amplitude *
        noise(
          st *
          frequency
        );


      frequency *=
        2.0;


      amplitude *=
        0.5;

    }


    return value;

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
        0.06,

        uTime *
        0.035
      );


    vec2 scrollMovement =
      vec2(
        uScroll *
        0.35,

        uScroll *
        0.15
      );


    uv +=
      scrollMovement;


    /* =================================
       LARGE NOISE
    ================================= */

    float largeNoise =
      fbm(
        uv *
        3.0 +
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
        0.55,
        mouseDistance
      );


    vec2 direction =
      uv -
      uMouse;


    uv +=
      direction *
      mouseInfluence *
      largeNoise *
      0.16;


    /* =================================
       MAIN NOISE
    ================================= */

    float n =
      fbm(
        uv *
        4.0 +
        movement
      );


    /* =================================
       DETAIL
    ================================= */

    float detail =
      fbm(
        uv *
        8.0 -
        movement *
        1.5
      );


    float fluid =
      n *
      0.75 +
      detail *
      0.25;


    /* =================================
       COLORS
    ================================= */

    vec3 dark =
      vec3(
        0.005,
        0.002,
        0.015
      );


    vec3 purple =
      vec3(
        0.12,
        0.015,
        0.28
      );


    vec3 violet =
      vec3(
        0.30,
        0.035,
        0.55
      );


    vec3 pink =
      vec3(
        0.65,
        0.08,
        0.45
      );


    /* =================================
       COLOR MIX
    ================================= */

    vec3 color =
      mix(
        dark,
        purple,
        smoothstep(
          0.15,
          0.45,
          fluid
        )
      );


    color =
      mix(
        color,
        violet,
        smoothstep(
          0.42,
          0.68,
          fluid
        )
      );


    color =
      mix(
        color,
        pink,
        smoothstep(
          0.68,
          0.90,
          fluid
        )
      );


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
        0.025,
        0.005,
        0.035
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
        0.30,
        0.35
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
        0.65,
        lightDistance
      );


    color +=
      vec3(
        0.10,
        0.015,
        0.15
      )
      *
      light
      *
      fluid;


    /* =================================
       MOUSE LIGHT
    ================================= */

    color +=
      vec3(
        0.16,
        0.025,
        0.18
      )
      *
      mouseInfluence
      *
      smoothstep(
        0.0,
        0.8,
        fluid
      );


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
      1.5;


    vignette =
      clamp(
        vignette,
        0.0,
        1.0
      );


    color *=
      0.75 +
      vignette *
      0.35;


    /* =================================
       FINAL COLOR
    ================================= */

    color =
      pow(
        color,
        vec3(
          0.90
        )
      );


    gl_FragColor =
      vec4(
        color,
        1.0
      );

  }

`;

export default fragmentShader;