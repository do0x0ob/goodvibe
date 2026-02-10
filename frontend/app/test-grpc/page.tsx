'use client';

import { useEffect, useState } from 'react';
import { getSuiClient, isGrpcEnabled } from '@/lib/sui/client';

export default function TestGrpcPage() {
  const [status, setStatus] = useState<string>('Testing...');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testGrpcConnection();
  }, []);

  async function testGrpcConnection() {
    const logs: any[] = [];
    
    try {
      // 檢查 gRPC 是否啟用
      const grpcEnabled = isGrpcEnabled();
      logs.push({
        title: 'gRPC Status',
        content: grpcEnabled ? '✅ Enabled' : '❌ Disabled',
        status: grpcEnabled ? 'success' : 'warning',
      });

      // 取得客戶端
      const client = getSuiClient();
      logs.push({
        title: 'Client Type',
        content: grpcEnabled ? 'gRPC-Web (Surflux)' : 'HTTP JSON-RPC',
        status: 'info',
      });

      setResults([...logs]);
      setStatus('Connected');

      // 測試簡單的查詢
      try {
        // 嘗試查詢一個已知的 object (Gas object)
        const objectResult = await client.getObject({
          id: '0x6',
          options: {
            showContent: true,
          },
        });

        logs.push({
          title: 'Object Query Test',
          content: `✅ Success - Object ID: ${objectResult.data?.objectId || 'N/A'}`,
          status: 'success',
          details: JSON.stringify(objectResult, null, 2).slice(0, 500),
        });
      } catch (objError: any) {
        logs.push({
          title: 'Object Query Test',
          content: `⚠️ Failed: ${objError.message}`,
          status: 'warning',
          details: objError.stack,
        });
      }

      setResults([...logs]);

    } catch (err: any) {
      console.error('Test error:', err);
      setError(err.message);
      setStatus('Error');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Surflux gRPC 連線測試</h1>
        
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">狀態:</span>
            <span className={`text-lg ${
              status === 'Connected' ? 'text-green-600' :
              status === 'Error' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {status}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-bold text-red-800 mb-2">錯誤</h3>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg shadow ${
                result.status === 'success' ? 'bg-green-50 border border-green-200' :
                result.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                result.status === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}
            >
              <h3 className={`font-bold mb-2 ${
                result.status === 'success' ? 'text-green-800' :
                result.status === 'warning' ? 'text-yellow-800' :
                result.status === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {result.title}
              </h3>
              <p className={`text-sm ${
                result.status === 'success' ? 'text-green-700' :
                result.status === 'warning' ? 'text-yellow-700' :
                result.status === 'error' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                {result.content}
              </p>
              {result.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                    詳細資訊
                  </summary>
                  <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
                    {result.details}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h3 className="font-bold mb-2">環境變數設定</h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-mono text-gray-600">NEXT_PUBLIC_SUI_GRPC_ENDPOINT:</span>{' '}
              <span className={process.env.NEXT_PUBLIC_SUI_GRPC_ENDPOINT ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_SUI_GRPC_ENDPOINT || '❌ Not set'}
              </span>
            </p>
            <p>
              <span className="font-mono text-gray-600">NEXT_PUBLIC_SUI_GRPC_TOKEN:</span>{' '}
              <span className={process.env.NEXT_PUBLIC_SUI_GRPC_TOKEN ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_SUI_GRPC_TOKEN ? '✅ Set' : '❌ Not set'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
