<?php
require_once 'config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$user_id = $_SESSION['user_id'];
$error_msg = "";
$show_success = false;

// 1. Fetch balance AND total_recharge
$stmt = $conn->prepare("SELECT balance, total_recharge FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

$current_balance = $user['balance'];
$total_recharge = $user['total_recharge'];

// --- NEW REFERRAL UNLOCK LOGIC ---
// Count Level 1
$l1_query = $conn->query("SELECT id FROM users WHERE referrer_id = $user_id");
$l1_count = $l1_query->rowCount();

// Count Level 2
$l2_count = 0;
if ($l1_count > 0) {
    $l1_ids = [];
    while($row = $l1_query->fetch()) { $l1_ids[] = $row['id']; }
    $ids_string = implode(',', $l1_ids);
    $l2_query = $conn->query("SELECT id FROM users WHERE referrer_id IN ($ids_string)");
    $l2_count = $l2_query->rowCount();
}

// Check if requirements are met (3 Lvl-1 AND 2 Lvl-2)
$principal_unlocked = ($l1_count >= 3 && $l2_count >= 2);

// 2. Define Total Withdrawable Amount
if ($principal_unlocked) {
    $withdrawable_total = $current_balance; // Can withdraw everything
} else {
    $withdrawable_total = max(0, $current_balance - $total_recharge); // Profit only
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $amount = floatval($_POST['amount']);
    $address = $_POST['address'];
    $fee = $amount * 0.05;

    if ($amount < 50) {
        $error_msg = "Minimum withdrawal is 50 USDT.";
    } 
    elseif ($amount > $withdrawable_total) {
        if (!$principal_unlocked) {
            $error_msg = "Principal is locked. Refer 3 Lvl-1 and 2 Lvl-2 partners to unlock. Current limit: $" . number_format($withdrawable_total, 2);
        } else {
            $error_msg = "Insufficient balance.";
        }
    } 
    else {
        $check_stmt = $conn->prepare("SELECT id FROM withdrawals WHERE user_id = ? AND created_at > NOW() - INTERVAL '7 days' LIMIT 1");
        $check_stmt->execute([$user_id]);
        
        if ($check_stmt->fetch()) {
            $error_msg = "Withdrawal allowed once every 7 days.";
        } else {
            $ins = $conn->prepare("INSERT INTO withdrawals (user_id, wallet_address, amount, fee, status) VALUES (?, ?, ?, ?, 'pending')");
            $ins->execute([$user_id, $address, $amount, $fee]);
            
            if ($ins->rowCount()) {
                $update = $conn->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
                $update->execute([$amount, $user_id]);
                $show_success = true;
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Withdrawal | VIP AI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0071e3;
            --glass: rgba(255, 255, 255, 0.7);
            --glass-border: rgba(255, 255, 255, 0.8);
            --text: #1d1d1f;
            --text-dim: #86868b;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        body { background: #fbfbfd; font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); min-height: 100vh; padding-bottom: 40px; }

        /* Aurora Background */
        .aurora { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; filter: blur(100px); opacity: 0.4; }
        .blob { position: absolute; width: 500px; height: 500px; border-radius: 50%; animation: move 20s infinite alternate ease-in-out; }
        .b1 { background: var(--primary); top: -10%; left: -10%; }
        .b2 { background: #5e5ce6; bottom: -10%; right: -10%; animation-delay: -5s; }
        @keyframes move { from { transform: translate(0,0); } to { transform: translate(100px, 80px); } }

        .container { width: 100%; max-width: 440px; margin: 0 auto; padding: 30px 24px; }

        /* Entry Animations */
        @keyframes reveal { from { opacity: 0; transform: translateY(25px); } to { opacity: 1; transform: translateY(0); } }
        .anim-1 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-2 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .anim-3 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }

        /* Header */
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; }
        .back-link { width: 45px; height: 45px; background: var(--glass); border-radius: 15px; display: flex; align-items: center; justify-content: center; color: var(--text); border: 1px solid var(--glass-border); text-decoration: none; }

        /* Profit Hero */
        .profit-hero {
            background: linear-gradient(135deg, #1d1d1f 0%, #434343 100%);
            padding: 30px; border-radius: 35px; color: white; margin-bottom: 25px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15); position: relative; overflow: hidden;
        }
        .profit-hero::before { content: ''; position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: var(--primary); filter: blur(50px); opacity: 0.4; }
        .hero-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; }
        .hero-amount { font-size: 2.8rem; font-weight: 800; margin: 10px 0; letter-spacing: -2px; }
        
        .hero-stats { display: flex; gap: 20px; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; }
        .stat-box { flex: 1; }
        .stat-box span { display: block; font-size: 0.6rem; text-transform: uppercase; font-weight: 800; opacity: 0.6; }
        .stat-box strong { font-size: 0.9rem; font-weight: 700; }

        /* Status Bar */
        .unlock-status { background: rgba(255,255,255,0.1); padding: 10px 15px; border-radius: 15px; margin-top: 15px; font-size: 0.65rem; font-weight: 700; }

        /* Form Card */
        .withdraw-card {
            background: var(--glass); backdrop-filter: blur(30px);
            border: 1px solid var(--glass-border); border-radius: 35px;
            padding: 30px 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.05);
        }

        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; margin: 0 0 8px 5px; }
        .input-field {
            width: 100%; padding: 18px 20px; border-radius: 20px;
            border: 1px solid var(--glass-border); background: rgba(255,255,255,0.5);
            font-family: inherit; font-size: 1rem; font-weight: 700; outline: none; transition: 0.3s;
        }
        .input-field:focus { border-color: var(--primary); background: #fff; box-shadow: 0 10px 20px rgba(0, 113, 227, 0.05); }

        /* Fee Breakdown */
        .fee-calc {
            background: rgba(0,0,0,0.03); border-radius: 20px; padding: 15px; margin-bottom: 25px;
        }
        .fee-line { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; margin-bottom: 6px; }
        .fee-line.total { border-top: 1px solid rgba(0,0,0,0.05); padding-top: 8px; margin-top: 5px; color: var(--primary); font-weight: 800; }

        .btn-withdraw {
            width: 100%; background: var(--primary); color: #fff; border: none;
            padding: 20px; border-radius: 22px; font-weight: 800; font-size: 1rem;
            box-shadow: 0 15px 30px rgba(0, 113, 227, 0.3); cursor: pointer; transition: 0.2s;
        }
        .btn-withdraw:active { transform: scale(0.96); }

        /* Rules */
        .rules-container { margin-top: 25px; display: flex; flex-direction: column; gap: 10px; }
        .rule-item { 
            background: var(--glass); padding: 15px; border-radius: 20px; 
            display: flex; align-items: center; gap: 12px; border: 1px solid var(--glass-border);
        }
        .rule-item i { color: var(--primary); font-size: 1rem; }
        .rule-item span { font-size: 0.7rem; font-weight: 600; color: var(--text-dim); }
        .rule-item b { color: var(--text); }
    </style>
</head>
<body>

<div class="aurora"><div class="blob b1"></div><div class="blob b2"></div></div>

<div class="container">
    <div class="header anim-1">
        <a href="dashboard.php" class="back-link"><i class="fa-solid fa-chevron-left"></i></a>
        <h2 style="font-weight: 800; font-size: 1.2rem; letter-spacing: -0.5px;">Withdrawal</h2>
        <div style="width:45px;"></div>
    </div>

    <div class="profit-hero anim-1">
        <span class="hero-label">Withdrawable Amount</span>
        <div class="hero-amount">$<?php echo number_format($withdrawable_total, 2); ?></div>
        
        <div class="hero-stats">
            <div class="stat-box">
                <span>Total Balance</span>
                <strong>$<?php echo number_format($current_balance, 2); ?></strong>
            </div>
            <div class="stat-box">
                <span>Principal Status</span>
                <strong><?php echo $principal_unlocked ? 'UNLOCKED' : 'LOCKED'; ?></strong>
            </div>
        </div>

        <div class="unlock-status">
            Network Progress: Lvl 1: <?php echo $l1_count; ?>/3 | Lvl 2: <?php echo $l2_count; ?>/2
        </div>
    </div>

    <div class="withdraw-card anim-2">
        <form method="POST" onsubmit="return validateForm()">
            <div class="input-group">
                <label>BEP20 Receiving Address</label>
                <input type="text" name="address" class="input-field" placeholder="0x..." required>
            </div>

            <div class="input-group">
                <label>Withdraw Amount (USDT)</label>
                <input type="number" name="amount" id="amtInp" class="input-field" placeholder="Min. 50" required step="0.01" oninput="calculateFees()">
            </div>

            <div class="fee-calc">
                <div class="fee-line">
                    <span>Processing Fee (5%)</span>
                    <span id="feeLabel">0.00 USDT</span>
                </div>
                <div class="fee-line total">
                    <span>Net Settlement</span>
                    <span id="netLabel">0.00 USDT</span>
                </div>
            </div>

            <button type="submit" class="btn-withdraw">WITHDRAW</button>
        </form>
    </div>

    <div class="rules-container anim-3">
        <div class="rule-item">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Unlock Principal: <b>3 Lvl-1 & 2 Lvl-2</b> referrals required.</span>
        </div>
        <div class="rule-item">
            <i class="fa-solid fa-clock"></i>
            <span>Processing: <b>2-4 Business Days</b> typical window.</span>
        </div>
        <div class="rule-item">
            <i class="fa-solid fa-calendar-days"></i>
            <span>Limit: <b>One withdrawal</b> every 7 days.</span>
        </div>
    </div>
</div>

<script>
    function calculateFees() {
        const val = document.getElementById('amtInp').value;
        const fee = val * 0.05;
        const net = val - fee;
        document.getElementById('feeLabel').innerText = (val > 0 ? fee.toFixed(2) : "0.00") + " USDT";
        document.getElementById('netLabel').innerText = (val > 0 ? net.toFixed(2) : "0.00") + " USDT";
    }

    function validateForm() {
        const amt = parseFloat(document.getElementById('amtInp').value);
        const limit = <?php echo $withdrawable_total; ?>;
        const unlocked = <?php echo $principal_unlocked ? 'true' : 'false'; ?>;
        
        if (amt < 50) {
            alert("⚠️ Minimum withdrawal threshold is 50 USDT");
            return false;
        }
        if (amt > limit) {
            if (!unlocked) {
                alert("⚠️ Principal Locked. You need 3 Lvl-1 and 2 Lvl-2 referrals to withdraw your deposit. Current withdrawable profit: $" + limit.toFixed(2));
            } else {
                alert("⚠️ Insufficient total balance.");
            }
            return false;
        }
        return true;
    }

    <?php if($show_success): ?>
        alert("Transaction Initiated! Your request is being verified by the node.");
        window.location.href = "dashboard.php";
    <?php elseif($error_msg): ?>
        alert("System Notice: <?php echo $error_msg; ?>");
    <?php endif; ?>
</script>

</body>
</html>
