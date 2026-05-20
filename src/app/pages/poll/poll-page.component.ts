import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Poll, PollItem, SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-poll-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="flex min-h-screen flex-col bg-[#f5f5f7] px-4 py-5 text-gray-950">
      <section class="mx-auto w-full max-w-md flex-1">
        <a class="mb-4 inline-flex min-h-9 items-center gap-1 rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-800 transition active:scale-[0.98] active:bg-gray-200" routerLink="/">
          <svg class="h-4 w-4 text-[#007aff]" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Criar outra
        </a>

        @if (loading()) {
          <div class="rounded-lg border border-gray-200/80 bg-white p-5 text-center text-sm font-semibold text-gray-600 shadow-sm shadow-gray-200/50">Carregando...</div>
        } @else if (error()) {
          <div class="rounded-lg border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/50">
            <h1 class="text-xl font-semibold text-gray-950">Não foi possível abrir a enquete</h1>
            <p class="mt-2 text-sm text-gray-600">{{ error() }}</p>
          </div>
        } @else if (poll()) {
          <header class="mb-3 rounded-lg border border-gray-200/80 bg-white p-4 shadow-sm shadow-gray-200/50">
            <p class="text-sm font-semibold text-gray-500">O que você vai levar?</p>
            <h1 class="mt-1 text-[1.9rem] font-semibold leading-tight tracking-normal text-gray-950">{{ poll()?.title }}</h1>
            @if (poll()?.subtitle) {
              <p class="mt-2 text-base font-medium leading-relaxed text-gray-600">{{ poll()?.subtitle }}</p>
            }

            <div class="mt-5 flex items-center gap-2">
              <button
                class="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-950 transition active:scale-[0.98] active:bg-gray-200"
                type="button"
                (click)="sharePoll()"
              >
                <svg class="h-4 w-4 text-[#007aff]" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                  <path d="M12 16V4" />
                  <path d="M7 9l5-5 5 5" />
                </svg>
                Enquete
              </button>
              <button
                class="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-950 transition active:scale-[0.98] active:bg-gray-200"
                type="button"
                (click)="shareResults()"
              >
                <svg class="h-4 w-4 text-[#007aff]" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19V5" />
                  <path d="M8 17V9" />
                  <path d="M12 17V7" />
                  <path d="M16 17v-5" />
                  <path d="M20 19H4" />
                </svg>
                Resultado
              </button>
            </div>
          </header>

          <section class="rounded-lg border border-gray-200/80 bg-white p-4 shadow-sm shadow-gray-200/50">
            @if (alreadyVoted()) {
              <div class="rounded-lg bg-[#007aff]/10 px-4 py-3 text-sm font-semibold text-[#0062cc]">
                Você já confirmou sua participação nesta enquete.
              </div>
            } @else {
              <form (ngSubmit)="vote()">
                <div class="space-y-2.5">
                  @for (item of items(); track item.id) {
                    <label
                      class="flex min-h-[3.25rem] items-center gap-3 rounded-lg border border-transparent bg-gray-100 px-4 py-3 transition has-[:checked]:border-[#007aff] has-[:checked]:bg-[#007aff]/10"
                    >
                      <input
                        class="h-5 w-5 accent-[#007aff]"
                        type="radio"
                        name="poll-item"
                        [value]="item.id"
                        [ngModel]="selectedItemId()"
                        (ngModelChange)="selectedItemId.set($event)"
                      />
                      <span class="text-base font-semibold text-gray-900">{{ item.name }}</span>
                    </label>
                  }
                </div>

                <label class="mt-5 block">
                  <span class="text-sm font-semibold text-gray-700">Seu nome</span>
                  <input
                    class="mt-2 w-full rounded-lg border border-transparent bg-gray-100 px-4 py-3 text-base outline-none transition placeholder:text-gray-400 focus:border-[#007aff] focus:bg-white focus:ring-4 focus:ring-[#007aff]/10"
                    name="person-name"
                    type="text"
                    autocomplete="name"
                    placeholder="João"
                    [ngModel]="personName()"
                    (ngModelChange)="personName.set($event)"
                  />
                </label>

                @if (voteError()) {
                  <p class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{{ voteError() }}</p>
                }

                <button
                  class="mt-5 flex min-h-12 w-full items-center justify-center rounded-lg bg-[#007aff] px-5 py-3 text-base font-semibold text-white shadow-sm shadow-[#007aff]/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                  type="submit"
                  [disabled]="!canVote() || saving()"
                >
                  {{ saving() ? 'Confirmando...' : 'Confirmar' }}
                </button>
              </form>
            }
          </section>

          <section class="mt-3 rounded-lg border border-gray-200/80 bg-white p-4 shadow-sm shadow-gray-200/50">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h2 class="text-xl font-semibold text-gray-950">Resultado</h2>
                <p class="text-sm font-medium text-gray-500">{{ totalVotes() }} confirmações</p>
              </div>
              <button class="inline-flex min-h-9 items-center rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-800 transition active:scale-[0.98] active:bg-gray-200" type="button" (click)="refreshAnswers()">Atualizar</button>
            </div>

            <div class="space-y-2.5">
              @for (group of sortedResults(); track group.item.id) {
                <div class="rounded-lg bg-gray-100 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <h3 class="font-semibold text-gray-950">{{ group.item.name }}</h3>
                    <span class="min-w-8 rounded-full bg-white px-2.5 py-1 text-center text-sm font-semibold text-gray-800">{{ group.names.length }}</span>
                  </div>

                  @if (group.names.length > 0) {
                    <ul class="mt-3 space-y-1.5">
                      @for (name of group.names; track name + $index) {
                        <li class="text-sm font-medium text-gray-600">{{ name }}</li>
                      }
                    </ul>
                  } @else {
                    <p class="mt-3 text-sm text-gray-500">Ninguém ainda</p>
                  }
                </div>
              }
            </div>
          </section>
        }
      </section>

      <footer class="mx-auto mt-6 w-full max-w-md text-center text-xs font-medium text-gray-500">
        Copyright by Wagner Freiria
      </footer>

      @if (actionMessage()) {
        <div class="share-snackbar fixed inset-x-4 bottom-5 z-50 mx-auto max-w-md rounded-lg bg-gray-950 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
          {{ actionMessage() }}
        </div>
      }
    </main>
  `,
  styles: [
    `
      .share-snackbar {
        animation: share-snackbar-in 180ms ease-out;
      }

      @keyframes share-snackbar-in {
        from {
          opacity: 0;
          transform: translateY(12px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `
  ]
})
export class PollPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly supabase = inject(SupabaseService);
  private unsubscribe: (() => void) | undefined;
  private actionMessageTimeout: ReturnType<typeof setTimeout> | undefined;

  readonly poll = signal<Poll | null>(null);
  readonly items = signal<PollItem[]>([]);
  readonly selectedItemId = signal('');
  readonly personName = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly voteError = signal('');
  readonly actionMessage = signal('');
  readonly alreadyVoted = signal(false);

  readonly results = computed(() => this.supabase.buildResults(this.items(), this.supabase.answers()));
  readonly sortedResults = computed(() => {
    return this.results()
      .map((group, index) => ({ group, index }))
      .sort((first, second) => {
        const voteDifference = second.group.names.length - first.group.names.length;
        return voteDifference || first.index - second.index;
      })
      .map(({ group }) => group);
  });
  readonly totalVotes = computed(() => this.sortedResults().reduce((total, group) => total + group.names.length, 0));
  readonly canVote = computed(() => {
    return this.selectedItemId().length > 0 && this.personName().trim().length > 0 && !this.alreadyVoted();
  });

  async ngOnInit(): Promise<void> {
    await this.loadPoll();
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
    clearTimeout(this.actionMessageTimeout);
  }

  async vote(): Promise<void> {
    const pollId = this.poll()?.id;

    if (!pollId || !this.canVote()) {
      return;
    }

    this.saving.set(true);
    this.voteError.set('');

    try {
      await this.supabase.saveVote(pollId, this.selectedItemId(), this.personName().trim());
      localStorage.setItem(this.votedKey(pollId), 'true');
      this.alreadyVoted.set(true);
    } catch (error) {
      this.voteError.set(error instanceof Error ? error.message : 'Não foi possível confirmar.');
    } finally {
      this.saving.set(false);
    }
  }

  async refreshAnswers(): Promise<void> {
    const pollId = this.poll()?.id;

    if (pollId) {
      await this.supabase.listAnswers(pollId);
    }
  }

  async sharePoll(): Promise<void> {
    const url = window.location.href;
    const text = `${this.shareText()}\n${url}`;
    let copied = false;

    this.clearActionMessage();

    try {
      await this.copyText(url);
      copied = true;
    } catch {
      copied = false;
    }

    this.openWhatsApp(text);
    this.showActionMessage(copied ? 'Link copiado' : 'WhatsApp aberto');
  }

  async shareResults(): Promise<void> {
    const summary = this.resultsSummary();
    let copied = false;

    this.clearActionMessage();

    try {
      await this.copyText(summary);
      copied = true;
    } catch {
      copied = false;
    }

    this.openWhatsApp(summary);
    this.showActionMessage(copied ? 'Resumo copiado' : 'WhatsApp aberto');
  }

  private async loadPoll(): Promise<void> {
    const pollId = this.route.snapshot.paramMap.get('id');

    if (!pollId) {
      this.error.set('Link inválido.');
      this.loading.set(false);
      return;
    }

    try {
      const details = await this.supabase.getPoll(pollId);
      this.poll.set(details.poll);
      this.items.set(details.items);
      this.alreadyVoted.set(localStorage.getItem(this.votedKey(pollId)) === 'true');
      this.unsubscribe = this.supabase.subscribeToAnswers(pollId, () => {
        void this.refreshAnswers();
      });
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Enquete não encontrada.');
    } finally {
      this.loading.set(false);
    }
  }

  private votedKey(pollId: string): string {
    return `poll_voted_${pollId}`;
  }

  private async copyText(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  private shareText(): string {
    const poll = this.poll();

    if (!poll) {
      return 'Oi! Confirme aqui o que você vai levar.';
    }

    return [`Oi! Confirme aqui o que você vai levar: ${poll.title}`, poll.subtitle].filter(Boolean).join('\n');
  }

  private openWhatsApp(text: string): void {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  private showActionMessage(message: string): void {
    clearTimeout(this.actionMessageTimeout);
    this.actionMessage.set(message);
    this.actionMessageTimeout = setTimeout(() => this.actionMessage.set(''), 2200);
  }

  private clearActionMessage(): void {
    clearTimeout(this.actionMessageTimeout);
    this.actionMessage.set('');
  }

  private resultsSummary(): string {
    const poll = this.poll();
    const lines = [
      poll?.title ?? 'Enquete',
      ...(poll?.subtitle ? [poll.subtitle] : []),
      '',
      `${this.totalVotes()} confirmações`,
      '',
      ...this.sortedResults().flatMap((group) => [
        `${group.item.name} (${group.names.length})`,
        ...(group.names.length ? group.names.map((name) => `- ${name}`) : ['- Ninguém ainda']),
        ''
      ])
    ];

    return lines.join('\n').trim();
  }

}
