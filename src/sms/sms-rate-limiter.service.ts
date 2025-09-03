// src/sms/sms-rate-limiter.service.ts
import { Injectable, Logger } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class SmsRateLimiterService {
  private readonly logger = new Logger(SmsRateLimiterService.name);
  private readonly rateLimits: Map<string, RateLimitEntry> = new Map();

  // Simple rate limits: 10 SMS per hour per phone number
  private readonly maxRequests = 10;
  private readonly windowMs = 60 * 60 * 1000; // 1 hour

  checkRateLimit(phoneNumber: string): void {
    const now = Date.now();
    const key = `phone:${phoneNumber}`;

    // Clean up expired entries
    this.cleanupExpiredEntries();

    const entry = this.rateLimits.get(key);

    if (!entry) {
      // First request from this phone
      this.rateLimits.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return;
    }

    if (now > entry.resetTime) {
      // Reset window has passed
      this.rateLimits.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return;
    }

    // Check if limit exceeded
    if (entry.count >= this.maxRequests) {
      const resetInMinutes = Math.ceil((entry.resetTime - now) / (60 * 1000));
      this.logger.warn(`Rate limit exceeded for phone: ${phoneNumber}. Reset in ${resetInMinutes} minutes`);
      throw new Error(`Rate limit exceeded. Try again in ${resetInMinutes} minutes.`);
    }

    // Increment counter
    entry.count++;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.rateLimits.entries()) {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.rateLimits.delete(key));
  }

  getRemainingRequests(phoneNumber: string): number {
    const key = `phone:${phoneNumber}`;
    const entry = this.rateLimits.get(key);

    if (!entry) {
      return this.maxRequests;
    }

    const now = Date.now();
    if (now > entry.resetTime) {
      return this.maxRequests;
    }

    return Math.max(0, this.maxRequests - entry.count);
  }
}
