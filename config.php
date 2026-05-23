<?php
// Set Timezone to India
date_default_timezone_set('Asia/Kolkata');

// Supabase PostgreSQL Credentials
$supabase_url   = "https://tksvkozepwtaeevglfcw.supabase.co";
$supabase_key   = "sb_publishable_BMdi-uccDzwBNrgsOrL-2Q_B1pTWvMJ";
$db_host        = "db.tksvkozepwtaeevglfcw.supabase.co";
$db_port        = "5432";
$db_name        = "postgres";
$db_user        = "postgres";
$db_pass        = "thepokemaster14";

// DSN for PDO PostgreSQL connection
$dsn = "pgsql:host=$db_host;port=$db_port;dbname=$db_name;";

try {
    $conn = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// Set timezone for the session
$conn->exec("SET timezone TO 'Asia/Kolkata'");

// 7 Premium Tiers
$tiers = [
    1 => ['name' => 'Bronze',      'min' => 100,   'profit' => 3.0],
    2 => ['name' => 'Silver',      'min' => 400,   'profit' => 4.0],
    3 => ['name' => 'Gold',        'min' => 900,   'profit' => 4.5],
    4 => ['name' => 'Platinum',    'min' => 1600,  'profit' => 5.0],
    5 => ['name' => 'Diamond',     'min' => 3000,  'profit' => 6.0],
    6 => ['name' => 'Grandmaster', 'min' => 6000,  'profit' => 6.5],
    7 => ['name' => 'Legendary',   'min' => 10000, 'profit' => 7.5]
];

// Helper function
function calculateTier($balance, $tiers) {
    $currentLevel = 0;
    foreach ($tiers as $level => $data) {
        if ($balance >= $data['min']) {
            $currentLevel = $level;
        }
    }
    return $currentLevel;
}
?>
