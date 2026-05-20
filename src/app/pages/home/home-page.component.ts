import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="flex min-h-screen flex-col bg-[#f5f5f7] px-4 py-6 text-gray-950">
      <section class="mx-auto flex min-h-[calc(100vh-5.75rem)] w-full max-w-md flex-1 flex-col justify-center">
        <div class="mb-5 px-1">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-gray-500">Enkete</p>
              <h1 class="mt-1 text-[2rem] font-semibold leading-tight tracking-normal text-gray-950">Crie um enquete</h1>
            </div>
            <button
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm shadow-gray-200/60 transition active:scale-[0.98] active:bg-gray-100"
              type="button"
              aria-label="Sobre o Enkete"
              [attr.aria-expanded]="showInfo()"
              (click)="toggleInfo()"
            >
              <svg class="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>

          @if (showInfo()) {
            <div class="mt-4 rounded-lg border border-gray-200/80 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-gray-600 shadow-sm shadow-gray-200/50">
              Enkete ajuda a combinar itens em grupo: você cria uma lista, compartilha o link e cada pessoa confirma o que vai levar.
            </div>
          }
        </div>

        <form class="rounded-lg border border-gray-200/80 bg-white p-4 shadow-sm shadow-gray-200/50" (ngSubmit)="createPoll()">
          <label class="block">
            <span class="text-sm font-semibold text-gray-700">Título da enquete</span>
            <input
              class="mt-2 w-full rounded-lg border border-transparent bg-gray-100 px-4 py-3 text-base outline-none transition placeholder:text-gray-400 focus:border-[#007aff] focus:bg-white focus:ring-4 focus:ring-[#007aff]/10"
              name="title"
              type="text"
              autocomplete="off"
              placeholder="Festa junina da família"
              [ngModel]="title()"
              (ngModelChange)="title.set($event)"
            />
          </label>

          <label class="mt-4 block">
            <span class="text-sm font-semibold text-gray-700">Subtítulo opcional</span>
            <input
              class="mt-2 w-full rounded-lg border border-transparent bg-gray-100 px-4 py-3 text-base outline-none transition placeholder:text-gray-400 focus:border-[#007aff] focus:bg-white focus:ring-4 focus:ring-[#007aff]/10"
              name="subtitle"
              type="text"
              autocomplete="off"
              placeholder="Combine os itens da festa"
              [ngModel]="subtitle()"
              (ngModelChange)="subtitle.set($event)"
            />
          </label>

          <div class="mt-5 rounded-lg bg-gray-100 px-4 py-3">
            <label class="flex items-start gap-3">
              <input
                class="mt-0.5 h-5 w-5 accent-[#007aff]"
                name="allow-multiple-answers"
                type="checkbox"
                [ngModel]="allowMultipleAnswers()"
                (ngModelChange)="allowMultipleAnswers.set($event)"
              />
              <span>
                <span class="block text-sm font-semibold text-gray-800">Permitir múltiplas respostas</span>
                <span class="mt-0.5 block text-sm font-medium leading-snug text-gray-500">Cada pessoa poderá escolher mais de um item.</span>
              </span>
            </label>
          </div>

          <div class="mt-5">
            <div class="mb-2">
              <span class="text-sm font-semibold text-gray-700">Itens</span>
            </div>

            <div class="space-y-2.5">
              @for (item of items(); track item.id) {
                <div class="flex gap-2">
                  <input
                    #itemInput
                    class="min-w-0 flex-1 rounded-lg border border-transparent bg-gray-100 px-4 py-3 text-base outline-none transition placeholder:text-gray-400 focus:border-[#007aff] focus:bg-white focus:ring-4 focus:ring-[#007aff]/10"
                    type="text"
                    autocomplete="off"
                    name="item-{{ item.id }}"
                    placeholder="Paçoca, Bolo, Suco"
                    [ngModel]="item.name"
                    (ngModelChange)="updateItem(item.id, $event)"
                  />
                  <button
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition active:scale-[0.98] active:bg-gray-200 disabled:opacity-35"
                    type="button"
                    aria-label="Remover item"
                    [disabled]="items().length === 1"
                    (click)="removeItem(item.id)"
                  >
                    <svg class="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M6 6l1 15h10l1-15" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              }
            </div>

            <button
              class="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-950 transition active:scale-[0.98] active:bg-gray-200"
              type="button"
              (click)="addItem()"
            >
              <svg class="h-4 w-4 text-[#007aff]" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Adicionar
            </button>
          </div>

          @if (error()) {
            <p class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{{ error() }}</p>
          }

          @if (!supabase.hasConfig()) {
            <p class="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Configure SUPABASE_URL e SUPABASE_ANON_KEY antes de criar enquetes.
            </p>
          }

          <button
            class="mt-5 flex min-h-12 w-full items-center justify-center rounded-lg bg-[#007aff] px-5 py-3 text-base font-semibold text-white shadow-sm shadow-[#007aff]/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            type="submit"
            [disabled]="!canSubmit() || loading()"
          >
            {{ loading() ? 'Criando...' : 'Criar enquete' }}
          </button>
        </form>

        <footer class="mt-6 text-center text-xs font-medium text-gray-500">
          Copyright by Wagner Freiria
        </footer>
      </section>
    </main>
  `
})
export class HomePageComponent {
  private readonly router = inject(Router);
  readonly supabase = inject(SupabaseService);

  @ViewChildren('itemInput') private readonly itemInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly title = signal('');
  readonly subtitle = signal('');
  readonly allowMultipleAnswers = signal(false);
  readonly items = signal([{ id: crypto.randomUUID(), name: '' }]);
  readonly showInfo = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly canSubmit = computed(() => {
    return this.title().trim().length > 0 && this.cleanItems().length > 0 && this.supabase.hasConfig();
  });

  addItem(): void {
    this.items.update((items) => [...items, { id: crypto.randomUUID(), name: '' }]);
    setTimeout(() => this.itemInputs.last?.nativeElement.focus());
  }

  removeItem(id: string): void {
    this.items.update((items) => items.filter((item) => item.id !== id));
  }

  updateItem(id: string, name: string): void {
    if (name.includes(',')) {
      this.expandItem(id, name);
      return;
    }

    this.items.update((items) => items.map((item) => (item.id === id ? { ...item, name } : item)));
  }

  toggleInfo(): void {
    this.showInfo.update((isVisible) => !isVisible);
  }

  async createPoll(): Promise<void> {
    if (!this.canSubmit()) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const pollId = await this.supabase.createPoll(
        this.title().trim(),
        this.cleanItems(),
        this.cleanSubtitle(),
        this.allowMultipleAnswers()
      );
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

  private cleanSubtitle(): string | null {
    return this.subtitle().trim() || null;
  }

  private expandItem(id: string, value: string): void {
    const hasTrailingComma = value.endsWith(',');
    const names = value
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);

    if (hasTrailingComma) {
      names.push('');
    }

    if (names.length === 0) {
      this.items.update((items) => items.map((item) => (item.id === id ? { ...item, name: '' } : item)));
      return;
    }

    let focusIndex = 0;

    this.items.update((items) => {
      const itemIndex = items.findIndex((item) => item.id === id);

      if (itemIndex < 0) {
        return items;
      }

      const expandedItems = names.map((name) => ({ id: crypto.randomUUID(), name }));
      focusIndex = itemIndex + expandedItems.length - 1;

      return [...items.slice(0, itemIndex), ...expandedItems, ...items.slice(itemIndex + 1)];
    });

    setTimeout(() => this.itemInputs.get(focusIndex)?.nativeElement.focus());
  }
}
