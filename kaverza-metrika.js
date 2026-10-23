/*
 * КАВЕРЗА — Яндекс.Метрика, счётчик 113760198.
 * Подключение: <script src="./metrika.js" defer></script> перед </body> в index.html.
 * НЕ добавляйте исходный код счётчика отдельно: получится дублирование.
 *
 * Цели «Целевое событие» (создаются вручную в интерфейсе Метрики):
 * game_start, wheel_spin, task_done, task_skip, game_finish, game_end_early.
 */
(() => {
  "use strict";

  const COUNTER_ID = 113760198;
  const CONSENT_KEY = "kaverza_metrika_consent_v1";
  let metrikaEnabled = false;

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); }
    catch { return null; }
  }

  function storeConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); }
    catch { /* В приватном режиме запись может быть запрещена. */ }
  }

  function loadMetrika() {
    if (metrikaEnabled) return;
    metrikaEnabled = true;

    // Официальный асинхронный загрузчик Яндекс.Метрики.
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () {
        (m[i].a = m[i].a || []).push(arguments);
      };
      m[i].l = 1 * new Date();
      for (let j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) return;
      }
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=" + COUNTER_ID, "ym");

    window.ym(COUNTER_ID, "init", {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: "dataLayer",
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true
    });
  }

  function goal(id) {
    // Ничего не отправляем, пока посетитель не согласился на аналитику.
    if (metrikaEnabled && typeof window.ym === "function") {
      window.ym(COUNTER_ID, "reachGoal", id);
    }
  }

  // Имена игроков и результаты скрыты от записей Вебвизора.
  // Имена не передаются в качестве параметров целей.
  ["#playerInputs", "#playerName", "#scores", "#finalScores",
    "#winner", "#bonusRecipient", "#toast"].forEach((selector) => {
    document.querySelector(selector)?.classList.add("ym-hide-content");
  });

  // Записываем только реальные игровые действия (после обработки клика игрой).
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.id === "start" || button.id === "again") {
      if (!document.querySelector("#game")?.classList.contains("hidden")) {
        goal("game_start");
      }
    } else if (button.id === "spin") {
      // В коде игры кнопка блокируется сразу при принятом вращении.
      if (button.disabled) goal("wheel_spin");
    } else if (button.id === "done") {
      goal("task_done");
    } else if (button.id === "skip") {
      goal("task_skip");
    }
  });

  // Завершение партии отслеживаем и при естественном окончании,
  // и при нажатии «Завершить игру» (только если его подтвердили).
  const results = document.querySelector("#results");
  if (results) {
    let wasVisible = !results.classList.contains("hidden");
    const observer = new MutationObserver(() => {
      const isVisible = !results.classList.contains("hidden");
      if (isVisible && !wasVisible) {
        // state объявлен основным скриптом игры выше подключения этого файла.
        const finishedNormally = typeof state !== "undefined" &&
          state.max > 0 && state.taken >= state.max;
        goal(finishedNormally ? "game_finish" : "game_end_early");
      }
      wasVisible = isVisible;
    });
    observer.observe(results, { attributes: true, attributeFilter: ["class"] });
  }

  // Ненавязчивое согласие. Без него счётчик НЕ загружается.
  const style = document.createElement("style");
  style.textContent = `
    #kvr-metrika-consent[hidden] { display: none !important; }
    #kvr-metrika-consent {
      position: fixed; z-index: 100; left: 12px; right: 12px;
      bottom: max(12px, env(safe-area-inset-bottom));
      max-width: 580px; margin: 0 auto; padding: 16px;
      border: 1px solid #a78bfa78; border-radius: 18px;
      background: #23203b; color: #faf7ff;
      box-shadow: 0 12px 42px #000c; font-size: 13px; line-height: 1.5; font-family: inherit;
    }
    #kvr-metrika-consent p { margin: 7px 0 12px; color: #ded5ed; }
    #kvr-metrika-consent .kvr-metrika-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    #kvr-metrika-consent .kvr-metrika-actions button { flex: 1 1 160px; }
    #kvr-metrika-consent a { color: #cdbbff; }
  `;
  document.head.append(style);

  const consentBox = document.createElement("aside");
  consentBox.id = "kvr-metrika-consent";
  consentBox.setAttribute("role", "region");
  consentBox.setAttribute("aria-label", "Настройки аналитики");
  consentBox.hidden = true;
  consentBox.innerHTML = `
    <strong>📊 Помоги сделать «КАВЕРЗУ» лучше</strong>
    <p>С твоего согласия мы используем Яндекс.Метрику и Вебвизор
    для статистики посещений и улучшения игры. Без согласия
    Яндекс.Метрика не загружается.
    <a href="https://yandex.ru/legal/confidential/ru/" target="_blank"
    rel="noopener noreferrer">Политика Яндекса</a>.</p>
    <div class="kvr-metrika-actions">
      <button class="btn primary" type="button" id="kvr-metrika-yes">Разрешить</button>
      <button class="btn" type="button" id="kvr-metrika-no">Не разрешать</button>
    </div>`;
  document.body.append(consentBox);

  const changeButton = document.createElement("button");
  changeButton.type = "button";
  changeButton.className = "icon-btn";
  changeButton.textContent = "⚙️ Настройки аналитики";
  changeButton.style.marginTop = "10px";
  changeButton.addEventListener("click", () => { consentBox.hidden = false; });
  document.querySelector(".footer")?.append(changeButton);

  consentBox.querySelector("#kvr-metrika-yes").addEventListener("click", () => {
    storeConsent("yes");
    consentBox.hidden = true;
    loadMetrika();
  });
  consentBox.querySelector("#kvr-metrika-no").addEventListener("click", () => {
    storeConsent("no");
    consentBox.hidden = true;
    // После отзыва согласия прекращаем текущую сессию Метрики перезагрузкой.
    if (metrikaEnabled) location.reload();
  });

  if (getConsent() === "yes") loadMetrika();
  else if (getConsent() !== "no") consentBox.hidden = false;
})();
