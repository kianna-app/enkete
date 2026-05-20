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
    <main class="min-h-screen bg-whatsapp-bg px-4 py-5">
      <section class="mx-auto max-w-md">
        <a class="mb-4 inline-flex text-sm font-bold text-whatsapp-dark" routerLink="/">Criar outra enquete</a>

        @if (loading()) {
          <div class="rounded-lg bg-white p-5 text-center font-semibold text-gray-700 shadow-sm">Carregando...</div>
        } @else if (error()) {
          <div class="rounded-lg bg-white p-5 shadow-sm">
            <h1 class="text-xl font-bold text-gray-950">Não foi possível abrir a enquete</h1>
            <p class="mt-2 text-sm text-gray-600">{{ error() }}</p>
          </div>
        } @else if (poll()) {
          <header class="mb-4 rounded-lg bg-white p-5 shadow-sm">
            <p class="text-sm font-semibold text-whatsapp-dark">O que você vai levar?</p>
            <h1 class="mt-2 text-3xl font-bold leading-tight text-gray-950">{{ poll()?.title }}</h1>

            <div class="mt-5 grid grid-cols-2 gap-3">
              <button
                class="rounded-lg bg-whatsapp px-3 py-3 text-sm font-bold text-white shadow-sm transition active:scale-[0.99]"
                type="button"
                (click)="sharePoll()"
              >
                Compartilhar
              </button>
              <button
                class="rounded-lg bg-whatsapp-dark px-3 py-3 text-sm font-bold text-white shadow-sm transition active:scale-[0.99]"
                type="button"
                (click)="shareOnWhatsApp()"
              >
                WhatsApp
              </button>
              <button
                class="rounded-lg bg-white px-3 py-3 text-sm font-bold text-whatsapp-dark ring-1 ring-whatsapp/30 transition active:scale-[0.99]"
                type="button"
                (click)="copyPollLink()"
              >
                Copiar link
              </button>
              <button
                class="rounded-lg bg-white px-3 py-3 text-sm font-bold text-whatsapp-dark ring-1 ring-whatsapp/30 transition active:scale-[0.99]"
                type="button"
                (click)="copyResultsSummary()"
              >
                Copiar resumo
              </button>
              <button
                class="col-span-2 rounded-lg bg-whatsapp-dark px-3 py-3 text-sm font-bold text-white shadow-sm transition active:scale-[0.99]"
                type="button"
                (click)="exportResults()"
              >
                Exportar resultado
              </button>
            </div>

            @if (actionMessage()) {
              <p class="mt-3 rounded-lg bg-whatsapp/15 px-4 py-3 text-sm font-bold text-whatsapp-dark">
                {{ actionMessage() }}
              </p>
            }
          </header>

          <section class="rounded-lg bg-white p-5 shadow-sm">
            @if (alreadyVoted()) {
              <div class="rounded-lg bg-whatsapp/15 px-4 py-3 text-sm font-bold text-whatsapp-dark">
                Você já confirmou sua participação nesta enquete.
              </div>
            } @else {
              <form (ngSubmit)="vote()">
                <div class="space-y-3">
                  @for (item of items(); track item.id) {
                    <label
                      class="flex min-h-14 items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 transition has-[:checked]:border-whatsapp has-[:checked]:bg-whatsapp/10"
                    >
                      <input
                        class="h-5 w-5 accent-whatsapp"
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
                  <span class="text-sm font-semibold text-gray-800">Seu nome</span>
                  <input
                    class="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-whatsapp focus:ring-4 focus:ring-whatsapp/20"
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
                  class="mt-5 w-full rounded-lg bg-whatsapp px-5 py-4 text-lg font-bold text-white shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  [disabled]="!canVote() || saving()"
                >
                  {{ saving() ? 'Confirmando...' : 'Confirmar' }}
                </button>
              </form>
            }
          </section>

          <section class="mt-4 rounded-lg bg-white p-5 shadow-sm">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-950">Resultado</h2>
                <p class="text-sm font-medium text-gray-500">{{ totalVotes() }} confirmações</p>
              </div>
              <button class="text-sm font-bold text-whatsapp-dark" type="button" (click)="refreshAnswers()">Atualizar</button>
            </div>

            <div class="space-y-4">
              @for (group of sortedResults(); track group.item.id) {
                <div class="rounded-lg bg-gray-50 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <h3 class="font-bold text-gray-950">{{ group.item.name }}</h3>
                    <span class="rounded-lg bg-whatsapp/15 px-3 py-1 text-sm font-bold text-whatsapp-dark">{{ group.names.length }}</span>
                  </div>

                  @if (group.names.length > 0) {
                    <ul class="mt-3 space-y-2">
                      @for (name of group.names; track name + $index) {
                        <li class="text-sm font-medium text-gray-700">- {{ name }}</li>
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
    </main>
  `
})
export class PollPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly supabase = inject(SupabaseService);
  private unsubscribe: (() => void) | undefined;

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
    const poll = this.poll();
    const url = window.location.href;

    this.actionMessage.set('');

    try {
      if (navigator.share) {
        await navigator.share({
          title: poll?.title ?? 'Enquete',
          text: this.shareText(),
          url
        });
        return;
      }

      await this.copyText(url);
      this.actionMessage.set('Link copiado.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      this.actionMessage.set('Não foi possível compartilhar. Copie o link pela barra do navegador.');
    }
  }

  async shareOnWhatsApp(): Promise<void> {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${this.shareText()}\n${window.location.href}`)}`, '_blank');
  }

  async copyPollLink(): Promise<void> {
    try {
      await this.copyText(window.location.href);
      this.actionMessage.set('Link copiado.');
    } catch {
      this.actionMessage.set('Não foi possível copiar. Copie o link pela barra do navegador.');
    }
  }

  async copyResultsSummary(): Promise<void> {
    try {
      await this.copyText(this.resultsSummary());
      this.actionMessage.set('Resumo copiado.');
    } catch {
      this.actionMessage.set('Não foi possível copiar o resumo.');
    }
  }

  exportResults(): void {
    const poll = this.poll();

    if (!poll) {
      return;
    }

    const summaryRows = [
      ['Resumo'],
      ['Item', 'Total de votos', 'Nomes'],
      ...this.sortedResults().map((group) => [group.item.name, String(group.names.length), group.names.join(', ')])
    ];
    const voteRows = [
      [''],
      ['Votos realizados'],
      ['Item', 'Nome'],
      ...this.sortedResults().flatMap((group) => group.names.map((name) => [group.item.name, name]))
    ];
    const rows = [...summaryRows, ...voteRows];
    const csv = rows.map((row) => row.map((value) => this.escapeCsvValue(value)).join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = `${this.slugify(poll.title)}-resultados.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    this.actionMessage.set('Resultado exportado.');
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
    const title = this.poll()?.title;
    return title ? `Oi! Confirme aqui o que você vai levar: ${title}` : 'Oi! Confirme aqui o que você vai levar.';
  }

  private resultsSummary(): string {
    const poll = this.poll();
    const lines = [
      poll?.title ?? 'Enquete',
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

  private escapeCsvValue(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  private slugify(value: string): string {
    const slug = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return slug || 'enquete';
  }
}
