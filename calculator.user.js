// ==UserScript==
// @name         Minefun.io Calculator
// @namespace    http://tampermonkey.net
// @version      1.0
// @description  Scientific calculator.Ctrl+Alt+C to open.
// @author       Itz_Krishna AKA Everlasting
// @match        https://minefun.io/*
// @match        https://*.minefun.io/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const theme = {
        accent: '#0ff',
        glow: '0 0 5px #0ff, 0 0 10px #0ff',
        panelBg: '#0a0a1a',
        panelDark: '#05050f',
        text: '#e0e0ff',
        dim: '#8888aa',
        discord: '#5865f2'
    };

    let angleMode = 'deg';

    // Factorial Helper
    function factorial(n) {
        if (n < 0 || n > 170) return Infinity;
        let f = 1;
        for (let i = 2; i <= n; i++) f *= i;
        return f;
    }

    // Recursive Descent Parser
    class SafeMath {
        constructor(expr) {
            this.expr = expr.replace(/\s/g, '');
            this.pos = 0;
        }

        peek() { return this.expr[this.pos]; }
        consume(ch) { if (this.peek() === ch) { this.pos++; return true; } return false; }

        parseNumber() {
            let start = this.pos;
            while (/[0-9.]/.test(this.peek())) this.pos++;
            if (start === this.pos) return null;
            return parseFloat(this.expr.slice(start, this.pos));
        }

        parseConstant() {
            let rest = this.expr.slice(this.pos);
            if (rest.match(/^pi/i) || rest.startsWith('π')) {
                this.pos += (rest[0] === 'π' ? 1 : 2);
                return Math.PI;
            }
            if (rest.startsWith('e') && !/[a-z]/i.test(rest[1])) {
                this.pos += 1;
                return Math.E;
            }
            return null;
        }

        parseFunction() {
            let funcs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'abs', 'floor', 'ceil'];
            for (let fn of funcs) {
                if (this.expr.slice(this.pos).toLowerCase().startsWith(fn)) {
                    this.pos += fn.length;
                    if (this.peek() !== '(') return null;
                    this.consume('(');
                    let arg = this.parseExpression();
                    if (!this.consume(')')) throw new Error(') expected');
                    switch (fn) {
                        case 'sin': return angleMode === 'deg' ? Math.sin(arg * Math.PI/180) : Math.sin(arg);
                        case 'cos': return angleMode === 'deg' ? Math.cos(arg * Math.PI/180) : Math.cos(arg);
                        case 'tan': return angleMode === 'deg' ? Math.tan(arg * Math.PI/180) : Math.tan(arg);
                        case 'asin': return angleMode === 'deg' ? Math.asin(arg) * 180/Math.PI : Math.asin(arg);
                        case 'acos': return angleMode === 'deg' ? Math.acos(arg) * 180/Math.PI : Math.acos(arg);
                        case 'atan': return angleMode === 'deg' ? Math.atan(arg) * 180/Math.PI : Math.atan(arg);
                        case 'log': return Math.log10(arg);
                        case 'ln': return Math.log(arg);
                        case 'sqrt': return Math.sqrt(arg);
                        case 'abs': return Math.abs(arg);
                        case 'floor': return Math.floor(arg);
                        case 'ceil': return Math.ceil(arg);
                        default: return arg;
                    }
                }
            }
            return null;
        }

        parsePrimary() {
            let v = this.parseConstant();
            if (v !== null) return v;
            let f = this.parseFunction();
            if (f !== null) return f;
            let n = this.parseNumber();
            if (n !== null) return n;
            if (this.consume('(')) {
                let e = this.parseExpression();
                if (!this.consume(')')) throw new Error(') expected');
                v = e;
            } else if (this.consume('-')) {
                v = -this.parsePrimary();
            } else if (this.consume('+')) {
                v = this.parsePrimary();
            } else {
                throw new Error('unexpected');
            }
            // factorial postfix
            if (this.consume('!')) {
                v = factorial(Math.round(v));
            }
            return v;
        }

        parsePower() {
            let left = this.parsePrimary();
            while (this.consume('^')) {
                let right = this.parsePrimary();
                left = Math.pow(left, right);
            }
            return left;
        }

        parseTerm() {
            let left = this.parsePower();
            while (true) {
                if (this.consume('*')) left *= this.parsePower();
                else if (this.consume('/')) {
                    let d = this.parsePower();
                    if (d === 0) throw new Error('div by zero');
                    left /= d;
                }
                else break;
            }
            return left;
        }

        parseExpression() {
            let left = this.parseTerm();
            while (true) {
                if (this.consume('+')) left += this.parseTerm();
                else if (this.consume('-')) left -= this.parseTerm();
                else break;
            }
            return left;
        }

        evaluate() {
            try {
                let r = this.parseExpression();
                if (this.pos < this.expr.length) throw new Error('extra');
                if (!isFinite(r)) return { value: r > 0 ? '∞' : '-∞' };
                if (isNaN(r)) return { value: 'Error' };
                let fmt = (Math.abs(r) > 1e15 || (Math.abs(r) < 1e-12 && r !== 0))
                    ? r.toExponential(10)
                    : parseFloat(r.toFixed(12)).toString();
                return { value: fmt };
            } catch(e) {
                return { value: 'Error' };
            }
        }
    }

    function evaluateExpression(expr) {
        expr = expr.trim();
        if (!expr) return { value: '0' };
        // Double Star To Caret
        expr = expr.replace(/\*\*/g, '^');
        // PI Symbols & Case-Insensitive PI
        expr = expr.replace(/π/g, 'pi');
        expr = expr.replace(/pi/gi, 'pi');
        // Standalone e Constant
        expr = expr.replace(/\be\b/gi, 'e');
        let p = new SafeMath(expr);
        return p.evaluate();
    }

    // UI
    const panel = document.createElement('div');
    panel.id = 'calc-panel';
    panel.innerHTML = `
        <div class="calc-header">
            <span class="calc-title">SCIENTIFIC CALCULATOR</span>
            <div class="calc-header-buttons"><span class="calc-close">✕</span></div>
        </div>
        <div class="calc-tabs">
            <button class="calc-tab active" data-tab="basic">BASIC</button>
            <button class="calc-tab" data-tab="sci">SCIENTIFIC</button>
            <button class="calc-tab" data-tab="history">HISTORY</button>
        </div>
        <!-- BASIC TAB -->
        <div class="calc-page active" id="calc-page-basic">
            <div class="calc-mode-bar">
                <button class="calc-mode-btn ${angleMode === 'deg' ? 'active' : ''}" data-mode="deg">DEG</button>
                <button class="calc-mode-btn ${angleMode === 'rad' ? 'active' : ''}" data-mode="rad">RAD</button>
            </div>
            <input type="text" id="calc-input" class="calc-input" placeholder="(25*4)/2+100" autocomplete="off">
            <div class="calc-result"><span class="calc-result-label">RESULT</span><span id="calc-result-value" class="calc-result-value">0</span></div>
            <div class="calc-buttons">
                <button class="calc-btn" data-val="7">7</button><button class="calc-btn" data-val="8">8</button><button class="calc-btn" data-val="9">9</button>
                <button class="calc-btn" data-val="+">+</button><button class="calc-btn" data-val="(">(</button>
                <button class="calc-btn" data-val="4">4</button><button class="calc-btn" data-val="5">5</button><button class="calc-btn" data-val="6">6</button>
                <button class="calc-btn" data-val="-">-</button><button class="calc-btn" data-val=")">)</button>
                <button class="calc-btn" data-val="1">1</button><button class="calc-btn" data-val="2">2</button><button class="calc-btn" data-val="3">3</button>
                <button class="calc-btn" data-val="*">×</button><button class="calc-btn calc-clear" data-clear="last">⌫</button>
                <button class="calc-btn" data-val="0">0</button><button class="calc-btn" data-val=".">.</button>
                <button class="calc-btn calc-eval" data-eval="=">=</button>
                <button class="calc-btn" data-val="/">÷</button><button class="calc-btn calc-clear" data-clear="all">AC</button>
            </div>
            <button id="calc-copy" class="calc-action-btn">COPY RESULT</button>
        </div>
        <!-- SCIENTIFIC TAB -->
        <div class="calc-page" id="calc-page-sci">
            <div class="calc-mode-bar">
                <button class="calc-mode-btn ${angleMode === 'deg' ? 'active' : ''}" data-mode="deg">DEG</button>
                <button class="calc-mode-btn ${angleMode === 'rad' ? 'active' : ''}" data-mode="rad">RAD</button>
            </div>
            <div class="calc-sci-input-area">
                <input type="text" id="calc-sci-input" class="calc-input" placeholder="sin(30)+cos(60)" autocomplete="off">
                <div class="calc-result"><span class="calc-result-label">RESULT</span><span id="calc-sci-result" class="calc-result-value">0</span></div>
            </div>
            <div class="calc-sci-buttons">
                <div class="calc-buttons">
                    <button class="calc-btn" data-val="7">7</button><button class="calc-btn" data-val="8">8</button><button class="calc-btn" data-val="9">9</button>
                    <button class="calc-btn" data-val="+">+</button><button class="calc-btn" data-val="(">(</button>
                    <button class="calc-btn" data-val="4">4</button><button class="calc-btn" data-val="5">5</button><button class="calc-btn" data-val="6">6</button>
                    <button class="calc-btn" data-val="-">-</button><button class="calc-btn" data-val=")">)</button>
                    <button class="calc-btn" data-val="1">1</button><button class="calc-btn" data-val="2">2</button><button class="calc-btn" data-val="3">3</button>
                    <button class="calc-btn" data-val="*">×</button><button class="calc-btn calc-clear" data-clear="last">⌫</button>
                    <button class="calc-btn" data-val="0">0</button><button class="calc-btn" data-val=".">.</button>
                    <button class="calc-btn calc-eval" data-eval="=">=</button>
                    <button class="calc-btn" data-val="/">÷</button><button class="calc-btn calc-clear" data-clear="all">AC</button>
                </div>
                <div class="calc-sci-grid">
                    <button class="calc-sci-btn" data-func="sin">sin</button><button class="calc-sci-btn" data-func="cos">cos</button>
                    <button class="calc-sci-btn" data-func="tan">tan</button><button class="calc-sci-btn" data-func="log">log</button>
                    <button class="calc-sci-btn" data-func="ln">ln</button><button class="calc-sci-btn" data-func="sqrt">√</button>
                    <button class="calc-sci-btn" data-func="^">xʸ</button><button class="calc-sci-btn" data-func="!">x!</button>
                    <button class="calc-sci-btn" data-func="abs">abs</button><button class="calc-sci-btn" data-func="pi">π</button>
                    <button class="calc-sci-btn" data-func="e">e</button><button class="calc-sci-btn" data-func="(">(</button>
                    <button class="calc-sci-btn" data-func=")">)</button><button class="calc-sci-btn" data-clear="all">AC</button>
                    <button class="calc-sci-btn" data-clear="last">⌫</button><button class="calc-sci-btn calc-eval" data-eval="=">=</button>
                </div>
            </div>
            <button id="calc-copy-sci" class="calc-action-btn">COPY RESULT</button>
        </div>
        <!-- HISTORY TAB -->
        <div class="calc-page" id="calc-page-history">
            <div id="calc-history-list" class="calc-history-list"></div>
            <button id="calc-copy-history" class="calc-action-btn">COPY LAST</button>
            <button id="calc-clear-history" class="calc-action-btn">CLEAR HISTORY</button>
        </div>
        <div class="calc-footer"><a href="https://discord.gg/byXxUkZxag" target="_blank" class="calc-discord-link">JOIN OUR DISCORD</a></div>
    `;
    document.body.appendChild(panel);

    // Styles
    const style = document.createElement('style');
    style.textContent = `
        #calc-panel {
            position: fixed; top: 100px; left: 100px; width: 560px; min-width: 360px;
            resize: both; overflow: hidden;
            background: ${theme.panelBg}; color: ${theme.text};
            border-radius: 16px; border: 1px solid ${theme.accent};
            box-shadow: 0 8px 28px rgba(0,255,255,0.2), ${theme.glow};
            font-family: 'Segoe UI', system-ui, sans-serif;
            font-size: 13px; z-index: 2147483647; display: none;
        }
        .calc-header {
            display: flex; justify-content: space-between; align-items: center;
            background: ${theme.panelDark}; padding: 10px 14px;
            border-bottom: 1px solid ${theme.accent}; cursor: move;
        }
        .calc-title { font-weight: 700; font-size: 13px; color: ${theme.accent}; text-shadow: 0 0 3px ${theme.accent}; }
        .calc-close { background: none; border: none; color: ${theme.dim}; cursor: pointer; font-size: 16px; padding: 0 4px; }
        .calc-close:hover { color: #fff; text-shadow: 0 0 5px ${theme.accent}; }
        .calc-tabs { display: flex; background: #05050f; border-bottom: 1px solid ${theme.accent}; }
        .calc-tab { flex: 1; text-align: center; padding: 8px; border: none; background: none; color: ${theme.dim}; font-size: 10px; font-weight: 600; cursor: pointer; text-transform: uppercase; }
        .calc-tab.active { color: ${theme.accent}; border-bottom: 2px solid ${theme.accent}; text-shadow: 0 0 2px ${theme.accent}; }
        .calc-page { display: none; padding: 14px; max-height: 60vh; overflow-y: auto; }
        .calc-page.active { display: block; }
        .calc-mode-bar { display: flex; gap: 8px; margin-bottom: 12px; justify-content: flex-end; }
        .calc-mode-btn { background: #1a1a2a; border: 1px solid #2a2a3a; border-radius: 4px; color: ${theme.dim}; font-size: 9px; padding: 4px 10px; cursor: pointer; font-weight: 600; }
        .calc-mode-btn.active { background: ${theme.accent}; color: #000; border-color: ${theme.accent}; box-shadow: 0 0 6px ${theme.accent}; }
        .calc-mode-btn:hover { background: ${theme.accent}; color: #000; }
        .calc-input { width: 100%; background: #0a0a1a; border: 1px solid #2a2a3a; border-radius: 8px; color: ${theme.text}; padding: 10px; font-size: 13px; font-family: monospace; margin-bottom: 10px; outline: none; box-sizing: border-box; }
        .calc-input:focus { border-color: ${theme.accent}; box-shadow: 0 0 5px ${theme.accent}; }
        .calc-result { background: #05050f; border-radius: 8px; padding: 8px; margin-bottom: 10px; border: 1px solid #1a1a2a; text-align: right; }
        .calc-result-label { font-size: 9px; color: ${theme.dim}; }
        .calc-result-value { font-size: 20px; font-weight: bold; color: ${theme.accent}; font-family: monospace; word-break: break-all; }
        .calc-buttons { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 12px; }
        .calc-btn, .calc-sci-btn { background: #1a1a2a; border: 1px solid #2a2a3a; border-radius: 8px; color: ${theme.text}; padding: 10px; font-size: 14px; cursor: pointer; text-align: center; }
        .calc-btn:hover, .calc-sci-btn:hover { background: ${theme.accent}; color: #000; border-color: ${theme.accent}; }
        .calc-clear { color: #ff6666; border-color: #ff6666; }
        .calc-clear:hover { background: #ff6666; color: #000; }
        .calc-eval { background: ${theme.accent}; color: #000; font-weight: bold; }
        .calc-action-btn { width: 100%; background: #1a1a2a; border: 1px solid ${theme.accent}; border-radius: 8px; color: ${theme.text}; padding: 8px; cursor: pointer; font-size: 11px; margin-top: 6px; }
        .calc-action-btn:hover { background: ${theme.accent}; color: #000; }
        .calc-sci-buttons { margin-top: 8px; }
        .calc-sci-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
        .calc-history-list { max-height: 320px; overflow-y: auto; }
        .calc-history-item { background: #0a0a1a; border: 1px solid #2a2a3a; border-radius: 8px; padding: 8px; margin-bottom: 8px; font-family: monospace; font-size: 11px; }
        .calc-history-item:hover { border-color: ${theme.accent}; }
        .calc-history-expr { color: ${theme.dim}; word-break: break-all; }
        .calc-history-result { color: ${theme.accent}; font-weight: bold; margin-top: 4px; }
        .calc-history-time { font-size: 9px; color: #555; margin-top: 4px; }
        .calc-footer { padding: 8px; border-top: 1px solid #1a1a2a; text-align: center; }
        .calc-discord-link { display: inline-block; text-decoration: none; color: ${theme.accent}; font-size: 11px; padding: 4px 12px; border-radius: 6px; }
        .calc-discord-link:hover { background: ${theme.discord}; color: #fff; }
    `;
    document.head.appendChild(style);

    // DOM Elements
    const basicInput = document.getElementById('calc-input');
    const basicResult = document.getElementById('calc-result-value');
    const sciInput = document.getElementById('calc-sci-input');
    const sciResult = document.getElementById('calc-sci-result');
    const historyList = document.getElementById('calc-history-list');
    const copyBasic = document.getElementById('calc-copy');
    const copySci = document.getElementById('calc-copy-sci');
    const copyHist = document.getElementById('calc-copy-history');
    const clearHist = document.getElementById('calc-clear-history');

    let history = JSON.parse(localStorage.getItem('calc_history')) || [];

    function saveHistory() { localStorage.setItem('calc_history', JSON.stringify(history.slice(-20))); }
    function addToHistory(expr, result) {
        if (result === 'Error') return; // skip errors
        history.unshift({ expr, result, time: new Date().toLocaleTimeString() });
        if (history.length > 20) history.pop();
        saveHistory();
        if (document.getElementById('calc-page-history').classList.contains('active')) renderHistory();
    }
    function renderHistory() {
        if (!historyList) return;
        if (history.length === 0) { historyList.innerHTML = '<div style="text-align:center; color:#666; padding:20px;">No history yet</div>'; return; }
        historyList.innerHTML = history.map(h => `<div class="calc-history-item"><div class="calc-history-expr">${escapeHtml(h.expr)}</div><div class="calc-history-result">= ${escapeHtml(h.result)}</div><div class="calc-history-time">${escapeHtml(h.time)}</div></div>`).join('');
    }
    function escapeHtml(s) { return String(s).replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); }

    function evaluateAndDisplay(input, resultSpan, addToHist) {
        let expr = input.value.trim();
        if (!expr) return;
        let res = evaluateExpression(expr);
        resultSpan.textContent = res.value;
        if (addToHist && res.value !== 'Error') addToHistory(expr, res.value);
    }
    function evaluateBasic() { evaluateAndDisplay(basicInput, basicResult, true); }
    function evaluateSci() { evaluateAndDisplay(sciInput, sciResult, true); }

    function copyResult(src) { navigator.clipboard.writeText(src); }
    copyBasic.onclick = () => { copyResult(basicResult.textContent); copyBasic.textContent = 'COPIED!'; setTimeout(() => copyBasic.textContent = 'COPY RESULT', 1500); };
    copySci.onclick = () => { copyResult(sciResult.textContent); copySci.textContent = 'COPIED!'; setTimeout(() => copySci.textContent = 'COPY RESULT', 1500); };
    copyHist.onclick = () => {
        let last = history[0];
        if (last && last.result !== 'Error') copyResult(last.result);
        copyHist.textContent = 'COPIED!';
        setTimeout(() => copyHist.textContent = 'COPY LAST', 1500);
    };
    clearHist.onclick = () => { history = []; saveHistory(); renderHistory(); };

    function setAngleMode(mode) {
        angleMode = mode;
        document.querySelectorAll('.calc-mode-btn').forEach(btn => {
            if (btn.dataset.mode === mode) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }
    document.querySelectorAll('.calc-mode-btn').forEach(btn => btn.addEventListener('click', () => setAngleMode(btn.dataset.mode)));

    // Basic Tab
    basicInput.addEventListener('keypress', e => { if (e.key === 'Enter') evaluateBasic(); });
    document.querySelectorAll('#calc-page-basic .calc-btn[data-val]').forEach(btn => btn.addEventListener('click', () => { basicInput.value += btn.dataset.val; basicInput.focus(); }));
    document.querySelectorAll('#calc-page-basic .calc-clear[data-clear="all"]').forEach(btn => btn.addEventListener('click', () => { basicInput.value = ''; basicResult.textContent = '0'; basicInput.focus(); }));
    document.querySelectorAll('#calc-page-basic .calc-clear[data-clear="last"]').forEach(btn => btn.addEventListener('click', () => { basicInput.value = basicInput.value.slice(0, -1); basicInput.focus(); }));
    document.querySelectorAll('#calc-page-basic .calc-eval').forEach(btn => btn.addEventListener('click', evaluateBasic));

    // Scientific Tab
    sciInput.addEventListener('keypress', e => { if (e.key === 'Enter') evaluateSci(); });
    document.querySelectorAll('#calc-page-sci .calc-btn[data-val]').forEach(btn => btn.addEventListener('click', () => { sciInput.value += btn.dataset.val; sciInput.focus(); }));
    document.querySelectorAll('#calc-page-sci .calc-clear[data-clear="all"]').forEach(btn => btn.addEventListener('click', () => { sciInput.value = ''; sciResult.textContent = '0'; sciInput.focus(); }));
    document.querySelectorAll('#calc-page-sci .calc-clear[data-clear="last"]').forEach(btn => btn.addEventListener('click', () => { sciInput.value = sciInput.value.slice(0, -1); sciInput.focus(); }));
    document.querySelectorAll('#calc-page-sci .calc-eval').forEach(btn => btn.addEventListener('click', evaluateSci));
    document.querySelectorAll('#calc-page-sci .calc-sci-btn[data-func]').forEach(btn => btn.addEventListener('click', () => {
        let f = btn.dataset.func;
        if (f === '!') sciInput.value += '!';
        else if (f === '^') sciInput.value += '^';
        else if (f === 'sqrt') sciInput.value += 'sqrt(';
        else if (f === 'pi') sciInput.value += 'π';
        else if (f === 'e') sciInput.value += 'e';
        else sciInput.value += `${f}(`;
        sciInput.focus();
    }));
    document.querySelectorAll('#calc-page-sci .calc-sci-btn[data-clear="all"]').forEach(btn => btn.addEventListener('click', () => { sciInput.value = ''; sciResult.textContent = '0'; sciInput.focus(); }));
    document.querySelectorAll('#calc-page-sci .calc-sci-btn[data-clear="last"]').forEach(btn => btn.addEventListener('click', () => { sciInput.value = sciInput.value.slice(0, -1); sciInput.focus(); }));
    document.querySelectorAll('#calc-page-sci .calc-sci-btn.calc-eval').forEach(btn => btn.addEventListener('click', evaluateSci));

    // Tab Switching
    document.querySelectorAll('.calc-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            let target = tab.dataset.tab;
            document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.calc-page').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`calc-page-${target}`).classList.add('active');
            if (target === 'history') renderHistory();
        });
    });

    // Drag
    let drag = false, offX, offY;
    let header = document.querySelector('.calc-header');
    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('calc-close')) return;
        drag = true;
        let rect = panel.getBoundingClientRect();
        offX = e.clientX - rect.left;
        offY = e.clientY - rect.top;
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!drag) return;
        let left = e.clientX - offX;
        let top = e.clientY - offY;
        left = Math.min(Math.max(0, left), window.innerWidth - panel.offsetWidth);
        top = Math.min(Math.max(0, top), window.innerHeight - panel.offsetHeight);
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
        panel.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => drag = false);

    document.querySelector('.calc-close').addEventListener('click', () => panel.style.display = 'none');

    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    });

    renderHistory();
    panel.style.display = 'none';
})();
