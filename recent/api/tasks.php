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

    if ($method === 'GET') {
        $date = $_GET['date'] ?? '';
        if (empty($date)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Date parameter required']);
            exit;
        }
        $stmt = $pdo->prepare("SELECT id, date, createdBy, createdAt, mechanik, popis, znacka, poistovna, start, end, meno, telefon, cena, extraInfo, checklist FROM tasks WHERE date = ?");
        $stmt->execute([$date]);
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($tasks as &$task) {
            $task['checklist'] = json_decode($task['checklist'] ?? '[]', true);
            $task['cena'] = $task['cena'] !== null ? floatval($task['cena']) : null;
        }
        echo json_encode($tasks ?: []);
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $date = $_GET['date'] ?? $data['date'] ?? '';
        if (empty($date) || empty($data['popis']) || empty($data['znacka']) || empty($data['telefon']) || empty($data['createdBy'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields: date, popis, znacka, telefon, createdBy']);
            exit;
        }

        $checklist = json_encode($data['checklist'] ?? [], JSON_UNESCAPED_UNICODE);
        $stmt = $pdo->prepare("
            INSERT INTO tasks (date, createdBy, createdAt, mechanik, popis, znacka, poistovna, start, end, meno, telefon, cena, extraInfo, checklist)
            VALUES (:date, :createdBy, :createdAt, :mechanik, :popis, :znacka, :poistovna, :start, :end, :meno, :telefon, :cena, :extraInfo, :checklist)
        ");
        $stmt->execute([
            ':date' => $date,
            ':createdBy' => $data['createdBy'] ?? 'Unknown',
            ':createdAt' => $data['createdAt'] ?? date('d.m.Y H:i'),
            ':mechanik' => $data['mechanik'] ?? null,
            ':popis' => $data['popis'],
            ':znacka' => $data['znacka'],
            ':poistovna' => $data['poistovna'] ?? null,
            ':start' => $data['start'] ?? null,
            ':end' => $data['end'] ?? null,
            ':meno' => $data['meno'] ?? null,
            ':telefon' => $data['telefon'],
            ':cena' => $data['cena'] ?? null,
            ':extraInfo' => $data['extraInfo'] ?? null,
            ':checklist' => $checklist
        ]);
        $id = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'id' => (int)$id]);
    } elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID required']);
            exit;
        }
        $checklist = json_encode($data['checklist'] ?? [], JSON_UNESCAPED_UNICODE);
        $stmt = $pdo->prepare("
            UPDATE tasks SET
                date = :date,
                createdBy = :createdBy,
                mechanik = :mechanik,
                popis = :popis,
                znacka = :znacka,
                poistovna = :poistovna,
                start = :start,
                end = :end,
                meno = :meno,
                telefon = :telefon,
                cena = :cena,
                extraInfo = :extraInfo,
                checklist = :checklist
            WHERE id = :id
        ");
        $stmt->execute([
            ':date' => $data['date'] ?? null,
            ':createdBy' => $data['createdBy'] ?? 'Unknown',
            ':mechanik' => $data['mechanik'] ?? null,
            ':popis' => $data['popis'] ?? null,
            ':znacka' => $data['znacka'] ?? null,
            ':poistovna' => $data['poistovna'] ?? null,
            ':start' => $data['start'] ?? null,
            ':end' => $data['end'] ?? null,
            ':meno' => $data['meno'] ?? null,
            ':telefon' => $data['telefon'] ?? null,
            ':cena' => $data['cena'] ?? null,
            ':extraInfo' => $data['extraInfo'] ?? null,
            ':checklist' => $checklist,
            ':id' => $data['id']
        ]);
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? '';
        if (empty($id)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID required']);
            exit;
        }
        $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
        $stmt->execute([$id]);
        $rowCount = $stmt->rowCount();
        echo json_encode(['success' => $rowCount > 0]);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log("Tasks API error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine() . "\nStack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()]);
}
?>