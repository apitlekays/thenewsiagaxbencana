"use client";

import createClient from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Subscriber {
  id: string;
  callback: () => void;
  table: string;
}

class SubscriptionManager {
  private _supabase: ReturnType<typeof createClient> | null = null;
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscribers: Map<string, Set<Subscriber>> = new Map();

  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClient();
    }
    return this._supabase;
  }

  constructor() {
    // Ensure we only create one instance
    if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>).__thenewsiagaxbencana_subscriptionManager) {
      return (globalThis as Record<string, unknown>).__thenewsiagaxbencana_subscriptionManager as SubscriptionManager;
    }
    
    if (typeof globalThis !== 'undefined') {
      (globalThis as Record<string, unknown>).__thenewsiagaxbencana_subscriptionManager = this;
    }
  }

  /**
   * Subscribe to table changes with a callback
   */
  subscribe(table: string, callback: () => void, subscriberId?: string): () => void {
    const id = subscriberId || `${table}-${Math.random().toString(36).substr(2, 9)}`;
    
    const subscriber: Subscriber = {
      id,
      callback,
      table,
    };

    // Subscribe to the table if not already subscribed
    if (!this.subscribers.has(table)) {
      this.subscribers.set(table, new Set());
      
      // Create and subscribe to realtime channel
      const channel = this.supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          () => {
            // Notify all subscribers for this table
            const tableSubscribers = this.subscribers.get(table);
            if (tableSubscribers) {
              tableSubscribers.forEach(sub => {
                try {
                  sub.callback();
                } catch (error) {
                  console.error(`Error in subscriber ${sub.id} for table ${table}:`, error);
                }
              });
            }
          }
        )
        .subscribe();

      this.channels.set(table, channel);
    }

    // Add subscriber
    this.subscribers.get(table)!.add(subscriber);

    // Return unsubscribe function
    return () => {
      const tableSubscribers = this.subscribers.get(table);
      if (tableSubscribers) {
        tableSubscribers.delete(subscriber);
        
        // If no more subscribers, clean up channel
        if (tableSubscribers.size === 0) {
          const channel = this.channels.get(table);
          if (channel) {
            this.supabase.removeChannel(channel);
            this.channels.delete(table);
          }
          this.subscribers.delete(table);
        }
      }
    };
  }

  /**
   * Subscribe to vessels table changes
   */
  subscribeToVessels(callback: () => void, subscriberId?: string): () => void {
    return this.subscribe('vessels', callback, subscriberId);
  }

  /**
   * Subscribe to vessel_positions table changes
   */
  subscribeToVesselPositions(callback: () => void, subscriberId?: string): () => void {
    return this.subscribe('vessel_positions', callback, subscriberId);
  }

  /**
   * Subscribe to timeline_frames table changes
   */
  subscribeToTimelineFrames(callback: () => void, subscriberId?: string): () => void {
    return this.subscribe('timeline_frames', callback, subscriberId);
  }

  /**
   * Get subscription stats for debugging
   */
  getStats() {
    const stats: Record<string, { subscribers: number; channel: boolean }> = {};
    
    for (const [table, subscribers] of this.subscribers) {
      const hasChannel = this.channels.has(table);
      stats[table] = {
        subscribers: subscribers.size,
        channel: hasChannel,
      };
    }
    
    return stats;
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    for (const channel of this.channels.values()) {
      this.supabase.removeChannel(channel);
    }
    this.channels.clear();
    this.subscribers.clear();
  }
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager();

// Export the class for type safety
export type { Subscriber };
export default SubscriptionManager;
