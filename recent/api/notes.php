<?php
$allowed_origins = [
    'http://localhost:5173',        // when developing React locally
    'http://192.168.1.10',          // when accessing from NAS directly
    'http://192.168.1.10:80',       // fallback variant some browsers use
    'http://192.168.1.10/Kalendár'  // if React build is hosted in this folder
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'db_connect.php';
$method = $_SERVER['REQUEST_METHOD'];

try {
    global $pdo;
    if (!isset($pdo) || !$pdo instanceof PDO) {
        throw new Exception('Database connection not established');
    }

    switch ($method) {
        case 'GET':
            $date = $_GET['date'] ?? null;
            if ($date) {
                $stmt = $pdo->prepare("SELECT * FROM notes WHERE date = ?");
                $stmt->execute([$date]);
                $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($notes ?: []);
            } else {
                $stmt = $pdo->query("SELECT * FROM notes");
                $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($notes ?: []);
            }
            break;
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (empty($data['date']) || empty($data['note'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields: date, note']);
                exit;
            }
            $stmt = $pdo->prepare("INSERT INTO notes (date, note) VALUES (?, ?)");
            $stmt->execute([$data['date'], $data['note']]);
            echo json_encode(['success' => true, 'id' => (int)$pdo->lastInsertId()]);
            break;
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            if (empty($data['id']) || empty($data['date']) || empty($data['note'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields: id, date, note']);
                exit;
            }
            $stmt = $pdo->prepare("UPDATE notes SET date = ?, note = ? WHERE id = ?");
            $stmt->execute([$data['date'], $data['note'], $data['id']]);
            echo json_encode(['success' => true]);
            break;
        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID required']);
                exit;
            }
            $stmt = $pdo->prepare("DELETE FROM notes WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => $stmt->rowCount() > 0]);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Notes API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>