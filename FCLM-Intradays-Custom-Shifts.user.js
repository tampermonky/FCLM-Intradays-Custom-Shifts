// ==UserScript==
// @name         FCLM Intradays (Custom Shifts)
// @namespace    https://github.com/tampermonky/FCLM-Intradays-Custom-Shifts
// @version      3.1
// @description  Custom intraday and full-day shift buttons with editable shift times
// @author       eydel@
// @match        https://fclm-portal.amazon.com/*
// @updateURL    https://raw.githubusercontent.com/tampermonky/FCLM-Intradays-Custom-Shifts/main/FCLM-Intradays-Custom-Shifts.user.js
// @downloadURL  https://raw.githubusercontent.com/tampermonky/FCLM-Intradays-Custom-Shifts/main/FCLM-Intradays-Custom-Shifts.user.js
// @grant        none
// ==/UserScript==

(() => {
    "use strict";

    /* =========================
       CONSTANTS
    ========================= */

    const STORAGE_KEY = "fclmCustomShiftSettings";

    const DEFAULT_SETTINGS = {
        day: {
            name: "Day",
            startHour: 8,
            startMinute: 0,
            endHour: 13,
            endMinute: 30,
            color: "#FFFFE0",
            type: "intraday"
        },
        twi: {
            name: "TWI",
            startHour: 13,
            startMinute: 30,
            endHour: 19,
            endMinute: 0,
            color: "#FFB6C1",
            type: "intraday"
        },
        nit: {
            name: "NIT",
            startHour: 19,
            startMinute: 0,
            endHour: 23,
            endMinute: 45,
            color: "#B0E0E6",
            type: "intraday"
        },
        wd: {
            name: "WD",
            startHour: 23,
            startMinute: 45,
            endHour: 4,
            endMinute: 0,
            color: "#D8BFD8",
            type: "intraday"
        },
        fullDayToday: {
            name: "Full Day Today",
            startHour: 4,
            startMinute: 0,
            endHour: 4,
            endMinute: 0,
            color: "#C1FFC1",
            type: "fullDayToday"
        },
        priorFullDay: {
            name: "Prior Full Day",
            startHour: 4,
            startMinute: 0,
            endHour: 4,
            endMinute: 0,
            color: "#FFE4E1",
            type: "priorFullDay"
        }
    };

    let shiftSettings = loadSettings();

    /* =========================
       HELPERS
    ========================= */

    function deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : deepClone(DEFAULT_SETTINGS);
        } catch (error) {
            console.warn("Unable to load saved shift settings. Using defaults.", error);
            return deepClone(DEFAULT_SETTINGS);
        }
    }

    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shiftSettings));
    }

    function formatDate(date) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("/");
    }

    function padTime(value) {
        return String(value).padStart(2, "0");
    }

    function toTimeValue(hour, minute) {
        return `${padTime(hour)}:${padTime(minute)}`;
    }

    function parseTimeValue(value) {
        const [hour, minute] = value.split(":").map(Number);
        return { hour, minute };
    }

    function isOvernightShift(shift) {
        const startMinutes = shift.startHour * 60 + shift.startMinute;
        const endMinutes = shift.endHour * 60 + shift.endMinute;
        return endMinutes < startMinutes;
    }

    function getInput(id) {
        return document.getElementById(id);
    }

    function setInputValue(id, value) {
        const input = getInput(id);
        if (input) input.value = value;
    }

    /* =========================
       SHIFT ACTION
    ========================= */

    function setShiftTime(shiftKey) {
        const shift = shiftSettings[shiftKey];
        if (!shift) return;

        const today = new Date();
        const tomorrow = new Date(today);
        const yesterday = new Date(today);

        tomorrow.setDate(today.getDate() + 1);
        yesterday.setDate(today.getDate() - 1);

        let startDate = today;
        let endDate = today;

        if (shift.type === "fullDayToday") {
            startDate = today;
            endDate = tomorrow;
        } else if (shift.type === "priorFullDay") {
            startDate = yesterday;
            endDate = today;
        } else if (isOvernightShift(shift)) {
            startDate = today;
            endDate = tomorrow;
        }

        setInputValue("startDateIntraday", formatDate(startDate));
        setInputValue("endDateIntraday", formatDate(endDate));
        setInputValue("startHourIntraday", shift.startHour);
        setInputValue("startMinuteIntraday", shift.startMinute);
        setInputValue("endHourIntraday", shift.endHour);
        setInputValue("endMinuteIntraday", shift.endMinute);

        const privateView = getInput("privateView");
        if (privateView) privateView.value = "false";
    }

    /* =========================
       STYLES
    ========================= */

    function addGlobalStyles() {
        const style = document.createElement("style");
        style.textContent = `
            #fclm-custom-shifts-container {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 10px;
            }

            #fclm-custom-shifts-buttons {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 8px;
            }

            .fclm-shift-button {
                padding: 8px 14px;
                border: 1px solid rgba(0, 0, 0, 0.12);
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.14);
                transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
            }

            .fclm-shift-button:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.18);
                filter: brightness(0.98);
            }

            .fclm-shift-button:active {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.14);
            }

            #fclm-settings-button {
                position: fixed;
                right: 18px;
                bottom: 18px;
                width: 42px;
                height: 42px;
                border: none;
                border-radius: 50%;
                background: #ffffff;
                color: #232f3e;
                font-size: 21px;
                cursor: pointer;
                z-index: 10001;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.28);
                transition: transform 0.15s ease, box-shadow 0.15s ease;
            }

            #fclm-settings-button:hover {
                transform: rotate(20deg);
                box-shadow: 0 5px 14px rgba(0, 0, 0, 0.34);
            }

            #fclm-settings-overlay {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.45);
                z-index: 10002;
            }

            #fclm-settings-panel {
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: min(520px, calc(100vw - 32px));
                max-height: calc(100vh - 40px);
                overflow-y: auto;
                background: #ffffff;
                border-radius: 12px;
                padding: 20px;
                z-index: 10003;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
                box-sizing: border-box;
                font-family: Arial, sans-serif;
            }

            #fclm-settings-panel h2 {
                margin: 0 0 6px;
                color: #232f3e;
                font-size: 20px;
            }

            #fclm-settings-panel .fclm-settings-subtitle {
                margin: 0 0 18px;
                color: #555;
                font-size: 13px;
            }

            .fclm-settings-row {
                display: grid;
                grid-template-columns: minmax(120px, 1fr) 120px 120px;
                gap: 10px;
                align-items: center;
                margin-bottom: 12px;
            }

            .fclm-settings-row label {
                font-weight: 600;
                color: #232f3e;
            }

            .fclm-settings-time-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .fclm-settings-time-group span {
                font-size: 11px;
                color: #666;
            }

            .fclm-settings-time-group input {
                padding: 7px 8px;
                border: 1px solid #bbb;
                border-radius: 6px;
                font-size: 13px;
            }

            .fclm-settings-actions {
                display: flex;
                justify-content: flex-end;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 18px;
            }

            .fclm-settings-action-button {
                padding: 8px 14px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
            }

            #fclm-save-settings {
                background: #ff9900;
                color: #111;
            }

            #fclm-reset-settings {
                background: #e7e7e7;
                color: #111;
            }

            #fclm-close-settings {
                background: #232f3e;
                color: #fff;
            }

            @media (max-width: 560px) {
                .fclm-settings-row {
                    grid-template-columns: 1fr;
                    gap: 6px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #eee;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /* =========================
       BUTTONS
    ========================= */

    function createShiftButtons() {
        const submitRow = document.querySelector(".cp-submit-row");
        if (!submitRow || document.getElementById("fclm-custom-shifts-container")) return false;

        const container = document.createElement("div");
        container.id = "fclm-custom-shifts-container";

        const buttonsWrapper = document.createElement("div");
        buttonsWrapper.id = "fclm-custom-shifts-buttons";

        Object.entries(shiftSettings).forEach(([key, shift]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.id = `${key}_shift`;
            button.className = "fclm-shift-button";
            button.textContent = shift.name;
            button.style.backgroundColor = shift.color;
            button.addEventListener("click", () => setShiftTime(key));
            buttonsWrapper.appendChild(button);
        });

        container.appendChild(buttonsWrapper);
        submitRow.appendChild(container);

        return true;
    }

    function refreshShiftButtons() {
        const existingContainer = document.getElementById("fclm-custom-shifts-container");
        if (existingContainer) existingContainer.remove();
        createShiftButtons();
    }

    /* =========================
       SETTINGS UI
    ========================= */

    function createSettingsUI() {
        if (document.getElementById("fclm-settings-button")) return;

        const settingsButton = document.createElement("button");
        settingsButton.id = "fclm-settings-button";
        settingsButton.type = "button";
        settingsButton.title = "Shift Settings";
        settingsButton.setAttribute("aria-label", "Open Shift Settings");
        settingsButton.textContent = "⚙";

        const overlay = document.createElement("div");
        overlay.id = "fclm-settings-overlay";

        const panel = document.createElement("div");
        panel.id = "fclm-settings-panel";

        panel.innerHTML = `
            <h2>Shift Settings</h2>
            <p class="fclm-settings-subtitle">Change the time for each button. Your settings save only in your browser.</p>
            <div id="fclm-settings-fields"></div>
            <div class="fclm-settings-actions">
                <button type="button" id="fclm-reset-settings" class="fclm-settings-action-button">Reset Defaults</button>
                <button type="button" id="fclm-save-settings" class="fclm-settings-action-button">Save</button>
                <button type="button" id="fclm-close-settings" class="fclm-settings-action-button">Close</button>
            </div>
        `;

        document.body.appendChild(settingsButton);
        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        renderSettingsFields();

        settingsButton.addEventListener("click", openSettings);
        overlay.addEventListener("click", closeSettings);
        panel.querySelector("#fclm-close-settings").addEventListener("click", closeSettings);
        panel.querySelector("#fclm-save-settings").addEventListener("click", saveSettingsFromPanel);
        panel.querySelector("#fclm-reset-settings").addEventListener("click", resetSettingsToDefaults);
    }

    function renderSettingsFields() {
        const fieldsContainer = document.getElementById("fclm-settings-fields");
        if (!fieldsContainer) return;

        fieldsContainer.innerHTML = "";

        Object.entries(shiftSettings).forEach(([key, shift]) => {
            const row = document.createElement("div");
            row.className = "fclm-settings-row";
            row.innerHTML = `
                <label for="${key}-start-time">${shift.name}</label>
                <div class="fclm-settings-time-group">
                    <span>Start</span>
                    <input id="${key}-start-time" type="time" value="${toTimeValue(shift.startHour, shift.startMinute)}">
                </div>
                <div class="fclm-settings-time-group">
                    <span>End</span>
                    <input id="${key}-end-time" type="time" value="${toTimeValue(shift.endHour, shift.endMinute)}">
                </div>
            `;
            fieldsContainer.appendChild(row);
        });
    }

    function openSettings() {
        document.getElementById("fclm-settings-overlay").style.display = "block";
        document.getElementById("fclm-settings-panel").style.display = "block";
    }

    function closeSettings() {
        document.getElementById("fclm-settings-overlay").style.display = "none";
        document.getElementById("fclm-settings-panel").style.display = "none";
    }

    function saveSettingsFromPanel() {
        Object.keys(shiftSettings).forEach((key) => {
            const startInput = document.getElementById(`${key}-start-time`);
            const endInput = document.getElementById(`${key}-end-time`);

            if (!startInput || !endInput) return;

            const start = parseTimeValue(startInput.value);
            const end = parseTimeValue(endInput.value);

            shiftSettings[key].startHour = start.hour;
            shiftSettings[key].startMinute = start.minute;
            shiftSettings[key].endHour = end.hour;
            shiftSettings[key].endMinute = end.minute;
        });

        saveSettings();
        refreshShiftButtons();
        closeSettings();
    }

    function resetSettingsToDefaults() {
        shiftSettings = deepClone(DEFAULT_SETTINGS);
        saveSettings();
        renderSettingsFields();
        refreshShiftButtons();
    }

    /* =========================
       INITIALIZE
    ========================= */

    function init() {
        addGlobalStyles();
        createSettingsUI();

        const observer = new MutationObserver(() => {
            createShiftButtons();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        createShiftButtons();
    }

    init();
})();