import * as IF from 'https://unpkg.com/infrontjs@1.0.1/dist/infrontjs.esm.js';
import { Store } from "./Store.js";
export class SettingsState extends IF.State {
    static ID = 'settings';
    static ROUTE = '/settings';

    async enter() {
        this.app.view.render(this.app.container, this.app.view.layout('Settings', `
          <p class="muted">A separate state that edits shared settings.</p>

          <div class="row" style="margin: 10px 0;">
            <label>
              Theme:&nbsp;
              <select id="theme" style="padding:8px 10px;border-radius:10px;border:1px solid rgba(127,127,127,.35);background:transparent;color:inherit;">
                <option value="system" ${Store.theme === 'system' ? 'selected' : ''}>system</option>
                <option value="light" ${Store.theme === 'light' ? 'selected' : ''}>light</option>
                <option value="dark" ${Store.theme === 'dark' ? 'selected' : ''}>dark</option>
              </select>
            </label>
            <button id="save">Save</button>
            <button id="home">Home</button>
          </div>

          <div class="card" style="border-radius:12px; padding:12px;">
            <div class="muted">Current Store snapshot:</div>
            <pre style="margin:10px 0 0 0; overflow:auto;"><code>${JSON.stringify(Store, null, 2)}</code></pre>
          </div>
        `));

        this.app.container.querySelector('#save')?.addEventListener('click', () => {
            const theme = this.app.container.querySelector('#theme')?.value || 'system';
            Store.theme = theme;
            // Persisting theme would be user-land (e.g., localStorage). Here we just re-render.
            this.enter();
        });

        this.app.container.querySelector('#home')?.addEventListener('click', () => {
            this.app.router.redirect('/');
        });
    }
}
