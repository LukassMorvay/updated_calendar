<?php
require_once "db_connect.php";

header("Content-Type: application/json");

$method = $_SERVER["REQUEST_METHOD"];

// 🔹 NAČÍTANIE
if ($method === "GET") {
    $stmt = $pdo->query("SELECT * FROM rentals ORDER BY date_from");
    echo json_encode($stmt->fetchAll());
    exit;
}

// 🔹 VSTUPNÉ DÁTA
$data = json_decode(file_get_contents("php://input"), true);

// 🔹 PRIDANIE
if ($method === "POST") {
    $stmt = $pdo->prepare("
        INSERT INTO rentals
        (item, customer, car, phone, date_from, date_to, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data["item"],
        $data["customer"],
        $data["car"],
        $data["phone"],
        $data["from"],
        $data["to"],
        $data["status"]
    ]);
    echo json_encode(["success" => true]);
    exit;
}

// 🔹 ÚPRAVA
if ($method === "PUT") {
    $stmt = $pdo->prepare("
        UPDATE rentals SET
            item=?, customer=?, car=?, phone=?,
            date_from=?, date_to=?, status=?
        WHERE id=?
    ");
    $stmt->execute([
        $data["item"],
        $data["customer"],
        $data["car"],
        $data["phone"],
        $data["from"],
        $data["to"],
        $data["status"],
        $data["id"]
    ]);
    echo json_encode(["success" => true]);
    exit;
}

// 🔹 ZMAZANIE
if ($method === "DELETE") {
    $stmt = $pdo->prepare("DELETE FROM rentals WHERE id=?");
    $stmt->execute([$data["id"]]);
    echo json_encode(["success" => true]);
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
