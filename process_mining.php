<?php
require_once 'config.php';
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Session expired.']);
    exit();
}

$uid = $_SESSION['user_id'];

// Added total_recharge to the query so the tier logic can read it
$stmt = $conn->prepare("SELECT balance, total_recharge, last_mining_time FROM users WHERE id = ?");
$stmt->execute([$uid]);
$user = $stmt->fetch();

$current_balance = (float)$user['balance'];
$recharged = (float)$user['total_recharge'];

// 1. Min $100 Check (Updated based on your new tiers starting at 100)
if ($recharged < 100) {
    echo json_encode(['status' => 'error', 'message' => 'Minimum $100 recharge required to start mining.']);
    exit();
}

// 2. 24H Cooldown Check
if ($user['last_mining_time'] && (time() - strtotime($user['last_mining_time'])) < 86400) {
    echo json_encode(['status' => 'error', 'message' => 'Miner is cooling down. Wait for the 24h cycle to end.']);
    exit();
}

// 3. Profit Tiers (Exactly as shown in your WhatsApp screenshot)
if ($recharged >= 10000) {
    $p = 0.07;     // 7%
} elseif ($recharged >= 5000) {
    $p = 0.06;     // 6%
} elseif ($recharged >= 3000) {
    $p = 0.05;     // 5%
} elseif ($recharged >= 1000) {
    $p = 0.04;     // 4%
} elseif ($recharged >= 500) {
    $p = 0.035;    // 3.50%
} elseif ($recharged >= 400) {
    $p = 0.03;     // 3%
} elseif ($recharged >= 300) {
    $p = 0.025;    // 2.50%
} elseif ($recharged >= 200) {
    $p = 0.0225;   // 2.25%
} else {
    $p = 0.02;     // 2% (for $100 tier)
}

// 4. COMPOUNDING LOGIC
// We calculate profit based on CURRENT BALANCE instead of the recharge amount
$profit = $current_balance * $p;

// 5. Update Database
$update = $conn->prepare("UPDATE users SET balance = balance + ?, last_mining_time = NOW() WHERE id = ?");
$update->execute([$profit, $uid]);

if($update->rowCount()) {
    echo json_encode([
        'status' => 'success', 
        'earned' => number_format($profit, 2),
        'new_balance' => number_format($current_balance + $profit, 2)
    ]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Database update failed.']);
}
