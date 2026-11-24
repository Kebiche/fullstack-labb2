import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { createServer } from 'node:http';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { createApp } from '../src/app.js';

const password = 'TestPassword123!';
const users = {
  doctor: { id: 1, username: 'doctor', role: 'DOCTOR' },
  staff: { id: 2, username: 'staff', role: 'PRACTITIONER' },
  patient: { id: 3, username: 'patient', role: 'PATIENT' },
  otherPatient: { id: 4, username: 'otherPatient', role: 'PATIENT' },
};
let context;

function basicAuth(username = 'doctor', suppliedPassword = password) {
  return 'Basic ' + Buffer.from(`${username}:${suppliedPassword}`).toString('base64');
}

async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

async function closeServer(server) {
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

beforeEach(async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'journal-images-'));
  const dependencyStatus = { auth: 200, journal: 200 };
  // These HTTP endpoints follow the existing auth and journal contracts.
  const upstream = createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/api/auth/login') {
      let body = '';
      for await (const chunk of request) body += chunk;
      const credentials = JSON.parse(body);
      const user = users[credentials.username];
      response.statusCode = dependencyStatus.auth;
      if (!user || credentials.password !== password) response.statusCode = 401;
      response.end(JSON.stringify(user || { message: 'Fel inloggning' }));
      return;
    }
    const patientId = Number(request.url.split('/').at(-1));
    response.statusCode = dependencyStatus.journal;
    if (![101, 102].includes(patientId)) response.statusCode = 404;
    response.end(JSON.stringify({ id: patientId, userId: patientId === 101 ? 3 : 4 }));
  });
  const upstreamUrl = await listen(upstream);
  const config = {
    authServiceUrl: upstreamUrl,
    journalServiceUrl: upstreamUrl,
    uploadDirectory: path.join(directory, 'uploads'),
    databasePath: path.join(directory, 'data', 'images.sqlite'),
    frontendOrigin: 'http://localhost:5173',
    maxFileSize: 1024 * 1024,
    maxImagePixels: 20_000_000,
  };
  const { app, repository } = createApp(config);
  const server = createServer(app);
  const baseUrl = await listen(server);
  const png = await sharp({ create: { width: 320, height: 160, channels: 3, background: 'white' } }).png().toBuffer();
  context = { directory, upstream, dependencyStatus, config, server, repository, baseUrl, png };
});

afterEach(async () => {
  await closeServer(context.server);
  context.repository.close();
  await closeServer(context.upstream);
  await rm(context.directory, { recursive: true, force: true });
});

async function upload(bytes = context.png, username = 'doctor', patientId = '101', contentType = 'image/png') {
  const form = new FormData();
  form.set('patientId', patientId);
  form.set('image', new Blob([bytes], { type: contentType }), 'test.png');
  return fetch(`${context.baseUrl}/api/images`, {
    method: 'POST', headers: { Authorization: basicAuth(username) }, body: form,
  });
}

async function createImage() {
  const response = await upload();
  assert.equal(response.status, 201);
  return response.json();
}

function getImage(id, username = 'doctor') {
  return fetch(`${context.baseUrl}/api/images/${id}`, { headers: { Authorization: basicAuth(username) } });
}

function annotate(id, body, username = 'doctor') {
  return fetch(`${context.baseUrl}/api/images/${id}/annotate`, {
    method: 'PUT',
    headers: { Authorization: basicAuth(username), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const line = { type: 'line', x1: 20, y1: 110, x2: 150, y2: 110, color: '#0000ff', strokeWidth: 4 };

test('upload, patient list and image download form a complete flow', async () => {
  const image = await createImage();
  assert.equal(image.patientId, 101);
  assert.equal(image.version, 1);
  assert.equal(image.width, 320);
  assert.equal(image.createdBy, 1);
  assert.equal(image.contentType, 'image/png');
  assert.equal(image.fileName, undefined);
  const list = await fetch(`${context.baseUrl}/api/images?patientId=101`, { headers: { Authorization: basicAuth() } });
  assert.equal(list.status, 200);
  assert.deepEqual(await list.json(), [image]);
  const download = await getImage(image.id);
  assert.equal(download.status, 200);
  assert.equal(download.headers.get('content-type'), 'image/png');
  assert.equal(download.headers.get('cache-control'), 'no-store');
  const metadata = await sharp(Buffer.from(await download.arrayBuffer())).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 320);
});

test('text, line and rectangle change actual pixels in the stored image', async () => {
  const image = await createImage();
  const result = await annotate(image.id, { version: 1, annotations: [
    { type: 'text', x: 15, y: 10, text: 'Test & <bild>', fontSize: 20, color: '#ff0000' },
    line,
    { type: 'rectangle', x: 230, y: 20, width: 60, height: 40, color: '#00ff00', strokeWidth: 4 },
  ] });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).version, 2);
  const download = await getImage(image.id);
  assert.equal(download.headers.get('x-image-version'), '2');
  const bytes = Buffer.from(await download.arrayBuffer());
  const { data, info } = await sharp(bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixel = (x, y) => [...data.subarray((y * info.width + x) * 3, (y * info.width + x) * 3 + 3)];
  assert.deepEqual(pixel(50, 110), [0, 0, 255]);
  assert.deepEqual(pixel(230, 30), [0, 255, 0]);
  let redPixels = 0;
  for (let index = 0; index < data.length; index += 3) {
    if (data[index] > 150 && data[index + 1] < 100 && data[index + 2] < 100) redPixels++;
  }
  assert.ok(redPixels > 20, 'Text must produce red pixels');
});

test('JPEG and WebP uploads are converted to PNG', async () => {
  for (const format of ['jpeg', 'webp']) {
    const bytes = await sharp(context.png).toFormat(format).toBuffer();
    const response = await upload(bytes, 'staff', '101', `image/${format}`);
    assert.equal(response.status, 201);
    const image = await response.json();
    const download = await getImage(image.id);
    assert.equal((await sharp(Buffer.from(await download.arrayBuffer())).metadata()).format, 'png');
  }
});

test('patient can read own images but cannot access another patient', async () => {
  const image = await createImage();
  assert.equal((await getImage(image.id, 'patient')).status, 200);
  assert.equal((await getImage(image.id, 'otherPatient')).status, 403);
  const deniedList = await fetch(`${context.baseUrl}/api/images?patientId=101`, {
    headers: { Authorization: basicAuth('otherPatient') },
  });
  assert.equal(deniedList.status, 403);
});

test('only doctor may annotate and only staff may upload', async () => {
  const image = await createImage();
  const body = { version: 1, annotations: [line] };
  assert.equal((await annotate(image.id, body, 'staff')).status, 403);
  assert.equal((await annotate(image.id, body, 'patient')).status, 403);
  assert.equal((await upload(context.png, 'patient')).status, 403);
  assert.equal(context.repository.findById(image.id).version, 1);
});

test('credentials are checked by auth service', async () => {
  const noLogin = await fetch(`${context.baseUrl}/api/images?patientId=101`);
  assert.equal(noLogin.status, 401);
  const wrongLogin = await fetch(`${context.baseUrl}/api/images?patientId=101`, {
    headers: { Authorization: basicAuth('doctor', 'WrongPassword!') },
  });
  assert.equal(wrongLogin.status, 401);
  assert.ok(wrongLogin.headers.get('www-authenticate').startsWith('Basic'));
});

test('invalid bytes and SVG uploads are rejected even when declared as PNG', async () => {
  for (const bytes of [Buffer.from('This is not a picture'), Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>')]) {
    assert.equal((await upload(bytes)).status, 400);
  }
  assert.deepEqual(context.repository.findByPatient(101), []);
});

test('missing file, invalid patient id, oversized file and unknown patient are rejected', async () => {
  const form = new FormData();
  form.set('patientId', '101');
  const noFile = await fetch(`${context.baseUrl}/api/images`, {
    method: 'POST', headers: { Authorization: basicAuth() }, body: form,
  });
  assert.equal(noFile.status, 400);
  assert.equal((await upload(context.png, 'doctor', '../101')).status, 400);
  assert.equal((await upload(context.png, 'doctor', '999')).status, 404);
  assert.equal((await upload(Buffer.alloc(context.config.maxFileSize + 1))).status, 413);
});

test('invalid annotations leave the original image unchanged', async () => {
  const image = await createImage();
  const invalidInputs = [
    { version: 0, annotations: [line] },
    { version: '1', annotations: [line] },
    { version: 1, annotations: [] },
    { version: 1, annotations: [{ ...line, x1: -1 }] },
    { version: 1, annotations: [{ ...line, color: 'url(file:///private)' }] },
    { version: 1, annotations: [{ type: 'unknown', color: '#ff0000' }] },
    { version: 1, annotations: [{ type: 'text', x: 0, y: 0, text: '', fontSize: 20, color: '#ff0000' }] },
  ];
  for (const body of invalidInputs) {
    assert.equal((await annotate(image.id, body)).status, 400);
  }
  assert.equal(context.repository.findById(image.id).version, 1);
  assert.equal((await readdir(context.config.uploadDirectory)).length, 1);
});

test('old versions are rejected and concurrent edits cannot overwrite each other', async () => {
  const image = await createImage();
  const body = { version: 1, annotations: [line] };
  const results = await Promise.all([annotate(image.id, body), annotate(image.id, body)]);
  assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
  assert.equal(context.repository.findById(image.id).version, 2);
  assert.equal((await annotate(image.id, body)).status, 409);
  assert.equal((await readdir(context.config.uploadDirectory)).length, 2);
});

test('image metadata and edited bytes survive reopening the app and database', async () => {
  const image = await createImage();
  assert.equal((await annotate(image.id, { version: 1, annotations: [line] })).status, 200);
  const original = Buffer.from(await (await getImage(image.id)).arrayBuffer());
  await closeServer(context.server);
  context.repository.close();
  const reopened = createApp(context.config);
  context.repository = reopened.repository;
  context.server = createServer(reopened.app);
  context.baseUrl = await listen(context.server);
  assert.equal(context.repository.findById(image.id).version, 2);
  const download = await getImage(image.id);
  assert.equal(download.status, 200);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), original);
});

test('failed metadata insert removes its newly written image file', async () => {
  context.repository.insert = () => { throw new Error('Simulated database failure'); };
  assert.equal((await upload()).status, 500);
  assert.deepEqual(await readdir(context.config.uploadDirectory), []);
});

test('unknown ids, malformed JSON and missing list filter produce clear errors', async () => {
  assert.equal((await getImage(randomUUID())).status, 404);
  assert.equal((await getImage('invalid')).status, 400);
  const list = await fetch(`${context.baseUrl}/api/images`, { headers: { Authorization: basicAuth() } });
  assert.equal(list.status, 400);
  const malformed = await fetch(`${context.baseUrl}/api/images/${randomUUID()}/annotate`, {
    method: 'PUT', headers: { Authorization: basicAuth(), 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal(malformed.status, 400);
});

test('upstream failures are returned as errors instead of bypassing access checks', async () => {
  context.dependencyStatus.auth = 503;
  assert.equal((await upload()).status, 502);
  context.dependencyStatus.auth = 200;
  context.dependencyStatus.journal = 503;
  assert.equal((await upload()).status, 502);
  assert.deepEqual(context.repository.findByPatient(101), []);
});

test('images above the configured pixel limit are rejected', async () => {
  const largeImage = await sharp({ create: { width: 5001, height: 4000, channels: 3, background: 'white' } }).png().toBuffer();
  assert.equal((await upload(largeImage)).status, 400);
  assert.deepEqual(context.repository.findByPatient(101), []);
});

test('text with XML control characters is rejected before rendering', async () => {
  const image = await createImage();
  const result = await annotate(image.id, { version: 1, annotations: [
    { type: 'text', x: 0, y: 0, text: 'Bad\u0000text', fontSize: 20, color: '#ff0000' },
  ] });
  assert.equal(result.status, 400);
  assert.equal(context.repository.findById(image.id).version, 1);
});

test('annotation only needs the drawing and can be repeated with new additions', async () => {
  const image = await createImage();
  assert.equal((await annotate(image.id, { annotations: [line] })).status, 200);
  const second = await annotate(image.id, { annotations: [{ ...line, y1: 90, y2: 90 }] });
  assert.equal(second.status, 200);
  assert.equal((await second.json()).version, 3);
});

test('concurrent edits without a supplied version cannot overwrite each other', async () => {
  const image = await createImage();
  const body = { annotations: [line] };
  const responses = await Promise.all([annotate(image.id, body), annotate(image.id, body)]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  assert.equal(context.repository.findById(image.id).version, 2);
  assert.equal((await readdir(context.config.uploadDirectory)).length, 2);
});
