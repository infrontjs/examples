import * as IF from 'https://unpkg.com/infrontjs@1.0.1/dist/infrontjs.esm.js';
import { Store } from "./Store.js";

export class HomeState extends IF.State {
    static ID = 'home';
    static ROUTE = '/';

    async enter() {
        Store.lastVisited = new Date().toLocaleString();

        this.app.view.render(this.app.container, this.app.view.layout('Home', `
          <p>
            Use the nav above (hash routes) to switch states. The <strong>Counter</strong> and <strong>Settings</strong>
            states read/write a shared <code>Store</code> object.
          </p>

          <div class="card" style="border-radius:12px; padding:12px;">
            <div class="row">
              <span class="badge">count = <strong>${Store.count}</strong></span>
              <span class="badge">theme = <strong>${Store.theme}</strong></span>
              <span class="badge">lastVisited = <strong>${Store.lastVisited}</strong></span>
            </div>
            <div class="hr"></div>
            <div class="row">
              <button id="goCounter">Go to Counter</button>
              <button id="goSettings">Go to Settings</button>
            </div>
          </div>
        `));

        this.app.container.querySelector('#goCounter')?.addEventListener('click', () => {
            this.app.router.redirect('/counter');
        });
        this.app.container.querySelector('#goSettings')?.addEventListener('click', () => {
            this.app.router.redirect('/settings');
        });
    }
}
