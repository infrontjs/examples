import * as IF from 'https://unpkg.com/infrontjs@1.0.1/dist/infrontjs.esm.js';
import { Store } from "./Store.js";
export class CounterState extends IF.State {
    static ID = 'counter';
    static ROUTE = '/counter';

    async enter() {
        this.app.view.render(this.app.container, this.app.view.layout('Counter', `
          <p class="muted">This state mutates shared app data and re-renders itself.</p>
          <div class="row" style="margin: 10px 0;">
            <span class="badge">count = <strong id="countVal">${Store.count}</strong></span>
          </div>
          <div class="row">
            <button id="inc">+1</button>
            <button id="dec">-1</button>
            <button id="reset">Reset</button>
            <button id="back">Back to Home</button>
          </div>
        `));

        const rerender = () => this.enter();

        this.app.container.querySelector('#inc')?.addEventListener('click', () => {
            Store.count += 1;
            rerender();
        });
        this.app.container.querySelector('#dec')?.addEventListener('click', () => {
            Store.count -= 1;
            rerender();
        });
        this.app.container.querySelector('#reset')?.addEventListener('click', () => {
            Store.count = 0;
            rerender();
        });
        this.app.container.querySelector('#back')?.addEventListener('click', () => {
            this.app.router.redirect('/');
        });
    }
}
