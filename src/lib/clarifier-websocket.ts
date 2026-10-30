'use client';

import {
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  HubConnection,
  JsonHubProtocol,
} from '@microsoft/signalr';

export interface ClarifierMessage {
  id: string;
  text: string;
  topic: string;
  timestamp: string;
}

export interface TopicStatus {
  [topic: string]: {
    status: 'pending' | 'unclear' | 'clear';
    baseAnswer?: string;
    followUpAttempts: number;
    followUpText?: string;
    updatedAt: string;
  };
}

export interface MessageCompleteData {
  aiMessage: ClarifierMessage;
  topicStatus: TopicStatus;
  nextTopic: string | null;
  clarityScore: number;
  allTopicsCleared: boolean;
}

type MessageCallback = (chunk: string) => void;
type CompleteCallback = (data: MessageCompleteData) => void;
type ErrorCallback = (error: { message: string; errorCode: string }) => void;

class ClarifierWebSocket {
  private connection: HubConnection | null = null;
  private token: string;
  private baseUrl: string;
  private messageCallback: MessageCallback | null = null;
  private completeCallback: CompleteCallback | null = null;
  private errorCallback: ErrorCallback | null = null;

  constructor(token: string, baseUrl: string = '') {
    this.token = token;
    this.baseUrl = baseUrl || '';
  }

  async connect(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      return;
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/api/clarifier`, {
        accessTokenFactory: () => this.token,
        skipNegotiation: true,
        transport: HttpTransportType.WebSocket | HttpTransportType.LongPolling,
        withCredentials: true,
      })
      .withHubProtocol(new JsonHubProtocol())
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    // Register event handlers
    this.connection.on('ReceiveChunk', (chunk: string) => {
      if (this.messageCallback) {
        this.messageCallback(chunk);
      }
    });

    this.connection.on('MessageComplete', (data: MessageCompleteData) => {
      if (this.completeCallback) {
        this.completeCallback(data);
      }
    });

    this.connection.on('Error', (error: { message: string; errorCode: string }) => {
      if (this.errorCallback) {
        this.errorCallback(error);
      }
    });

    this.connection.onreconnected(async () => {
      console.log('[Clarifier] WebSocket reconnected');
    });

    this.connection.onreconnecting((error) => {
      console.warn('[Clarifier] WebSocket reconnecting:', error);
    });

    try {
      await this.connection.start();
      console.log('[Clarifier] WebSocket connected');
    } catch (err) {
      console.error('[Clarifier] Failed to connect:', err);
      throw err;
    }
  }

  async sendMessage(
    message: string,
    language: string,
    sessionId: string,
    currentTopic: string
  ): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      throw new Error('WebSocket not connected');
    }

    try {
      await this.connection.invoke('SendMessage', message, language, sessionId, currentTopic);
    } catch (err) {
      console.error('[Clarifier] Error sending message:', err);
      throw err;
    }
  }

  async getSessionStatus(sessionId: string): Promise<any> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      throw new Error('WebSocket not connected');
    }

    try {
      return await this.connection.invoke('GetSessionStatus', sessionId);
    } catch (err) {
      console.error('[Clarifier] Error getting session status:', err);
      throw err;
    }
  }

  onMessageChunk(callback: MessageCallback): void {
    this.messageCallback = callback;
  }

  onMessageComplete(callback: CompleteCallback): void {
    this.completeCallback = callback;
  }

  onError(callback: ErrorCallback): void {
    this.errorCallback = callback;
  }

  disconnect(): void {
    if (this.connection) {
      this.connection.stop().catch((err) => {
        console.error('[Clarifier] Error disconnecting:', err);
      });
      this.connection = null;
    }
  }

  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }
}

// Singleton instance
let clarifierWs: ClarifierWebSocket | null = null;

export function initializeClarifierWebSocket(token: string, baseUrl?: string): ClarifierWebSocket {
  if (!clarifierWs) {
    clarifierWs = new ClarifierWebSocket(token, baseUrl);
  }
  return clarifierWs;
}

export function getClarifierWebSocket(): ClarifierWebSocket {
  if (!clarifierWs) {
    throw new Error('ClarifierWebSocket not initialized. Call initializeClarifierWebSocket first.');
  }
  return clarifierWs;
}

export default ClarifierWebSocket;
