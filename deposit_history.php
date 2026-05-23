<?php
require_once 'config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$user_id = $_SESSION['user_id'];

// Fetch Deposit History
$stmt = $conn->prepare("SELECT amount, status, created_at FROM deposits WHERE user_id = ? ORDER BY created_at DESC");
$stmt->execute([$user_id]);
$history = $stmt;

// Calculate total approved deposits for the header summary
$sum_stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE user_id = ? AND status = 'approved'");
$sum_stmt->execute([$user_id]);
$total_approved = $sum_stmt->fetch()['total'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deposit History | Apex Mining</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0b0f1a;
            --card: #151c2c;
            --primary: #38bdf8;
            --success: #10b981;
            --pending: #f59e0b;
            --danger: #f43f5e;
            --text-dim: #94a3b8;
        }

        body { margin: 0; background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; color: white; padding-bottom: 50px; }
        .header { padding: 30px 20px; display: flex; align-items: center; gap: 15px; }
        .back-btn { width: 45px; height: 45px; background: var(--card); border-radius: 15px; display: flex; align-items: center; justify-content: center; text-decoration: none; color: white; border: 1px solid rgba(255,255,255,0.05); }

        .summary-card {
            margin: 0 20px 30px; padding: 25px;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 25px; border: 1px solid rgba(56, 189, 248, 0.2);
            text-align: center;
        }
        .summary-card h3 { margin: 0; font-size: 0.8rem; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; }
        .summary-card .val { font-size: 2rem; font-weight: 700; margin-top: 5px; }

        .list-container { padding: 0 20px; }
        .history-item {
            background: var(--card); border-radius: 20px; padding: 18px;
            margin-bottom: 15px; display: flex; align-items: center;
            justify-content: space-between; border: 1px solid rgba(255,255,255,0.03);
            transition: 0.3s;
        }
        .history-item:hover { transform: scale(1.02); background: #1c2539; }

        .item-info { display: flex; align-items: center; gap: 15px; }
        .icon-box { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .icon-approved { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .icon-pending { background: rgba(245, 158, 11, 0.1); color: var(--pending); }
        .icon-rejected { background: rgba(244, 63, 94, 0.1); color: var(--danger); }

        .meta h4 { margin: 0; font-size: 1rem; font-weight: 700; }
        .meta p { margin: 0; font-size: 0.7rem; color: var(--text-dim); margin-top: 3px; }

        .status-badge { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; padding: 5px 10px; border-radius: 8px; }
        .status-approved { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .status-pending { background: rgba(245, 158, 11, 0.1); color: var(--pending); }
        .status-rejected { background: rgba(244, 63, 94, 0.1); color: var(--danger); }

        .empty-state { text-align: center; padding-top: 50px; color: var(--text-dim); }
    </style>
</head>
<body>

    <div class="header">
        <a href="profile.php" class="back-btn"><i class="fas fa-chevron-left"></i></a>
        <h2 style="margin:0; font-weight: 700;">Deposit Records</h2>
    </div>

    <div class="summary-card">
        <h3>Total Funded</h3>
        <div class="val">$<?php echo number_format($total_approved, 2); ?></div>
    </div>

    <div class="list-container">
        <?php if ($history->rowCount() > 0): ?>
            <?php while($row = $history->fetch()): 
                $status = $row['status'];
                $icon_class = "icon-" . $status;
                $badge_class = "status-" . $status;
                $icon = ($status == 'approved') ? 'fa-check' : (($status == 'pending') ? 'fa-clock' : 'fa-xmark');
            ?>
            <div class="history-item">
                <div class="item-info">
                    <div class="icon-box <?php echo $icon_class; ?>">
                        <i class="fas <?php echo $icon; ?>"></i>
                    </div>
                    <div class="meta">
                        <h4>$<?php echo number_format($row['amount'], 2); ?></h4>
                        <p><?php echo date('M d, Y • H:i', strtotime($row['created_at'])); ?></p>
                    </div>
                </div>
                <div class="status-badge <?php echo $badge_class; ?>">
                    <?php echo $status; ?>
                </div>
            </div>
            <?php endwhile; ?>
        <?php else: ?>
            <div class="empty-state">
                <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.2;"></i>
                <p>No deposit records found.</p>
            </div>
        <?php endif; ?>
    </div>

</body>
</html>
