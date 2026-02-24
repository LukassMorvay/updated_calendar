<?php
header('Content-Type: application/json; charset=utf-8');

$storeFile = __DIR__ . '/night_order.json';

// vytvor subor ak neexistuje
if (!file_exists($storeFile)) {
  file_put_contents($storeFile, json_encode(new stdClass(), JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];

function readStore($storeFile) {
  $raw = @file_get_contents($storeFile);
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function writeStore($storeFile, $data) {
  // LOCK aby sa to nebilo ked kliknu 2 PC naraz
  $json = json_encode($data, JSON_UNESCAPED_UNICODE);
  return file_put_contents($storeFile, $json, LOCK_EX) !== false;
}

if ($method === 'GET') {
  $date = isset($_GET['date']) ? $_GET['date'] : '';
  if ($date === '') {
    echo json_encode(['success' => false, 'error' => 'missing_date']);
    exit;
  }

  $store = readStore($storeFile);
  $ids = isset($store[$date]) && is_array($store[$date]) ? $store[$date] : [];
  echo json_encode(['success' => true, 'date' => $date, 'ids' => $ids]);
  exit;
}

if ($method === 'POST') {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);

  $date = isset($data['date']) ? $data['date'] : '';
  $ids  = isset($data['ids']) && is_array($data['ids']) ? $data['ids'] : [];

  if ($date === '' || empty($ids)) {
    echo json_encode(['success' => false, 'error' => 'missing_date_or_ids']);
    exit;
  }

  // normalizacia: iba stringy/ID, max 8
  $norm = [];
  foreach ($ids as $id) {
    $id = trim((string)$id);
    if ($id !== '') $norm[] = $id;
    if (count($norm) >= 8) break;
  }

  $store = readStore($storeFile);
  $store[$date] = $norm;

  if (!writeStore($storeFile, $store)) {
    echo json_encode(['success' => false, 'error' => 'write_failed']);
    exit;
  }

  echo json_encode(['success' => true]);
  exit;
}

echo json_encode(['success' => false, 'error' => 'method_not_allowed']);