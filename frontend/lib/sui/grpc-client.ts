import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

// gRPC 服務客戶端介面
export interface SuiGrpcClients {
  ledger: any;
  state: any;
  transaction: any;
  subscription: any;
  movePackage: any;
  signatureVerification: any;
  nameService: any;
}

// gRPC 配置
const GRPC_ENDPOINT = process.env.SUI_GRPC_ENDPOINT || '';
const GRPC_TOKEN = process.env.SUI_GRPC_TOKEN || '';

// Proto 檔案路徑
const PROTO_DIR = path.join(process.cwd(), 'protos', 'proto');

/**
 * 載入 proto 定義
 */
function loadProto(protoFile: string) {
  const protoPath = path.join(PROTO_DIR, protoFile);
  
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [PROTO_DIR],
  });

  return grpc.loadPackageDefinition(packageDefinition);
}

/**
 * 建立 gRPC metadata（用於認證）
 */
function createMetadata(): grpc.Metadata {
  const metadata = new grpc.Metadata();
  if (GRPC_TOKEN) {
    metadata.add('x-token', GRPC_TOKEN);
  }
  return metadata;
}

/**
 * 建立 gRPC 客戶端
 */
function createClient(ServiceConstructor: any): any {
  if (!GRPC_ENDPOINT) {
    console.warn('SUI_GRPC_ENDPOINT not configured, gRPC client not available');
    return null;
  }

  const credentials = grpc.credentials.createSsl();
  return new ServiceConstructor(GRPC_ENDPOINT, credentials);
}

/**
 * 初始化所有 Sui gRPC 服務客戶端
 */
export function initializeSuiGrpcClients(): SuiGrpcClients | null {
  if (!GRPC_ENDPOINT) {
    console.warn('gRPC endpoint not configured. Please set SUI_GRPC_ENDPOINT in .env');
    return null;
  }

  try {
    // 載入各個服務的 proto 定義
    const ledgerProto = loadProto('sui/rpc/v2/ledger_service.proto');
    const stateProto = loadProto('sui/rpc/v2/state_service.proto');
    const transactionProto = loadProto('sui/rpc/v2/transaction_execution_service.proto');
    const subscriptionProto = loadProto('sui/rpc/v2/subscription_service.proto');
    const movePackageProto = loadProto('sui/rpc/v2/move_package_service.proto');
    const signatureProto = loadProto('sui/rpc/v2/signature_verification_service.proto');
    const nameServiceProto = loadProto('sui/rpc/v2/name_service.proto');

    // 建立各個服務的客戶端
    const clients: SuiGrpcClients = {
      ledger: createClient((ledgerProto as any).sui.rpc.v2.LedgerService),
      state: createClient((stateProto as any).sui.rpc.v2.StateService),
      transaction: createClient((transactionProto as any).sui.rpc.v2.TransactionExecutionService),
      subscription: createClient((subscriptionProto as any).sui.rpc.v2.SubscriptionService),
      movePackage: createClient((movePackageProto as any).sui.rpc.v2.MovePackageService),
      signatureVerification: createClient((signatureProto as any).sui.rpc.v2.SignatureVerificationService),
      nameService: createClient((nameServiceProto as any).sui.rpc.v2.NameService),
    };

    return clients;
  } catch (error) {
    console.error('Failed to initialize gRPC clients:', error);
    return null;
  }
}

// 單例模式：全域 gRPC 客戶端實例
let grpcClientsInstance: SuiGrpcClients | null = null;

/**
 * 取得全域 gRPC 客戶端實例
 */
export function getSuiGrpcClients(): SuiGrpcClients | null {
  if (!grpcClientsInstance) {
    grpcClientsInstance = initializeSuiGrpcClients();
  }
  return grpcClientsInstance;
}

/**
 * 包裝 gRPC 呼叫，自動加入 metadata
 */
export function callGrpcMethod<T>(
  client: any,
  methodName: string,
  request: any
): Promise<T> {
  return new Promise((resolve, reject) => {
    const metadata = createMetadata();
    
    client[methodName](request, metadata, (error: grpc.ServiceError | null, response: T) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * 包裝 gRPC 串流呼叫
 */
export function callGrpcStream<T>(
  client: any,
  methodName: string,
  request: any,
  onData: (data: T) => void,
  onError?: (error: Error) => void,
  onEnd?: () => void
): grpc.ClientReadableStream<T> {
  const metadata = createMetadata();
  const stream = client[methodName](request, metadata);

  stream.on('data', onData);
  if (onError) stream.on('error', onError);
  if (onEnd) stream.on('end', onEnd);

  return stream;
}

export default {
  getSuiGrpcClients,
  callGrpcMethod,
  callGrpcStream,
};
