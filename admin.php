<?php
// Set Timezone to India at the very top
date_default_timezone_set('Asia/Kolkata');

require_once 'config.php';
session_start();

// 1. Administrative Security
$ADMIN_PASSWORD = "thepokemaster14";

if (isset($_POST['admin_pass'])) {
    if ($_POST['admin_pass'] === $ADMIN_PASSWORD) {
        $_SESSION['admin_auth'] = true;
    } else {
        $login_error = "Access Denied: Invalid Administrative Key";
    }
}

if (isset($_GET['logout'])) {
    unset($_SESSION['admin_auth']);
    header("Location: admin.php");
    exit();
}

// 2. Auth Gate
if (!isset($_SESSION['admin_auth']) || $_SESSION['admin_auth'] !== true): ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vault Locked | Secure Admin</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #0071e3; --bg: #0b0f1a; }
        body { margin: 0; background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; color: white; overflow: hidden; }
        .aurora { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; filter: blur(100px); opacity: 0.3; }
        .blob { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: var(--primary); animation: move 20s infinite alternate; }
        @keyframes move { from { transform: translate(-10%, -10%); } to { transform: translate(20%, 20%); } }
        .login-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); padding: 50px; border-radius: 40px; border: 1px solid rgba(255,255,255,0.1); text-align: center; width: 380px; box-shadow: 0 40px 100px rgba(0,0,0,0.5); }
        .icon-lock { font-size: 3rem; color: var(--primary); margin-bottom: 20px; text-shadow: 0 0 20px rgba(0,113,227,0.5); }
        h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 30px; letter-spacing: -1px; }
        input { width: 100%; padding: 18px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; margin-bottom: 20px; font-size: 1rem; text-align: center; outline: none; transition: 0.3s; }
        input:focus { border-color: var(--primary); background: rgba(0,0,0,0.4); }
        button { width: 100%; padding: 18px; border-radius: 20px; border: none; background: var(--primary); color: white; font-weight: 800; cursor: pointer; transition: 0.3s; }
        button:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(0,113,227,0.4); }
        .err { color: #ff453a; font-size: 0.85rem; margin-bottom: 15px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="aurora"><div class="blob"></div></div>
    <div class="login-card">
        <i class="fa-solid fa-shield-halved icon-lock"></i>
        <h1>Admin Vault</h1>
        <?php if(isset($login_error)) echo "<div class='err'>$login_error</div>"; ?>
        <form method="POST">
            <input type="password" name="admin_pass" placeholder="Administrative Key" autofocus required>
            <button type="submit">Unlock System</button>
        </form>
    </div>
</body>
</html>
<?php exit(); endif; ?>

<?php
// --- START OF PROTECTED ADMIN ENGINE ---

// 1. APPROVE DEPOSIT (Includes 3-Level Commission)
if (isset($_GET['approve_dep'])) {
    $id = intval($_GET['approve_dep']);
    $conn->beginTransaction();

    try {
        $dep = $conn->query("SELECT * FROM deposits WHERE id = $id AND status = 'pending' FOR UPDATE")->fetch();
        if ($dep) {
            $uid = $dep['user_id'];
            $amt = $dep['amount'];

            // A. Update original depositor
            $conn->query("UPDATE users SET balance = balance + $amt, total_recharge = total_recharge + $amt WHERE id = $uid");

            // B. --- UPDATED 3-LEVEL REFERRAL LOGIC (Using referrer_id) ---
            
            // Level 1 (5%)
            $u_info = $conn->query("SELECT referrer_id FROM users WHERE id = $uid")->fetch();
            if ($u_info && $u_info['referrer_id'] > 0) {
                $ref_a = intval($u_info['referrer_id']);
                $comm_a = $amt * 0.05;
                $conn->query("UPDATE users SET balance = balance + $comm_a, withdrawable_profit = withdrawable_profit + $comm_a WHERE id = $ref_a");

                // Level 2 (3%)
                $u_info_b = $conn->query("SELECT referrer_id FROM users WHERE id = $ref_a")->fetch();
                if ($u_info_b && $u_info_b['referrer_id'] > 0) {
                    $ref_b = intval($u_info_b['referrer_id']);
                    $comm_b = $amt * 0.03;
                    $conn->query("UPDATE users SET balance = balance + $comm_b, withdrawable_profit = withdrawable_profit + $comm_b WHERE id = $ref_b");

                    // Level 3 (1%)
                    $u_info_c = $conn->query("SELECT referrer_id FROM users WHERE id = $ref_b")->fetch();
                    if ($u_info_c && $u_info_c['referrer_id'] > 0) {
                        $ref_c = intval($u_info_c['referrer_id']);
                        $comm_c = $amt * 0.01;
                        $conn->query("UPDATE users SET balance = balance + $comm_c, withdrawable_profit = withdrawable_profit + $comm_c WHERE id = $ref_c");
                    }
                }
            }
            // --- REFERRAL LOGIC END ---

            $conn->query("UPDATE deposits SET status = 'approved' WHERE id = $id");
            $conn->commit();
            header("Location: admin.php?success=approved");
            exit();
        }
    } catch (Exception $e) {
        $conn->rollBack();
    }
}

// 2. REJECT DEPOSIT
if (isset($_GET['reject_dep'])) {
    $id = intval($_GET['reject_dep']);
    $conn->query("UPDATE deposits SET status = 'rejected' WHERE id = $id");
    header("Location: admin.php");
    exit();
}

// 3. APPROVE WITHDRAWAL
if (isset($_GET['approve_wit'])) {
    $id = intval($_GET['approve_wit']);
    $conn->query("UPDATE withdrawals SET status = 'approved' WHERE id = $id");
    header("Location: admin.php");
    exit();
}

// 4. REJECT WITHDRAWAL (Refund user)
if (isset($_GET['reject_wit'])) {
    $id = intval($_GET['reject_wit']);
    $wit = $conn->query("SELECT * FROM withdrawals WHERE id = $id AND status = 'pending'")->fetch();
    if ($wit) {
        $uid = $wit['user_id']; $amt = $wit['amount'];
        $conn->query("UPDATE users SET balance = balance + $amt WHERE id = $uid");
        $conn->query("UPDATE withdrawals SET status = 'rejected' WHERE id = $id");
    }
    header("Location: admin.php");
    exit();
}

// Data Fetching
$total_liq = $conn->query("SELECT SUM(balance) as total FROM users")->fetch()['total'];
$pending_d = $conn->query("SELECT COUNT(*) as count FROM deposits WHERE status = 'pending'")->fetch()['count'];
$pending_w = $conn->query("SELECT COUNT(*) as count FROM withdrawals WHERE status = 'pending'")->fetch()['count'];

$all_deposits = $conn->query("SELECT d.*, u.username FROM deposits d JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC LIMIT 50");
$all_withdrawals = $conn->query("SELECT w.*, u.username FROM withdrawals w JOIN users u ON w.user_id = u.id ORDER BY w.created_at DESC LIMIT 50");
$all_users = $conn->query("SELECT *, GREATEST(0, balance - total_recharge) as profit FROM users ORDER BY balance DESC");
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1280"> 
    <title>Command Center | VIP AI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #0071e3; --bg: #0b0f1a; --card: rgba(255,255,255,0.03); --border: rgba(255,255,255,0.08); }
        body { margin: 0; background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; color: #f1f5f9; padding: 40px; width: 1280px; margin: 0 auto; overflow-x: hidden; }
        
        .header-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        
        /* Stats Grid */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: var(--card); border: 1px solid var(--border); padding: 25px; border-radius: 30px; backdrop-filter: blur(10px); transition: 0.3s; }
        .stat-card:hover { border-color: var(--primary); transform: translateY(-5px); }
        .stat-card small { color: #86868b; font-weight: 800; text-transform: uppercase; font-size: 0.65rem; letter-spacing: 1px; }
        .stat-card h3 { font-size: 1.8rem; margin: 10px 0 0; font-weight: 800; }

        /* Sections */
        .section { background: var(--card); border: 1px solid var(--border); border-radius: 40px; padding: 35px; margin-bottom: 40px; backdrop-filter: blur(20px); animation: fadeInUp 0.8s ease-out both; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        
        h2 { font-size: 1.2rem; font-weight: 800; margin-bottom: 25px; display: flex; align-items: center; gap: 10px; }
        h2 i { color: var(--primary); }

        /* Table Styling */
        table { width: 100%; border-collapse: separate; border-spacing: 0 10px; }
        th { text-align: left; padding: 15px; color: #86868b; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
        td { padding: 15px; background: rgba(255,255,255,0.02); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        td:first-child { border-radius: 15px 0 0 15px; border-left: 1px solid var(--border); }
        td:last-child { border-radius: 0 15px 15px 0; border-right: 1px solid var(--border); }

        .badge { padding: 6px 12px; border-radius: 10px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; border: 1px solid transparent; }
        .badge-pending { background: rgba(255, 159, 10, 0.1); color: #ff9f0a; border-color: rgba(255, 159, 10, 0.2); }
        .badge-approved { background: rgba(48, 209, 88, 0.1); color: #30d158; border-color: rgba(48, 209, 88, 0.2); }
        .badge-rejected { background: rgba(255, 69, 58, 0.1); color: #ff453a; border-color: rgba(255, 69, 58, 0.2); }

        .btn { padding: 10px 18px; border-radius: 12px; text-decoration: none; font-size: 0.75rem; font-weight: 800; transition: 0.2s; display: inline-flex; align-items: center; gap: 8px; }
        .btn-app { background: var(--primary); color: white; box-shadow: 0 10px 20px rgba(0, 113, 227, 0.2); }
        .btn-rej { background: rgba(255, 255, 255, 0.05); color: #ff453a; border: 1px solid rgba(255, 69, 58, 0.2); }
        .btn:hover { transform: scale(1.05); }
        .btn-disabled { opacity: 0.1; pointer-events: none; filter: grayscale(1); }

        .addr-pill { font-family: 'Courier New', monospace; font-size: 0.75rem; color: #818cf8; background: rgba(129, 140, 248, 0.1); padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(129, 140, 248, 0.2); }
        .logout-btn { color: #ff453a; text-decoration: none; font-weight: 800; font-size: 0.85rem; padding: 12px 24px; border: 1px solid rgba(255, 69, 58, 0.2); border-radius: 20px; transition: 0.3s; }
        .logout-btn:hover { background: #ff453a; color: white; }
        
        .time-badge { font-size: 0.7rem; color: #86868b; font-weight: 600; }
    </style>
</head>
<body>

<div class="container">
    <div class="header-nav">
        <h1 style="font-weight: 800; letter-spacing: -1.5px; margin: 0;">Command Center <span style="color: var(--primary);">.</span></h1>
        <div style="text-align: right; margin-right: 20px;">
            <small style="color: #86868b; font-weight: 800; font-size: 0.6rem; text-transform: uppercase;">Current IST</small>
            <div style="color: #30d158; font-weight: 800; font-size: 0.9rem;"><?php echo date('h:i A'); ?></div>
        </div>
        <a href="?logout=1" class="logout-btn"><i class="fa-solid fa-power-off"></i> Secure Terminate</a>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <small>Total Net Balance</small>
            <h3>$<?php echo number_format($total_liq, 2); ?></h3>
        </div>
        <div class="stat-card">
            <small>Deposits Processing</small>
            <h3 style="color: #ff9f0a;"><?php echo $pending_d; ?> Requests</h3>
        </div>
        <div class="stat-card">
            <small>Withdrawals Pending</small>
            <h3 style="color: #ff453a;"><?php echo $pending_w; ?> Requests</h3>
        </div>
        <div class="stat-card">
            <small>Network Health</small>
            <h3 style="color: #30d158;">Secured</h3>
        </div>
    </div>

    <div class="section" style="animation-delay: 0.1s;">
        <h2><i class="fa-solid fa-users"></i> Member Master List</h2>
        <table>
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Balance</th>
                    <th>Total Recharge</th>
                    <th>Current Profit</th>
                </tr>
            </thead>
            <tbody>
                <?php while($u = $all_users->fetch()): ?>
                <tr>
                    <td><b style="color: white;"><?php echo htmlspecialchars($u['username']); ?></b></td>
                    <td style="color:var(--primary); font-weight:800;">$<?php echo number_format($u['balance'], 2); ?></td>
                    <td>$<?php echo number_format($u['total_recharge'], 2); ?></td>
                    <td style="color:#30d158;">+$<?php echo number_format($u['profit'], 2); ?></td>
                </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    </div>

    <div class="section" style="animation-delay: 0.2s;">
        <h2><i class="fa-solid fa-circle-arrow-down"></i> Deposit Pipeline (Auto-Referral)</h2>
        <table>
            <thead>
                <tr>
                    <th>Member</th>
                    <th>Amount</th>
                    <th>Time (IST)</th>
                    <th>Status</th>
                    <th>Intelligence Action</th>
                </tr>
            </thead>
            <tbody>
                <?php while($d = $all_deposits->fetch()): 
                    $is_p = ($d['status'] == 'pending');
                    $ist_time = date("d M, h:i A", strtotime($d['created_at']));
                ?>
                <tr>
                    <td><?php echo htmlspecialchars($d['username']); ?></td>
                    <td style="font-weight:800; color:#30d158;">$<?php echo number_format($d['amount'], 2); ?></td>
                    <td class="time-badge"><?php echo $ist_time; ?></td>
                    <td><span class="badge badge-<?php echo $d['status']; ?>"><?php echo $d['status']; ?></span></td>
                    <td>
                        <a href="?approve_dep=<?php echo $d['id']; ?>" class="btn btn-app <?php echo !$is_p ? 'btn-disabled' : ''; ?>">Approve</a>
                        <a href="?reject_dep=<?php echo $d['id']; ?>" class="btn btn-rej <?php echo !$is_p ? 'btn-disabled' : ''; ?>">Reject</a>
                    </td>
                </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    </div>

    <div class="section" style="animation-delay: 0.3s;">
        <h2><i class="fa-solid fa-circle-arrow-up"></i> Withdrawal Verification</h2>
        <table>
            <thead>
                <tr>
                    <th>Member</th>
                    <th>Net Settlement</th>
                    <th>Time (IST)</th>
                    <th>Crypto Destination</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php while($w = $all_withdrawals->fetch()): 
                    $is_p = ($w['status'] == 'pending'); 
                    $net = $w['amount'] - $w['fee']; 
                    $ist_time_w = date("d M, h:i A", strtotime($w['created_at']));
                ?>
                <tr>
                    <td><?php echo htmlspecialchars($w['username']); ?></td>
                    <td style="color:#ff453a; font-weight:800;">$<?php echo number_format($net, 2); ?></td>
                    <td class="time-badge"><?php echo $ist_time_w; ?></td>
                    <td><span class="addr-pill"><?php echo $w['wallet_address']; ?></span></td>
                    <td><span class="badge badge-<?php echo $w['status']; ?>"><?php echo $w['status']; ?></span></td>
                    <td>
                        <a href="?approve_wit=<?php echo $w['id']; ?>" class="btn btn-app <?php echo !$is_p ? 'btn-disabled' : ''; ?>">Confirm Payout</a>
                        <a href="?reject_wit=<?php echo $w['id']; ?>" class="btn btn-rej <?php echo !$is_p ? 'btn-disabled' : ''; ?>">Refund User</a>
                    </td>
                </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    </div>
</div>

</body>
</html>
