# Minefun.io Calculator

A draggable, full-featured scientific calculator overlay for **minefun.io** – built as a Tampermonkey userscript.

Press `Ctrl + Alt + C` to toggle the panel.  
Works on `minefun.io` and all its subdomains.

---

## Features

- Basic arithmetic with a full keypad.
- Scientific functions: sin, cos, tan (inverse), log, ln, sqrt, abs, factorial, exponentiation, constants pi and e.
- Toggle between DEG (degrees) and RAD (radians) angle modes.
- History tab that stores the last 20 expressions and results (persists via localStorage).
- Copy result button for easy clipboard access.
- Draggable and resizable panel.
- Clean, cyber-themed UI with cyan accent.
- Built-in Discord link.
- No external dependencies – lightweight vanilla JavaScript.

---

## Installation

1. Install a userscript manager like **Tampermonkey**, **Greasemonkey**, or **Violentmonkey**.
2. Create a new script and paste the full source code.
3. Save – it will run automatically on `minefun.io` and its subdomains.

---

## Usage

1. Press `Ctrl + Alt + C` to show the calculator.
2. Use the **BASIC** tab for quick arithmetic – type or click buttons, then press `=` or hit Enter.
3. Switch to the **SCIENTIFIC** tab for advanced functions; click function buttons (e.g., `sin`) to insert them.
4. The **HISTORY** tab shows previous calculations; copy the last result or clear history.
5. Drag the panel by its title bar, and resize by dragging the corner.

All expressions support standard precedence: parentheses, exponents (`^`), multiplication/division, addition/subtraction.

---

## Keyboard Shortcuts

| Shortcut         | Action          |
|------------------|-----------------|
| `Ctrl + Alt + C` | Toggle panel    |
| `Enter`          | Evaluate input  |

---

## Customization

History is stored in `localStorage` under the key `calc_history`.  
You can adjust the maximum number of history items by modifying the `.slice(-20)` value in the `saveHistory` function.

Angle mode (DEG/RAD) is selected via the on-screen buttons and applied globally to all trigonometric functions.

---

## Author

**Itz_Krishna AKA Everlasting**
