(function () {
  const PAYLOAD_URL =
    "https://raw.githubusercontent.com/Forgot-ai/scg/main/payload.json";

  const CSS = `
    #lockgate {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      overflow: hidden;
      background: #000;
      display: grid;
      place-items: center;
      padding: 24px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    #lockgate.lg-unlocked {
      align-items: start;
      padding-top: 6vh;
    }

    #lockgate * {
      box-sizing: border-box;
    }

    #lg-stars {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }

    #lg-card {
      position: relative;
      z-index: 1;
      width: min(340px, 92vw);
      background: rgba(8, 8, 10, .72);
      border: 1px solid rgba(255, 255, 255, .16);
      border-radius: 16px;
      padding: 32px 28px;
      text-align: center;
      backdrop-filter: blur(2px);
    }

    #lg-icon {
      width: 40px;
      height: 40px;
      margin: 0 auto 16px;
      color: #fff;
    }

    #lg-icon svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    #lg-title {
      margin: 0;
      font-size: 19px;
      font-weight: 500;
      color: #fff;
      letter-spacing: .04em;
    }

    #lg-sub {
      margin: 7px 0 24px;
      font-size: 13px;
      color: #9a9aa2;
    }

    #lg-input {
      width: 100%;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, .22);
      background: rgba(0, 0, 0, .5);
      color: #fff;
      font: 15px ui-monospace, SFMono-Regular, Menlo, monospace;
      letter-spacing: .04em;
      outline: none;
      text-align: center;
    }

    #lg-input::placeholder {
      color: #6a6a72;
      letter-spacing: .12em;
    }

    #lg-input:focus-visible {
      border-color: #fff;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, .12);
    }

    #lg-btn {
      width: 100%;
      margin-top: 12px;
      padding: 12px;
      border: 1px solid #fff;
      border-radius: 10px;
      background: #fff;
      color: #000;
      font-size: 15px;
      font-weight: 500;
      letter-spacing: .04em;
      cursor: pointer;
    }

    #lg-btn:hover {
      background: #e6e6e6;
    }

    #lg-btn:disabled {
      opacity: .45;
      cursor: default;
    }

    #lg-btn:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }

    #lg-err {
      min-height: 18px;
      margin-top: 15px;
      font-size: 12.5px;
      color: #d0d0d6;
      letter-spacing: .02em;
    }

    #lg-hub {
      position: relative;
      z-index: 1;
      width: min(760px, 92vw);
      text-align: center;
    }

    #lg-welcome {
      font-size: 20px;
      font-weight: 500;
      color: #fff;
      letter-spacing: .03em;
      margin: 0 0 22px;
    }

    #lg-tiles {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }

    .lg-tile {
      padding: 12px 20px;
      min-width: 108px;
      border: 1px solid rgba(255, 255, 255, .25);
      border-radius: 12px;
      background: rgba(8, 8, 10, .6);
      color: #fff;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: .02em;
      cursor: pointer;
      backdrop-filter: blur(2px);
    }

    .lg-tile:hover {
      background: #fff;
      color: #000;
      border-color: #fff;
    }

    .lg-tile:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: no-preference) {
      #lg-card,
      #lg-hub {
        animation: lg-in .3s ease both;
      }

      @keyframes lg-in {
        from {
          opacity: 0;
          transform: translateY(6px);
        }

        to {
          opacity: 1;
          transform: none;
        }
      }

      #lg-card.lg-shake {
        animation: lg-shake .34s ease both;
      }

      @keyframes lg-shake {
        10%, 90% {
          transform: translateX(-1px)
        }

        20%, 80% {
          transform: translateX(2px)
        }

        30%, 50%, 70% {
          transform: translateX(-4px)
        }

        40%, 60% {
          transform: translateX(4px)
        }
      }
    }
  `;

  const STAR_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.6l1.9 7.6 7.6 1.9-7.6 1.9L12 20.6l-1.9-7.6L2.5 11.1l7.6-1.9z"/></svg>';

  let raf = null;
  let running = false;
  let META = null;
  let FILE_KEY = null;

  const dec = s =>
    Uint8Array.from(atob(s), c => c.charCodeAt(0));

  function starfield(canvas, host) {
    const ctx = canvas.getContext("2d");
    const reduce =
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let stars = [];

    function build() {
      const dpr =
        Math.min(window.devicePixelRatio || 1, 2);

      w = host.clientWidth;
      h = host.clientHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(
        260,
        Math.max(80, Math.round(w * h / 5200))
      );

      stars = [];

      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.1 + 0.3,
          baseA: Math.random() * 0.5 + 0.35,
          amp: Math.random() * 0.4 + 0.15,
          sp: Math.random() * 1.6 + 0.4,
          ph: Math.random() * 6.283,
          drift: Math.random() * 0.05 + 0.015
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        if (!reduce) {
          s.y += s.drift;

          if (s.y > h + 2) {
            s.y = -2;
            s.x = Math.random() * w;
          }
        }

        const a = reduce
          ? s.baseA
          : s.baseA +
            Math.sin(
              t * 0.001 * s.sp + s.ph
            ) * s.amp;

        ctx.globalAlpha =
          a < 0 ? 0 : a > 1 ? 1 : a;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.283);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    function loop(t) {
      if (!running) return;

      draw(t);
      raf = requestAnimationFrame(loop);
    }

    build();

    window.addEventListener("resize", build);

    running = true;

    if (reduce) {
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }
  }

  function mount() {
    const style =
      document.createElement("style");

    style.textContent = CSS;
    document.head.appendChild(style);

    const gate =
      document.createElement("div");

    gate.id = "lockgate";

    gate.innerHTML =
      '<canvas id="lg-stars"></canvas>' +
      '<div id="lg-card" role="dialog" aria-modal="true" aria-labelledby="lg-title">' +
        '<div id="lg-icon">' +
          STAR_SVG +
        '</div>' +
        '<h1 id="lg-title">Locked</h1>' +
        '<p id="lg-sub">Enter your key to continue.</p>' +
        '<input id="lg-input" type="password" autocomplete="off" spellcheck="false" aria-label="Key" placeholder="Key">' +
        '<button id="lg-btn" type="button">Unlock</button>' +
        '<div id="lg-err" role="alert"></div>' +
      '</div>' +
      '<div id="lg-hub" hidden>' +
        '<h1 id="lg-welcome"></h1>' +
        '<div id="lg-tiles"></div>' +
      '</div>';

    document.body.appendChild(gate);

    starfield(
      gate.querySelector("#lg-stars"),
      gate
    );

    const card =
      gate.querySelector("#lg-card");

    const input =
      gate.querySelector("#lg-input");

    const btn =
      gate.querySelector("#lg-btn");

    const err =
      gate.querySelector("#lg-err");

    const hub =
      gate.querySelector("#lg-hub");

    const welcome =
      gate.querySelector("#lg-welcome");

    const tiles =
      gate.querySelector("#lg-tiles");

    input.focus();

    const fail = msg => {
      btn.disabled = false;
      input.disabled = false;
      btn.textContent = "Unlock";
      err.textContent = msg;

      card.classList.remove("lg-shake");
      void card.offsetWidth;
      card.classList.add("lg-shake");
    };

    const showHub = who => {
      gate.classList.add("lg-unlocked");

      card.hidden = true;

      welcome.textContent =
        "Welcome, " + who;

      tiles.innerHTML = "";

      META.files.forEach((f, i) => {
        const t =
          document.createElement("button");

        t.type = "button";
        t.className = "lg-tile";
        t.textContent = f.name;

        t.onclick = () =>
          openFile(i);

        tiles.appendChild(t);
      });

      hub.hidden = false;
    };

    const submit = async () => {
      if (btn.disabled) return;

      const key = input.value;

      if (!key) {
        err.textContent = "Enter a key.";
        return;
      }

      err.textContent = "";

      btn.disabled = true;
      input.disabled = true;
      btn.textContent = "Checking…";

      try {
        const who = await unlock(key);

        if (who == null) {
          fail("Wrong key.");
          input.focus();
          input.select();
          return;
        }

        showHub(who);
      } catch (e) {
        console.error("Unlock error:", e);

        fail(
          e && e.message
            ? e.message
            : "Couldn't reach the file."
        );
      }
    };

    btn.addEventListener(
      "click",
      submit
    );

    input.addEventListener(
      "keydown",
      e => {
        if (e.key === "Enter") {
          submit();
        }
      }
    );

    input.addEventListener(
      "input",
      () => {
        err.textContent = "";
      }
    );
  }

  async function fetchPayload() {
    const response =
      await fetch(
        PAYLOAD_URL +
        "?t=" +
        Date.now(),
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        "Payload request failed: HTTP " +
        response.status
      );
    }

    const text =
      await response.text();

    if (!text.trim()) {
      throw new Error(
        "payload.json is empty."
      );
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(
        "payload.json is not valid JSON."
      );
    }
  }

  async function unlock(key) {
    META = await fetchPayload();

    if (
      !META ||
      !Array.isArray(META.keys) ||
      !Array.isArray(META.files) ||
      !Number.isInteger(META.iter)
    ) {
      throw new Error(
        "Invalid payload.json format."
      );
    }

    let fileKeyBytes = null;
    let who = null;

    for (const k of META.keys) {
      try {
        const base =
          await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(key),
            "PBKDF2",
            false,
            ["deriveKey"]
          );

        const wrap =
          await crypto.subtle.deriveKey(
            {
              name: "PBKDF2",
              salt: dec(k.salt),
              iterations: META.iter,
              hash: "SHA-256"
            },
            base,
            {
              name: "AES-GCM",
              length: 256
            },
            false,
            ["decrypt"]
          );

        fileKeyBytes =
          new Uint8Array(
            await crypto.subtle.decrypt(
              {
                name: "AES-GCM",
                iv: dec(k.iv)
              },
              wrap,
              dec(k.ct)
            )
          );

        who = k.name;

        break;
      } catch (e) {
      }
    }

    if (!fileKeyBytes) {
      return null;
    }

    FILE_KEY =
      await crypto.subtle.importKey(
        "raw",
        fileKeyBytes,
        "AES-GCM",
        false,
        ["decrypt"]
      );

    return who;
  }

  async function openFile(i) {
    const f = META.files[i];

    try {
      const decrypted =
        await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: dec(f.iv)
          },
          FILE_KEY,
          dec(f.ct)
        );

      const html =
        new TextDecoder().decode(decrypted);

      load(html);
    } catch (e) {
      console.error(
        "File decryption failed:",
        e
      );
    }
  }

  function load(html) {
    running = false;

    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }

    document.open();
    document.write(html);
    document.close();

    document
      .querySelectorAll("script")
      .forEach(oldScript => {
        const newScript =
          document.createElement("script");

        for (const attr of oldScript.attributes) {
          newScript.setAttribute(
            attr.name,
            attr.value
          );
        }

        if (oldScript.src) {
          newScript.src =
            oldScript.src;
        } else {
          newScript.textContent =
            oldScript.textContent;
        }

        oldScript.replaceWith(newScript);
      });
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener(
      "DOMContentLoaded",
      mount
    );
  }
})();
