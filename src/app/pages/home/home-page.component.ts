import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="min-h-screen bg-whatsapp-bg px-4 py-6">
      <section class="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-center">
        <div class="mb-5">
          <p class="text-sm font-semibold text-whatsapp-dark">Enkete</p>
          <h1 class="mt-2 text-3xl font-bold leading-tight text-gray-950">Crie uma enquete simples</h1>
        </div>

        <form class="rounded-lg bg-white p-5 shadow-sm" (ngSubmit)="createPoll()">
          <label class="block">
            <span class="text-sm font-semibold text-gray-800">Título da enquete</span>
            <input
              class="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-whatsapp focus:ring-4 focus:ring-whatsapp/20"
              name="title"
              type="text"
              autocomplete="off"
              placeholder="Festa junina da família"
              [ngModel]="title()"
              (ngModelChange)="title.set($event)"
            />
          </label>

          <div class="mt-5">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-800">Itens</span>
              <button
                class="rounded-lg bg-whatsapp/15 px-4 py-2 text-sm font-bold text-whatsapp-dark"
                type="button"
                (click)="addItem()"
              >
                Adicionar
              </button>
            </div>

            <div class="space-y-3">
              @for (item of items(); track item.id) {
                <div class="flex gap-2">
                  <input
                    class="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-whatsapp focus:ring-4 focus:ring-whatsapp/20"
                    type="text"
                    autocomplete="off"
                    name="item-{{ item.id }}"
                    placeholder="Paçoca"
                    [ngModel]="item.name"
                    (ngModelChange)="updateItem(item.id, $event)"
                  />
                  <button
                    class="h-12 w-12 shrink-0 rounded-lg bg-gray-100 text-xl font-bold text-gray-500 disabled:opacity-40"
                    type="button"
                    aria-label="Remover item"
                    [disabled]="items().length === 1"
                    (click)="removeItem(item.id)"
                  >
                    -
                  </button>
                </div>
              }
            </div>
          </div>

          @if (error()) {
            <p class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{{ error() }}</p>
          }

          @if (!supabase.hasConfig()) {
            <p class="mt-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
              Configure SUPABASE_URL e SUPABASE_ANON_KEY antes de criar enquetes.
            </p>
          }

          <button
            class="mt-5 w-full rounded-lg bg-whatsapp px-5 py-4 text-lg font-bold text-white shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            [disabled]="!canSubmit() || loading()"
          >
            {{ loading() ? 'Criando...' : 'Criar enquete' }}
          </button>
        </form>
      </section>
    </main>
  `
})
export class HomePageComponent {
  private readonly router = inject(Router);
  readonly supabase = inject(SupabaseService);

  readonly title = signal('');
  readonly items = signal([{ id: crypto.randomUUID(), name: '' }]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly canSubmit = computed(() => {
    return this.title().trim().length > 0 && this.cleanItems().length > 0 && this.supabase.hasConfig();
  });

  addItem(): void {
    this.items.update((items) => [...items, { id: crypto.randomUUID(), name: '' }]);
  }

  removeItem(id: string): void {
    this.items.update((items) => items.filter((item) => item.id !== id));
  }

  updateItem(id: string, name: string): void {
    this.items.update((items) => items.map((item) => (item.id === id ? { ...item, name } : item)));
  }

  async createPoll(): Promise<void> {
    if (!this.canSubmit()) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const pollId = await this.supabase.createPoll(this.title().trim(), this.cleanItems());
      await this.router.navigate(['/poll', pollId]);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Não foi possível criar a enquete.');
    } finally {
      this.loading.set(false);
    }
  }

  private cleanItems(): string[] {
    return this.items()
      .map((item) => item.name.trim())
      .filter(Boolean);
  }
}
