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

switch ($method) {
    case 'GET':
        $date = $_GET['date'] ?? null;
        if ($date) {
            $stmt = $pdo->prepare("SELECT * FROM vacations WHERE ? BETWEEN dateFrom AND dateTo");
            $stmt->execute([$date]);
        } else {
            $stmt = $pdo->query("SELECT * FROM vacations");
        }
        $vacations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($vacations);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO vacations (employee, absenceType, dateFrom, dateTo, note)
                               VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['employee'],
            $data['absenceType'],
            $data['dateFrom'],
            $data['dateTo'],
            $data['note'] ?? null
        ]);
        echo json_encode(['id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE vacations
                               SET employee = ?, absenceType = ?, dateFrom = ?, dateTo = ?, note = ?
                               WHERE id = ?");
        $stmt->execute([
            $data['employee'],
            $data['absenceType'],
            $data['dateFrom'],
            $data['dateTo'],
            $data['note'] ?? null,
            $data['id']
        ]);
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM vacations WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Missing ID']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}
?>
