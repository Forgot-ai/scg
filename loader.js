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
    }

    #lg-card {
      position: relative;
      z-index: 1;
      width: min(340px, 92vw);
      background: rgba(8, 8, 10, .72);
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 16px;
      padding: 32px 28px;
      text-align: center;
      backdrop-filter: blur(2px);
    }

    #lg-title {
      margin: 0;
      font-size: 19px;
      font-weight: 500;
      color: #fff;
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
      border: 1px solid rgba(255,255,255,.22);
      background: rgba(0,0,0,.5);
      color: #fff;
      font: 15px ui-monospace, monospace;
      text-align: center;
      outline: none;
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
      cursor: pointer;
    }

    #lg-btn:disabled {
      opacity: .45;
    }

    #lg-err {
      min-height: 18px;
      margin-top: 15px;
      font-size: 12.5px;
      color: #d0d0d6;
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
      border: 1px solid rgba(255,255,255,.25);
      border-radius: 12px;
      background: rgba(8,8,10,.6);
      color: #fff;
      cursor: pointer;
    }

    .lg-tile:hover {
      background: #fff;
      color: #000;
    }
  `;

  let META = null;
  let FILE_KEY = null;
  let raf = null;
  let running = false;

  const dec = s =>
    Uint8Array.from(atob(s), c => c.charCodeAt(0));

  function createUI() {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const gate = document.createElement("div");
    gate.id = "lockgate";

    gate.innerHTML = `
      <canvas id="lg-stars"></canvas>

      <div id="lg-card">
        <div style="font-size:40px;margin-bottom:16px">✦</div>
        <h1 id="lg-title">Locked</h1>
        <p id="lg-sub">Enter your key to continue.</p>

        <input
          id="lg-input"
          type="password"
          autocomplete="off"
          spellcheck="false"
          placeholder="Key"
        >

        <button id="lg-btn">Unlock</button>

        <div id="lg-err"></div>
      </div>

      <div id="lg-hub" hidden>
        <h1 id="lg-welcome"></h1>
        <div id="lg-tiles"></div>
      </div>
    `;

    document.body.appendChild(gate);

    startStars(
      gate.querySelector("#lg-stars"),
      gate
    );

    return gate;
  }

  function startStars(canvas, host) {
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let stars = [];

    function resize() {
      w = host.clientWidth;
      h = host.clientHeight;

      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      canvas.width = w * dpr;
      canvas.height = h * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = [];

      const count = Math.min(
        260,
        Math.max(80, Math.round(w * h / 5200))
      );

      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.1 + .3,
          a: Math.random() * .5 + .35
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        s.y += .02;

        if (s.y > h) {
          s.y = 0;
          s.x = Math.random() * w;
        }

        ctx.globalAlpha = s.a;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      if (running) {
        raf = requestAnimationFrame(draw);
      }
    }

    resize();
    window.addEventListener("resize", resize);

    running = true;
    draw();
  }

  async function getPayload() {
    const response = await fetch(
      PAYLOAD_URL + "?t=" + Date.now(),
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        "Payload HTTP error " + response.status
      );
    }

    const text = await response.text();

    if (!text.trim()) {
      throw new Error("payload.json is empty");
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error("payload.json is invalid JSON");
    }
  }

  async function unlock(key) {
    META = await getPayload();

    if (
      !META ||
      !META.keys ||
      !META.files ||
      !META.iter
    ) {
      throw new Error("Invalid payload structure");
    }

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

        const fileKeyBytes =
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

        FILE_KEY =
          await crypto.subtle.importKey(
            "raw",
            fileKeyBytes,
            "AES-GCM",
            false,
            ["decrypt"]
          );

        return k.name;
      } catch (e) {
      }
    }

    return null;
  }

  async function openFile(index) {
    const file = META.files[index];

    try {
      const bytes =
        await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: dec(file.iv)
          },
          FILE_KEY,
          dec(file.ct)
        );

      const html =
        new TextDecoder().decode(bytes);

      openDecryptedHTML(html);
    } catch (e) {
      console.error(
        "File decryption failed:",
        e
      );
    }
  }

  function openDecryptedHTML(html) {
    const blob =
      new Blob([html], {
        type: "text/html"
      });

    const url =
      URL.createObjectURL(blob);

    window.location.href = url;
  }

  async function start() {
    const gate = createUI();

    const input =
      gate.querySelector("#lg-input");

    const button =
      gate.querySelector("#lg-btn");

    const error =
      gate.querySelector("#lg-err");

    const card =
      gate.querySelector("#lg-card");

    const hub =
      gate.querySelector("#lg-hub");

    const welcome =
      gate.querySelector("#lg-welcome");

    const tiles =
      gate.querySelector("#lg-tiles");

    async function submit() {
      const key = input.value;

      if (!key) {
        error.textContent = "Enter a key.";
        return;
      }

      button.disabled = true;
      input.disabled = true;
      button.textContent = "Checking...";
      error.textContent = "";

      try {
        const who = await unlock(key);

        if (!who) {
          error.textContent = "Wrong key.";
          button.disabled = false;
          input.disabled = false;
          button.textContent = "Unlock";
          input.focus();
          input.select();
          return;
        }

        card.hidden = true;
        gate.classList.add("lg-unlocked");

        welcome.textContent =
          "Welcome, " + who;

        tiles.innerHTML = "";

        META.files.forEach((file, index) => {
          const button =
            document.createElement("button");

          button.className = "lg-tile";
          button.textContent = file.name;

          button.onclick = () =>
            openFile(index);

          tiles.appendChild(button);
        });

        hub.hidden = false;

      } catch (e) {
        console.error(e);

        error.textContent =
          e.message || "Couldn't reach the file.";

        button.disabled = false;
        input.disabled = false;
        button.textContent = "Unlock";
      }
    }

    button.onclick = submit;

    input.addEventListener(
      "keydown",
      e => {
        if (e.key === "Enter") {
          submit();
        }
      }
    );
  }

  if (document.body) {
    start();
  } else {
    window.addEventListener(
      "DOMContentLoaded",
      start
    );
  }
})();
