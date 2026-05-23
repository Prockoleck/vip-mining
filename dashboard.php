<?php
require_once 'config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$user_id = $_SESSION['user_id'];

// Updated Tiers to match the new 100-10000 scale and percentages
$tiers = [
    1 => ['name' => 'Bronze', 'min' => 100, 'profit' => 2.0, 'icon' => 'fa-seedling'],
    2 => ['name' => 'Silver', 'min' => 200, 'profit' => 2.25, 'icon' => 'fa-coins'],
    3 => ['name' => 'Gold', 'min' => 300, 'profit' => 2.5, 'icon' => 'fa-crown'],
    4 => ['name' => 'Platinum', 'min' => 400, 'profit' => 3.0, 'icon' => 'fa-gem'],
    5 => ['name' => 'Diamond', 'min' => 500, 'profit' => 3.5, 'icon' => 'fa-diamond'],
    6 => ['name' => 'Elite', 'min' => 1000, 'profit' => 4.0, 'icon' => 'fa-shuttle-space'],
    7 => ['name' => 'Elite Plus', 'min' => 3000, 'profit' => 5.0, 'icon' => 'fa-layer-group'],
    8 => ['name' => 'Immortal', 'min' => 5000, 'profit' => 6.0, 'icon' => 'fa-bolt'],
    9 => ['name' => 'Legendary', 'min' => 10000, 'profit' => 7.0, 'icon' => 'fa-fire-flame-curved']
];

$stmt = $conn->prepare("SELECT username, balance, profile_pic FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user_data = $stmt->fetch();

$username = $user_data['username'];
$balance = $user_data['balance'];

function calculateCurrentTier($bal, $tlist) {
    $current = 0;
    foreach ($tlist as $id => $data) {
        if ($bal >= $data['min']) { $current = $id; }
    }
    return $current;
}
$current_tier_id = calculateCurrentTier($balance, $tiers);
$has_pfp = !empty($user_data['profile_pic']) && file_exists("uploads/" . $user_data['profile_pic']);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Dashboard | VIP AI Mining</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --primary: #0071e3;
            --glass: rgba(255, 255, 255, 0.75);
            --glass-border: rgba(255, 255, 255, 0.8);
            --text-main: #1d1d1f;
            --text-dim: #86868b;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }

        body {
            background-color: #FBFBFD;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: var(--text-main);
            min-height: 100vh;
            padding-bottom: 120px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        /* Moving Background */
        .aurora-bg {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            z-index: -1; filter: blur(100px); opacity: 0.4;
        }
        .blob {
            position: absolute; width: 500px; height: 500px; border-radius: 50%;
            animation: move 25s infinite alternate ease-in-out;
        }
        .b1 { background: #0071e3; top: -10%; left: -10%; }
        .b2 { background: #5e5ce6; bottom: -10%; right: -10%; animation-delay: -7s; }
        
        @keyframes move { from { transform: translate(0,0) scale(1); } to { transform: translate(150px, 80px) scale(1.1); } }

        .container { width: 100%; max-width: 440px; }

        .header {
            padding: 40px 24px 20px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .user-greeting h2 { font-size: 1.6rem; font-weight: 800; letter-spacing: -1px; }
        .user-greeting p { font-size: 0.8rem; color: var(--text-dim); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

        .pfp-wrap {
            width: 55px; height: 55px; border-radius: 20px;
            background: var(--glass); border: 1px solid var(--glass-border);
            backdrop-filter: blur(20px); overflow: hidden;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }
        .pfp-wrap img { width: 100%; height: 100%; object-fit: cover; }

        /* Liquidity Card */
        .main-card {
            margin: 0 24px 30px; padding: 35px;
            background: linear-gradient(145deg, #0071e3, #0056b3);
            border-radius: 35px; color: white;
            box-shadow: 0 25px 50px rgba(0, 113, 227, 0.25);
            position: relative; overflow: hidden;
        }
        .main-card h3 { font-size: 0.75rem; text-transform: uppercase; opacity: 0.8; letter-spacing: 1.5px; position: relative; z-index: 2; }
        .main-card .balance { font-size: 3rem; font-weight: 800; margin: 10px 0 25px; letter-spacing: -2px; position: relative; z-index: 2; }

        /* Actions Grid */
        .actions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; position: relative; z-index: 5; }
        .act-btn {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 18px 5px; border-radius: 22px; text-decoration: none; color: white !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            -webkit-tap-highlight-color: transparent;
        }
        .act-btn:active { transform: scale(0.92); background: rgba(255, 255, 255, 0.3); }
        .act-btn i { font-size: 1.3rem; display: block; margin-bottom: 8px; }
        .act-btn span { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Vertical Tiers */
        .section-title { padding: 0 28px; font-weight: 800; font-size: 1.2rem; margin-bottom: 20px; }
        .vertical-list { display: flex; flex-direction: column; gap: 15px; padding: 0 24px; }

        .tier-card {
            background: var(--glass); backdrop-filter: blur(25px);
            border: 1px solid var(--glass-border); border-radius: 28px;
            padding: 22px; display: flex; align-items: center; justify-content: space-between;
            transition: 0.4s; position: relative; overflow: hidden;
        }
        .tier-card.active { border: 2.5px solid var(--primary); background: white; box-shadow: 0 15px 30px rgba(0, 113, 227, 0.1); }
        .tier-card.locked { opacity: 0.65; }

        .tier-info-left { display: flex; align-items: center; gap: 18px; }
        .tier-icon-circle { 
            width: 50px; height: 50px; border-radius: 15px; 
            background: rgba(0, 113, 227, 0.08); display: flex; 
            align-items: center; justify-content: center; font-size: 1.3rem; color: var(--primary);
        }
        .active .tier-icon-circle { background: var(--primary); color: white; }

        .tier-details .name { font-weight: 800; font-size: 1.1rem; display: block; }
        .tier-details .min { font-size: 0.75rem; color: var(--text-dim); font-weight: 600; }

        .tier-profit-right { text-align: right; }
        .profit-val { font-size: 1.3rem; font-weight: 800; color: var(--primary); display: block; }
        .status-text { font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); }
        .active .status-text { color: var(--primary); }

        /* Premium Nav Dock */
        .nav-dock {
            position: fixed; bottom: 30px; width: 92%; max-width: 410px;
            height: 85px; background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(35px) saturate(180%); border: 1px solid var(--glass-border);
            border-radius: 32px; display: flex; justify-content: space-around;
            align-items: center; box-shadow: 0 25px 50px rgba(0,0,0,0.12); z-index: 1000;
        }
        .nav-link {
            text-decoration: none; color: #a1a1a6; flex: 1;
            display: flex; flex-direction: column; align-items: center; gap: 6px;
            transition: 0.3s;
        }
        .nav-link.active { color: var(--primary); transform: translateY(-3px); }
        .nav-link i { font-size: 1.4rem; }
        .nav-link span { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }

        /* Animation */
        .slide-in { animation: fadeInUp 0.6s ease-out both; }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>

    <div class="aurora-bg">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
    </div>

    <div class="container">
        <div class="header">
            <div class="user-greeting">
                <p>System Online</p>
                <h2>Hi, <?php echo htmlspecialchars($username); ?></h2>
            </div>
            <a href="profile.php" class="pfp-wrap">
                <?php if($has_pfp): ?>
                    <img src="uploads/<?php echo $user_data['profile_pic']; ?>" alt="User">
                <?php else: ?>
                    <i class="fa-solid fa-user-shield" style="color: #d1d1d6; font-size: 1.4rem;"></i>
                <?php endif; ?>
            </a>
        </div>

        <div class="main-card slide-in">
            <h3>Available Liquidity</h3>
            <div class="balance">$<?php echo number_format($balance, 2); ?></div>
            
            <div class="actions-grid">
                <a href="deposit.php" class="act-btn">
                    <i class="fa-solid fa-bolt-lightning"></i>
                    <span>Deposit</span>
                </a>
                <a href="withdraw.php" class="act-btn">
                    <i class="fa-solid fa-money-bill-transfer"></i>
                    <span>Withdraw</span>
                </a>
                <a href="team.php" class="act-btn">
                    <i class="fa-solid fa-users-rays"></i>
                    <span>Team</span>
                </a>
            </div>
        </div>

        <div class="section-title">VIP TIERS</div>
        <div class="vertical-list">
            <?php foreach($tiers as $id => $data): 
                $is_locked = ($balance < $data['min']);
                $is_active = ($current_tier_id == $id);
            ?>
                <div class="tier-card slide-in <?php echo $is_locked ? 'locked' : ''; ?> <?php echo $is_active ? 'active' : ''; ?>" style="animation-delay: <?php echo ($id * 0.08); ?>s">
                    <div class="tier-info-left">
                        <div class="tier-icon-circle">
                            <i class="fa-solid <?php echo $data['icon']; ?>"></i>
                        </div>
                        <div class="tier-details">
                            <span class="name"><?php echo $data['name']; ?></span>
                            <span class="min">Min: $<?php echo number_format($data['min']); ?></span>
                        </div>
                    </div>
                    <div class="tier-profit-right">
                        <span class="profit-val">+<?php echo number_format($data['profit'], 2); ?>%</span>
                        <span class="status-text"><?php echo $is_active ? 'Currently Active' : ($is_locked ? 'Locked' : 'Available'); ?></span>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <nav class="nav-dock">
        <a href="dashboard.php" class="nav-link active">
            <i class="fa-solid fa-house-chimney"></i>
            <span>Home</span>
        </a>
        <a href="mining.php" class="nav-link">
            <i class="fa-solid fa-atom"></i>
            <span>Trading</span>
        </a>
        <a href="team.php" class="nav-link">
            <i class="fa-solid fa-diagram-project"></i>
            <span>Team</span>
        </a>
        <a href="profile.php" class="nav-link">
            <i class="fa-solid fa-id-badge"></i>
            <span>Profile</span>
        </a>
    </nav>

</body>
</html>
