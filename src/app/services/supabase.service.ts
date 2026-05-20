import { Injectable, computed, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Poll {
  id: string;
  title: string;
  subtitle: string | null;
  allow_multiple_answers: boolean;
  created_at: string;
}

export interface PollItem {
  id: string;
  poll_id: string;
  name: string;
  created_at: string;
}

export interface PollAnswer {
  id: string;
  poll_id: string;
  poll_item_id: string;
  person_name: string;
  created_at: string;
}

export interface PollDetails {
  poll: Poll;
  items: PollItem[];
  answers: PollAnswer[];
}

export interface ResultGroup {
  item: PollItem;
  names: string[];
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient | undefined;
  private readonly currentAnswers = signal<PollAnswer[]>([]);

  readonly answers = this.currentAnswers.asReadonly();
  readonly hasConfig = computed(() => {
    return (
      environment.supabaseUrl !== 'YOUR_SUPABASE_URL' &&
      environment.supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
    );
  });

  async createPoll(
    title: string,
    itemNames: string[],
    subtitle: string | null = null,
    allowMultipleAnswers = false
  ): Promise<string> {
    const client = this.getClient();

    const { data: poll, error: pollError } = await client
      .from('polls')
      .insert({ title, subtitle, allow_multiple_answers: allowMultipleAnswers })
      .select('id')
      .single();

    if (pollError) {
      throw pollError;
    }

    const items = itemNames.map((name) => ({
      poll_id: poll.id,
      name
    }));

    const { error: itemError } = await client.from('poll_items').insert(items);

    if (itemError) {
      throw itemError;
    }

    return poll.id;
  }

  async getPoll(id: string): Promise<PollDetails> {
    const client = this.getClient();

    const { data: poll, error: pollError } = await client
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();

    if (pollError) {
      throw pollError;
    }

    const { data: items, error: itemsError } = await client
      .from('poll_items')
      .select('*')
      .eq('poll_id', id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      throw itemsError;
    }

    const answers = await this.listAnswers(id);

    return {
      poll,
      items: items ?? [],
      answers
    };
  }

  async listAnswers(pollId: string): Promise<PollAnswer[]> {
    const client = this.getClient();

    const { data, error } = await client
      .from('poll_answers')
      .select('*')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    const answers = data ?? [];
    this.currentAnswers.set(answers);
    return answers;
  }

  async saveVote(pollId: string, itemId: string, personName: string): Promise<void> {
    await this.saveVotes(pollId, [itemId], personName);
  }

  async saveVotes(pollId: string, itemIds: string[], personName: string): Promise<void> {
    const client = this.getClient();

    const answers = itemIds.map((itemId) => ({
      poll_id: pollId,
      poll_item_id: itemId,
      person_name: personName
    }));

    const { error } = await client.from('poll_answers').insert(answers);

    if (error) {
      throw error;
    }

    await this.listAnswers(pollId);
  }

  subscribeToAnswers(pollId: string, onChange: () => void): () => void {
    if (!this.hasConfig()) {
      return () => undefined;
    }

    const client = this.getClient();
    const channel = client
      .channel(`poll_answers_${pollId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_answers',
          filter: `poll_id=eq.${pollId}`
        },
        onChange
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }

  buildResults(items: PollItem[], answers: PollAnswer[]): ResultGroup[] {
    return items.map((item) => ({
      item,
      names: answers
        .filter((answer) => answer.poll_item_id === item.id)
        .map((answer) => answer.person_name)
    }));
  }

  private ensureConfig(): void {
    if (!this.hasConfig()) {
      throw new Error('Configure SUPABASE_URL e SUPABASE_ANON_KEY antes de usar o app.');
    }
  }

  private getClient(): SupabaseClient {
    this.ensureConfig();
    this.client ??= createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    return this.client;
  }
}
