<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$file = __DIR__ . '/cennik.json';

function read_data($file) {
  if (!file_exists($file)) return [];
  $raw = file_get_contents($file);
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function write_data($file, $data) {
  $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  return file_put_contents($file, $json, LOCK_EX) !== false;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  echo json_encode(read_data($file), JSON_UNESCAPED_UNICODE);
  exit;
}

$items = read_data($file);

if ($method === 'POST' || $method === 'PUT') {
  $body = json_decode(file_get_contents('php://input'), true);
  if (!is_array($body)) { http_response_code(400); echo json_encode(["success"=>false]); exit; }

  $id = isset($body['id']) && $body['id'] !== null && $body['id'] !== '' ? (string)$body['id'] : null;
  $name = trim($body['name'] ?? '');
  $price = trim($body['price'] ?? '');

  if ($name === '' || $price === '') { http_response_code(400); echo json_encode(["success"=>false]); exit; }

  if (!$id) $id = (string)time();

  $updated = false;
  for ($i=0; $i<count($items); $i++) {
    if ((string)$items[$i]['id'] === (string)$id) {
      $items[$i] = ["id"=>$id, "name"=>$name, "price"=>$price];
      $updated = true;
      break;
    }
  }
  if (!$updated) $items[] = ["id"=>$id, "name"=>$name, "price"=>$price];

  if (!write_data($file, $items)) { http_response_code(500); echo json_encode(["success"=>false]); exit; }
  echo json_encode(["success"=>true, "id"=>$id], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($method === 'DELETE') {
  $id = $_GET['id'] ?? '';
  if ($id === '') { http_response_code(400); echo json_encode(["success"=>false]); exit; }

  $items = array_values(array_filter($items, fn($x) => (string)($x['id'] ?? '') !== (string)$id));

  if (!write_data($file, $items)) { http_response_code(500); echo json_encode(["success"=>false]); exit; }
  echo json_encode(["success"=>true], JSON_UNESCAPED_UNICODE);
  exit;
}

http_response_code(405);
echo json_encode(["success"=>false], JSON_UNESCAPED_UNICODE);
