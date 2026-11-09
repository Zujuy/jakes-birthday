"use strict";
const $ = (id) => document.getElementById(id);
let audio,
  master,
  musicTimer,
  musicOn = false,
  notes = [],
  beat = 0,
  revTimer;
const scale = [55, 55, 65.406, 51.913, 55, 73.416, 65.406, 49];
function sound(freq, duration = 0.8, type = "sine", volume = 0.08) {
  if (!audio || !musicOn) return;
  const osc = audio.createOscillator(),
    amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.currentTime);
  amp.gain.setValueAtTime(0, audio.currentTime);
  amp.gain.linearRampToValueAtTime(volume, audio.currentTime + 0.08);
  amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  osc.connect(amp).connect(master);
  osc.start();
  osc.stop(audio.currentTime + duration);
  notes.push(osc);
  osc.onended = () => {
    notes = notes.filter((n) => n !== osc);
    osc.disconnect();
    amp.disconnect();
  };
}
function soundtrack() {
  const n = scale[beat % scale.length];
  sound(n, 2.5, "triangle", 0.11);
  sound(n * 2.01, 2.4, "sine", 0.04);
  if (beat % 2 === 0) sound(n * 8, 1.5, "sine", 0.025);
  if (beat % 4 === 3) sound(n * 4.06, 2.8, "triangle", 0.02);
  beat++;
}
async function toggleMusic() {
  try {
    if (!audio) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      master = audio.createGain();
      master.gain.value = 0.55;
      master.connect(audio.destination);
    }
    await audio.resume();
    musicOn = !musicOn;
    clearInterval(musicTimer);
    if (musicOn) {
      soundtrack();
      musicTimer = setInterval(soundtrack, 1100);
    } else {
      notes.forEach((n) => {
        try {
          n.stop();
        } catch {}
      });
      notes = [];
    }
    $("music").textContent = "♪ SOUNDTRACK: " + (musicOn ? "ON" : "OFF");
    $("music").setAttribute("aria-pressed", String(musicOn));
  } catch {
    $("status").textContent = "Audio is unavailable in this browser.";
  }
}
$("music").onclick = toggleMusic;
let enteredAt = 0;
$("enter").onclick = () => {
  $("gate").hidden = true;
  $("film").hidden = false;
  enteredAt = Date.now();
  window.scrollTo(0, 0);
  $("music").focus();
};
setInterval(() => {
  if (!enteredAt || document.hidden) return;
  const s = Math.floor((Date.now() - enteredAt) / 1000);
  $("timecode").textContent = [
    Math.floor(s / 3600),
    Math.floor(s / 60) % 60,
    s % 60,
  ]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}, 1000);
$("motion").onclick = () => {
  const paused = document.body.classList.toggle("calm");
  $("motion").setAttribute("aria-pressed", String(paused));
  $("motion").textContent = paused ? "RESUME MOTION" : "PAUSE MOTION";
};
$("engine").onclick = () => {
  clearTimeout(revTimer);
  document.querySelector(".landscape").classList.add("revving");
  $("engine").textContent = "⚡ STILL RIDING.";
  sound(42, 1.4, "sawtooth", 0.05);
  revTimer = setTimeout(() => {
    document.querySelector(".landscape").classList.remove("revving");
    $("engine").textContent = "⚡ REV THE ENGINE";
  }, 1500);
};
$("messageButton").onclick = () => {
  const open = $("message").hidden;
  $("message").hidden = !open;
  $("messageButton").setAttribute("aria-expanded", String(open));
  $("messageButton").textContent = open
    ? "■ STOP THE TAPE"
    : "▶ PLAY YOUR MESSAGE";
  document.querySelector(".tape").classList.toggle("playing", open);
  sound(220, 0.3, "triangle", 0.04);
};
let blown = false;
$("wishButton").onclick = () => {
  blown = !blown;
  $("candles").innerHTML = blown
    ? "<span>✧</span><span>✧</span><span>✧</span>"
    : "<span>🕯</span><span>🕯</span><span>🕯</span>";
  $("candles").setAttribute(
    "aria-label",
    blown ? "Three extinguished candles" : "Three burning candles",
  );
  $("wishButton").textContent = blown
    ? "LIGHT THEM AGAIN"
    : "BLOW OUT THE CANDLES";
  $("wish").textContent = blown
    ? "Your wish has crossed over. Happy birthday, Jake. 🖤"
    : "Even the darkest souls get a birthday wish.";
};
const chapters = {
  road: {
    number: "I / THE LAST MILE",
    title: "YOU TOOK THE WRONG TURN.",
    text: "The farmhouse lights go out. Behind you, an engine starts. Your bike has one last ride in it. What do you do?",
    choices: ["START THE BIKE", "KNOCK ON THE DOOR"],
    answers: [
      "You leave a trail of dust behind you. The birthday boy survives to ride another day.",
      "The door creaks open. A cake is waiting inside. Even nightmares remembered your birthday.",
    ],
  },
  room: {
    number: "II / THE UPSTAIRS ROOM",
    title: "THE ROOM REMEMBERS YOU.",
    text: "A cold breath. A floating bed. A message scratched into the wall: ONE MORE YEAR. The voice asks what you came for.",
    choices: ["DEMAND YOUR BIRTHDAY WISH", "BACK AWAY SLOWLY"],
    answers: [
      "The room falls silent. Your wish has been granted. Terms and conditions remain deeply suspicious.",
      "The door closes itself. A whisper follows you: Happy birthday, Jake. See you next year.",
    ],
  },
  phone: {
    number: "III / UNKNOWN CALLER",
    title: "HELLO, JAKE.",
    text: "The voice is calm. Too calm. “You made it another year. Tell me… what makes a perfect birthday night?”",
    choices: ["A HORROR MOVIE MARATHON", "A MIDNIGHT MOTORCYCLE RIDE"],
    answers: [
      "“Excellent choice.” The caller hangs up. Your next triple feature is already waiting.",
      "“Watch the road.” The line goes dead. Somewhere outside, a motorcycle roars to life.",
    ],
  },
};
let lastTrigger;
document.querySelectorAll("[data-scene]").forEach(
  (button) =>
    (button.onclick = () => {
      lastTrigger = button;
      const key = button.dataset.scene,
        c = chapters[key];
      $("chapter").textContent = c.number;
      $("dialogTitle").textContent = c.title;
      $("dialogText").textContent = c.text;
      $("dialogScene").className = "dialog-scene " + key;
      $("answer").textContent = "";
      $("choices").replaceChildren();
      c.choices.forEach((label, i) => {
        const b = document.createElement("button");
        b.textContent = label;
        b.onclick = () => {
          $("answer").textContent = c.answers[i];
          sound(key === "room" ? 61 : 90, 1.6, "triangle", 0.07);
        };
        $("choices").append(b);
      });
      $("nightmare").showModal();
      sound(key === "phone" ? 440 : 38, 1.1, "sine", 0.05);
    }),
);
$("closeDialog").onclick = () => $("nightmare").close();
$("nightmare").addEventListener("close", () => lastTrigger?.focus());
$("share").onclick = async () => {
  try {
    if (navigator.share)
      await navigator.share({
        title: "Jake — Another Nightmare",
        text: "Another year. Another nightmare.",
        url: location.href,
      });
    else {
      await navigator.clipboard.writeText(location.href);
      $("status").textContent = "Link copied. Pass it on… if you dare.";
    }
  } catch (e) {
    if (e.name !== "AbortError")
      $("status").textContent =
        "Copy the link from your browser’s address bar.";
  }
};
document.addEventListener("visibilitychange", () => {
  if (audio) {
    if (document.hidden) audio.suspend();
    else if (musicOn) audio.resume();
  }
});
