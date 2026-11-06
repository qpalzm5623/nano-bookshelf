// ==============================================================
// 나노의책장 - Cloudflare R2 (S3 호환) 순수 Node.js 스토리지 클라이언트
// ==============================================================
// 외부 무거운 SDK 의존성 없이 Node 내장 crypto만으로 AWS Signature V4를 구현하여
// Vercel 빌드 호환성 이슈(allowScripts 등)를 원천 차단하고 초경량으로 동작합니다.
// ==============================================================

import { createHash, createHmac } from 'node:crypto';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
  endpointHost: string;
}

function rfc3986Encode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) =>
    '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

export function encodeObjectKey(objectKey: string): string {
  return objectKey
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map(rfc3986Encode)
    .join('/');
}

function sha256Hex(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

function getSigningKey(secretAccessKey: string, dateStamp: string, region = 'auto', service = 's3'): Buffer {
  const kDate = hmac('AWS4' + secretAccessKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

function formatAmzDate(now = new Date()): { amzDate: string; dateStamp: string } {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

function decodeXmlEntities(val: string): string {
  return val
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// R2 필수 환경변수가 모두 세팅되었는지 확인
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
    process.env.R2_ACCESS_KEY_ID?.trim() &&
    process.env.R2_SECRET_ACCESS_KEY?.trim() &&
    process.env.R2_PUBLIC_BASE_URL?.trim()
  );
}

export function getR2Config(): R2Config {
  const accountId = (process.env.R2_ACCOUNT_ID || '').trim();
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim();
  const bucketName = (process.env.R2_BUCKET_NAME || 'nano-bookshelf').trim();
  const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');

  if (!accountId || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    throw new Error(
      'Cloudflare R2 환경변수(R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BASE_URL)가 설정되지 않았습니다.'
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl,
    endpointHost: `${accountId}.r2.cloudflarestorage.com`,
  };
}

// 공개 열람용 CDN URL 생성 (예: https://pub-xxx.r2.dev/upload/book/9791187079521.pdf)
export function buildPublicMediaUrl(objectKey: string, cfg = getR2Config()): string {
  return `${cfg.publicBaseUrl}/${encodeObjectKey(objectKey)}`;
}

// 브라우저가 대용량 PDF(15MB 등)도 Vercel 4.5MB 제한 없이 R2로 직접 올릴 수 있는 서명된 PUT URL 발급
export function createR2PresignedPutUrl(
  objectKey: string,
  expiresSeconds = 900,
  cfg = getR2Config()
): { uploadUrl: string; publicUrl: string; objectKey: string } {
  const cleanKey = objectKey.replace(/^\/+/, '');
  const encodedBucket = rfc3986Encode(cfg.bucketName);
  const encodedKey = encodeObjectKey(cleanKey);
  const canonicalUri = `/${encodedBucket}/${encodedKey}`;

  const { amzDate, dateStamp } = formatAmzDate();
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;

  const queryEntries: Array<[string, string]> = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', `${cfg.accessKeyId}/${credentialScope}`],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(expiresSeconds)],
    ['X-Amz-SignedHeaders', 'host'],
  ];
  queryEntries.sort((a, b) => a[0].localeCompare(b[0]));

  const canonicalQuery = queryEntries
    .map(([k, v]) => `${rfc3986Encode(k)}=${rfc3986Encode(v)}`)
    .join('&');

  const canonicalHeaders = `host:${cfg.endpointHost}\n`;
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(cfg.secretAccessKey, dateStamp);
  const signature = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');

  const uploadUrl = `https://${cfg.endpointHost}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  return {
    uploadUrl,
    publicUrl: buildPublicMediaUrl(cleanKey, cfg),
    objectKey: cleanKey,
  };
}

// 서버에서 직접 R2로 파일 업로드 (배치 마이그레이션 스크립트 및 소용량 서버 프록시 업로드용)
export async function putR2Object(
  objectKey: string,
  body: Buffer,
  contentType: string,
  cacheControl = 'public, max-age=31536000, immutable',
  cfg = getR2Config()
): Promise<{ publicUrl: string; objectKey: string }> {
  const cleanKey = objectKey.replace(/^\/+/, '');
  const canonicalUri = `/${rfc3986Encode(cfg.bucketName)}/${encodeObjectKey(cleanKey)}`;
  const { amzDate, dateStamp } = formatAmzDate();
  const payloadHash = sha256Hex(body);
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;

  const headerPairs: Array<[string, string]> = [
    ['cache-control', cacheControl],
    ['content-type', contentType],
    ['host', cfg.endpointHost],
    ['x-amz-content-sha256', payloadHash],
    ['x-amz-date', amzDate],
  ];
  headerPairs.sort((a, b) => a[0].localeCompare(b[0]));

  const canonicalHeaders = headerPairs.map(([k, v]) => `${k}:${v}\n`).join('');
  const signedHeaders = headerPairs.map(([k]) => k).join(';');

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(cfg.secretAccessKey, dateStamp);
  const signature = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${cfg.endpointHost}${canonicalUri}`, {
    method: 'PUT',
    headers: {
      'Cache-Control': cacheControl,
      'Content-Type': contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      Authorization: authorization,
    },
    body: new Uint8Array(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`R2 업로드 실패 (${res.status}): ${errText.slice(0, 300)}`);
  }

  return {
    publicUrl: buildPublicMediaUrl(cleanKey, cfg),
    objectKey: cleanKey,
  };
}

// 버킷 내 이미 업로드된 파일 목록 및 용량 조회 (일괄 동기화 시 이미 올라간 파일 고속 스킵용)
export async function listR2Objects(prefix = 'upload/book/', cfg = getR2Config()): Promise<Map<string, number>> {
  const existing = new Map<string, number>();
  let continuationToken: string | null = null;
  const canonicalUri = `/${rfc3986Encode(cfg.bucketName)}`;
  const emptyHash = sha256Hex('');

  do {
    const { amzDate, dateStamp } = formatAmzDate();
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;

    const queryPairs: Array<[string, string]> = [
      ['list-type', '2'],
      ['max-keys', '1000'],
      ['prefix', prefix],
    ];
    if (continuationToken) {
      queryPairs.push(['continuation-token', continuationToken]);
    }
    queryPairs.sort((a, b) => a[0].localeCompare(b[0]));

    const canonicalQuery = queryPairs
      .map(([k, v]) => `${rfc3986Encode(k)}=${rfc3986Encode(v)}`)
      .join('&');

    const canonicalHeaders = `host:${cfg.endpointHost}\nx-amz-content-sha256:${emptyHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = [
      'GET',
      canonicalUri,
      canonicalQuery,
      canonicalHeaders,
      signedHeaders,
      emptyHash,
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join('\n');

    const signingKey = getSigningKey(cfg.secretAccessKey, dateStamp);
    const signature = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');
    const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const res = await fetch(`https://${cfg.endpointHost}${canonicalUri}?${canonicalQuery}`, {
      method: 'GET',
      headers: {
        'x-amz-content-sha256': emptyHash,
        'x-amz-date': amzDate,
        Authorization: authorization,
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`R2 목록 조회 실패 (${res.status}): ${errText.slice(0, 300)}`);
    }

    const xml = await res.text();
    const contentRegex = /<Contents>([\s\S]*?)<\/Contents>/g;
    let match: RegExpExecArray | null;
    while ((match = contentRegex.exec(xml)) !== null) {
      const block = match[1];
      const keyMatch = block.match(/<Key>([\s\S]*?)<\/Key>/);
      const sizeMatch = block.match(/<Size>(\d+)<\/Size>/);
      if (keyMatch) {
        existing.set(decodeXmlEntities(keyMatch[1]), sizeMatch ? Number(sizeMatch[1]) : 0);
      }
    }

    const isTruncated = /<IsTruncated>true<\/IsTruncated>/i.test(xml);
    const tokenMatch = xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/);
    continuationToken = isTruncated && tokenMatch ? decodeXmlEntities(tokenMatch[1]) : null;
  } while (continuationToken);

  return existing;
}

// PDF.js 워터마크 뷰어 열람 및 브라우저 직접 업로드를 위한 R2 버킷 CORS 자동 설정
export async function configureR2BucketCors(allowedOrigins = ['*'], cfg = getR2Config()): Promise<void> {
  const originsXml = allowedOrigins.map((o) => `<AllowedOrigin>${o}</AllowedOrigin>`).join('');
  const corsXml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">` +
    `<CORSRule>` +
    originsXml +
    `<AllowedMethod>GET</AllowedMethod>` +
    `<AllowedMethod>HEAD</AllowedMethod>` +
    `<AllowedMethod>PUT</AllowedMethod>` +
    `<AllowedHeader>*</AllowedHeader>` +
    `<ExposeHeader>ETag</ExposeHeader>` +
    `<ExposeHeader>Content-Length</ExposeHeader>` +
    `<MaxAgeSeconds>86400</MaxAgeSeconds>` +
    `</CORSRule>` +
    `</CORSConfiguration>`;

  const bodyBuf = Buffer.from(corsXml, 'utf8');
  const contentMd5 = createHash('md5').update(bodyBuf).digest('base64');
  const payloadHash = sha256Hex(bodyBuf);
  const canonicalUri = `/${rfc3986Encode(cfg.bucketName)}`;
  const canonicalQuery = 'cors=';
  const { amzDate, dateStamp } = formatAmzDate();
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;

  const canonicalHeaders =
    `content-md5:${contentMd5}\n` +
    `content-type:application/xml\n` +
    `host:${cfg.endpointHost}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-md5;content-type;host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(cfg.secretAccessKey, dateStamp);
  const signature = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${cfg.endpointHost}${canonicalUri}?cors`, {
    method: 'PUT',
    headers: {
      'Content-MD5': contentMd5,
      'Content-Type': 'application/xml',
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      Authorization: authorization,
    },
    body: new Uint8Array(bodyBuf),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`R2 CORS 자동 설정 실패 (${res.status}): ${errText.slice(0, 300)}`);
  }
}

