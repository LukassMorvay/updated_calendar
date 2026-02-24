<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Názov JSON súboru, kde sa budú ukladať udalosti
$filename = __DIR__ . "/fullDayEvents.json";

// Ak súbor neexistuje alebo je prázdny, vytvor nový prázdny JSON
if (!file_exists($filename) || filesize($filename) === 0) {
    file_put_contents($filename, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Načítaj obsah JSON súboru
$rawData = file_get_contents($filename);
$events = json_decode($rawData, true);

// Ak sa JSON nepodarilo dekódovať, inicializuj prázdne pole
if (!is_array($events)) {
    $events = [];
}

// Zisti, aká metóda bola použitá (GET, POST, DELETE)
$method = $_SERVER['REQUEST_METHOD'];

// Spracovanie podľa metódy
switch ($method) {
    case 'GET':
        // Vráti všetky udalosti
        echo json_encode($events, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['dateFrom'], $data['dateTo'], $data['reason'])) {
            echo json_encode(['success' => false, 'error' => 'Chýbajúce polia.']);
            exit;
        }

        $newEvent = [
            'id' => uniqid(),
            'dateFrom' => $data['dateFrom'],
            'dateTo' => $data['dateTo'],
            'reason' => $data['reason']
        ];

        $events[] = $newEvent;

        // Ulož zmeny do súboru
        file_put_contents($filename, json_encode($events, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        echo json_encode(['success' => true, 'event' => $newEvent]);
        break;

    case 'DELETE':
        // Možnosť vymazať udalosť podľa ID
        parse_str($_SERVER['QUERY_STRING'], $query);
        $id = $query['id'] ?? null;

        if ($id) {
            $events = array_values(array_filter($events, fn($e) => $e['id'] !== $id));
            file_put_contents($filename, json_encode($events, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Chýba ID.']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Nepodporovaná metóda.']);
        break;
}
?>

