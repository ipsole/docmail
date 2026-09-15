// Provider Factory
// Instantiates the appropriate MailProvider based on system configuration or account metadata

import { MailProvider } from './provider.interface';
import { HostingerMailProvider } from './hostinger.provider';
import { MockMailProvider } from './mock.provider';
import { HOSTINGER_CONFIG } from '@/config/hostinger.config';

let singletonMockProvider: MockMailProvider | null = null;

export class ProviderFactory {
  /**
   * Get provider instance.
   * If a specific provider is requested or configured in environment, use it.
   * Defaults to Hostinger if HOSTINGER_MAIL_API_TOKEN is present, otherwise falls back to Mock.
   */
  static getProvider(
    providerType?: string,
    token?: string,
    baseUrl?: string
  ): MailProvider {
    const defaultMode = process.env.MAIL_PROVIDER_DEFAULT || '';
    const effectiveToken = token || process.env.HOSTINGER_MAIL_API_TOKEN || HOSTINGER_CONFIG.apiToken;
    const hasHostingerToken = !!effectiveToken;

    // In test environment, default to MockMailProvider unless explicitly testing Hostinger
    if (process.env.NODE_ENV === 'test' && providerType !== 'hostinger') {
      if (!singletonMockProvider) {
        singletonMockProvider = new MockMailProvider();
      }
      return singletonMockProvider;
    }

    // Use Hostinger if explicitly configured and token is present, and not forced to mock
    if ((providerType === 'hostinger' || hasHostingerToken) && hasHostingerToken && defaultMode !== 'mock') {
      return new HostingerMailProvider(effectiveToken, baseUrl);
    }

    // Default to mock for offline / dev / tests
    if (!singletonMockProvider) {
      singletonMockProvider = new MockMailProvider();
    }
    return singletonMockProvider;
  }
}
