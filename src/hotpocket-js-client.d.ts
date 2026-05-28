declare global {
  interface Window {
    HotPocket?: {
      generateKeys: () => Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }>;
      createClient: (
        servers: string[],
        keyPair: { publicKey: Uint8Array; privateKey: Uint8Array },
        options?: { protocol?: string }
      ) => Promise<{
        connect: () => Promise<boolean>;
        close: () => Promise<void>;
        submitContractReadRequest: (payload: Uint8Array) => Promise<Uint8Array>;
        submitContractInput: (payload: Uint8Array) => Promise<{ submissionStatus: Promise<{ status: string; reason?: string }> }>;
        on: (event: string, handler: (result: { outputs: Uint8Array[] }) => void) => void;
      }>;
      events: {
        disconnect: string;
        connectionChange: string;
        contractOutput: string;
        healthEvent: string;
      };
      protocols?: { bson?: string; json?: string };
    };
  }
}

export {};
