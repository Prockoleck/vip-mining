<?php
require_once 'config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$user_id = $_SESSION['user_id'];

// Fetch Withdrawal History - Updated column to 'wallet_address'
$stmt = $conn->prepare("SELECT amount, fee, status, wallet_address, created_at FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC");
$stmt->execute([$user_id]);
$history = $stmt;

// Calculate total success withdrawals (Net amount)
$sum_stmt = $conn->prepare("SELECT COALESCE(SUM(amount - fee), 0) as total FROM withdrawals WHERE user_id = ? AND status = 'approved'");
$sum_stmt->execute([$user_id]);
$total_paid = $sum_stmt->fetch()['total'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Withdraw History | Apex Mining</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0b0f1a;
            --card: #151c2c;
            --primary: #818cf8;
            --success: #10b981;
            --pending: #f59e0b;
            --danger: #f43f5e;
            --text-dim: #94a3b8;
        }

        body { margin: 0; background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; color: white; padding-bottom: 50px; }
        
        .header { padding: 30px 20px; display: flex; align-items: center; gap: 15px; }
        .back-btn { 
            width: 45px; height: 45px; background: var(--card); border-radius: 15px; 
            display: flex; align-items: center; justify-content: center; 
            text-decoration: none; color: white; border: 1px solid rgba(255,255,255,0.05); 
        }

        .summary-card { 
            margin: 0 20px 30px; padding: 25px; 
            background: linear-gradient(135deg, #312e81 0%, #0f172a 100%); 
            border-radius: 25px; border: 1px solid rgba(129, 140, 248, 0.2); 
            text-align: center; 
            box-shadow: 0 15px 35px rgba(0,0,0,0.3);
        }
        .summary-card h3 { margin: 0; font-size: 0.75rem; color: var(--primary); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; }
        .summary-card .val { font-size: 2.2rem; font-weight: 800; margin-top: 5px; }

        .list-container { padding: 0 20px; }
        .history-item { 
            background: var(--card); border-radius: 22px; padding: 20px; 
            margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.03); 
            transition: 0.3s ease;
        }
        .history-item:active { transform: scale(0.98); }

        .item-main { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }
        
        .item-info { display: flex; align-items: center; gap: 15px; }
        .icon-box { 
            width: 50px; height: 50px; border-radius: 16px; 
            display: flex; align-items: center; justify-content: center; font-size: 1.1rem; 
        }
        .icon-approved { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .icon-pending { background: rgba(245, 158, 11, 0.1); color: var(--pending); }
        .icon-rejected { background: rgba(244, 63, 94, 0.1); color: var(--danger); }

        .meta h4 { margin: 0; font-size: 1.1rem; font-weight: 700; }
        .meta p { margin: 0; font-size: 0.75rem; color: var(--text-dim); margin-top: 2px; }

        .status-badge { 
            font-size: 0.6rem; font-weight: 800; text-transform: uppercase; 
            padding: 6px 12px; border-radius: 10px; letter-spacing: 0.5px;
        }
        .status-approved { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
        .status-pending { background: rgba(245, 158, 11, 0.1); color: var(--pending); border: 1px solid rgba(245, 158, 11, 0.2); }
        .status-rejected { background: rgba(244, 63, 94, 0.1); color: var(--danger); border: 1px solid rgba(244, 63, 94, 0.2); }

        .details-row { 
            background: rgba(0,0,0,0.2); padding: 12px 15px; 
            border-radius: 15px; font-size: 0.7rem; 
            display: flex; justify-content: space-between; align-items: center; 
        }
        .address-text { font-family: 'JetBrains Mono', monospace; color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; }
        .fee-tag { color: var(--danger); font-weight: 700; font-size: 0.75rem; }

        .empty-state { text-align: center; padding-top: 60px; color: var(--text-dim); }
        .empty-state i { font-size: 3.5rem; margin-bottom: 20px; opacity: 0.1; }
    </style>
</head>
<body>

    <div class="header">
        <a href="profile.php" class="back-btn"><i class="fas fa-chevron-left"></i></a>
        <h2 style="margin:0; font-weight: 800; font-size: 1.3rem;">Withdrawal History</h2>
    </div>

    <div class="summary-card">
        <h3>Total Paid Out</h3>
        <div class="val">$<?php echo number_format($total_paid, 2); ?></div>
    </div>

    <div class="list-container">
        <?php if ($history->rowCount() > 0): ?>
            <?php while($row = $history->fetch()): 
                $status = $row['status'];
                $net_amount = $row['amount'] - $row['fee'];
                // Logic for icon selection
                $icon = 'fa-paper-plane';
                if($status == 'pending') $icon = 'fa-clock';
                if($status == 'rejected') $icon = 'fa-ban';
            ?>
            <div class="history-item">
                <div class="item-main">
                    <div class="item-info">
                        <div class="icon-box icon-<?php echo $status; ?>">
                            <i class="fas <?php echo $icon; ?>"></i>
                        </div>
                        <div class="meta">
                            <h4>$<?php echo number_format($net_amount, 2); ?></h4>
                            <p><?php echo date('M d, Y • H:i', strtotime($row['created_at'])); ?></p>
                        </div>
                    </div>
                    <div class="status-badge status-<?php echo $status; ?>">
                        <?php echo $status; ?>
                    </div>
                </div>
                
                <div class="details-row">
                    <span class="address-text"><?php echo htmlspecialchars($row['wallet_address']); ?></span>
                    <span class="fee-tag">-$<?php echo number_format($row['fee'], 2); ?> Fee</span>
                </div>
            </div>
            <?php endwhile; ?>
        <?php else: ?>
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transactions found yet.</p>
            </div>
        <?php endif; ?>
    </div>

</body>
</html>
