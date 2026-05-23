<?php
require_once 'config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$user_id = $_SESSION['user_id'];

/**
 * Tier Configurations updated to match your new scale:
 * 100=2%, 200=2.25%, 300=2.5%, 400=3%, 500=3.5%, 1k=4%, 3k=5%, 5k=6%, 10k=7%
 */
$tiers = [
    9 => ['name' => 'Legendary', 'min' => 10000, 'profit' => 7.0,  'color' => '#ff3b30', 'glow' => 'rgba(255, 59, 48, 0.2)'],
    8 => ['name' => 'Immortal',  'min' => 5000,  'profit' => 6.0,  'color' => '#ff9500', 'glow' => 'rgba(255, 149, 0, 0.2)'],
    7 => ['name' => 'Elite Plus', 'min' => 3000,  'profit' => 5.0,  'color' => '#af52de', 'glow' => 'rgba(175, 82, 222, 0.2)'],
    6 => ['name' => 'Elite',      'min' => 1000,  'profit' => 4.0,  'color' => '#5856d6', 'glow' => 'rgba(88, 86, 214, 0.2)'],
    5 => ['name' => 'Diamond',    'min' => 500,   'profit' => 3.5,  'color' => '#0071e3', 'glow' => 'rgba(0, 113, 227, 0.2)'],
    4 => ['name' => 'Platinum',   'min' => 400,   'profit' => 3.0,  'color' => '#34c759', 'glow' => 'rgba(52, 199, 89, 0.2)'],
    3 => ['name' => 'Gold',       'min' => 300,   'profit' => 2.5,  'color' => '#ffcc00', 'glow' => 'rgba(255, 204, 0, 0.2)'],
    2 => ['name' => 'Silver',     'min' => 200,   'profit' => 2.25, 'color' => '#8e8e93', 'glow' => 'rgba(142, 142, 147, 0.2)'],
    1 => ['name' => 'Bronze',     'min' => 100,   'profit' => 2.0,  'color' => '#a2845e', 'glow' => 'rgba(162, 132, 94, 0.2)']
];

// Fetch User Data
$stmt = $conn->prepare("SELECT balance, total_recharge, last_mining_time FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

$recharge = (float)$user['total_recharge'];
$theme = ['name' => 'Unranked', 'color' => '#666', 'glow' => 'rgba(0,0,0,0.1)', 'profit' => 0];

// Dynamic Theme Selection
foreach ($tiers as $data) {
    if ($recharge >= $data['min']) {
        $theme = $data;
        break; 
    }
}

// Cooldown Logic
$can_mine = true;
$seconds_left = 0;
if ($user['last_mining_time']) {
    $diff = time() - strtotime($user['last_mining_time']);
    if ($diff < 86400) {
        $can_mine = false;
        $seconds_left = 86400 - $diff;
    }
}

// Updated low balance check to $100 to match your new minimum tier
$low_balance = ($recharge < 100);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Quantum Node | <?php echo $theme['name']; ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: <?php echo $theme['color']; ?>;
            --accent-glow: <?php echo $theme['glow']; ?>;
            --glass: rgba(255, 255, 255, 0.85);
            --border: rgba(255, 255, 255, 0.5);
            --text: #1d1d1f;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        body { 
            background: #fbfbfd; font-family: 'Plus Jakarta Sans', sans-serif; 
            color: var(--text); min-height: 100vh; display: flex; flex-direction: column; align-items: center;
            padding-bottom: 140px; overflow-x: hidden;
        }

        .page-reveal {
            animation: reveal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            opacity: 0; transform: translateY(20px) scale(0.98);
        }
        @keyframes reveal { to { opacity: 1; transform: translateY(0) scale(1); } }

        .container { width: 100%; max-width: 430px; padding: 40px 20px; }

        .tier-card {
            background: var(--glass); backdrop-filter: blur(30px);
            border-radius: 32px; padding: 22px; margin-bottom: 25px;
            border: 1px solid var(--border); display: flex; align-items: center; gap: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.03);
        }
        .tier-icon { 
            width: 54px; height: 54px; background: var(--primary); border-radius: 18px;
            display: flex; align-items: center; justify-content: center; color: white; font-size: 1.6rem;
            box-shadow: 0 8px 25px var(--accent-glow);
        }

        .engine-card {
            background: var(--glass); backdrop-filter: blur(40px);
            border-radius: 48px; padding: 50px 24px 45px; text-align: center;
            border: 1px solid var(--border); box-shadow: 0 45px 90px rgba(0,0,0,0.06);
            position: relative;
        }

        .orb-outer {
            width: 220px; height: 220px; margin: 0 auto 35px; position: relative;
            display: flex; align-items: center; justify-content: center;
        }
        .scanner-ring {
            position: absolute; inset: -10px; border: 2px solid transparent;
            border-top-color: var(--primary); border-radius: 50%;
            transition: 0.5s; opacity: 0;
        }
        .orb-active .scanner-ring { opacity: 1; animation: spin 3s linear infinite; }
        
        .core-sphere {
            width: 170px; height: 170px; border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), #1d1d1f);
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 4rem; position: relative; z-index: 2;
            box-shadow: 0 25px 60px var(--accent-glow);
        }

        .status-msg { font-family: monospace; font-size: 0.85rem; color: var(--primary); font-weight: 700; margin: 25px 0; min-height: 20px; letter-spacing: 0.5px; }
        .timer-val { font-size: 3.4rem; font-weight: 800; letter-spacing: -3px; margin: 10px 0; color: #1d1d1f; }

        .mine-btn {
            background: var(--primary); color: white; border: none; width: 100%;
            padding: 24px; border-radius: 28px; font-weight: 800; font-size: 1.1rem;
            cursor: pointer; box-shadow: 0 18px 40px var(--accent-glow);
            transition: 0.3s;
        }
        .mine-btn:active { transform: scale(0.96); opacity: 0.9; }

        .nav-dock {
            position: fixed; bottom: 30px; width: 92%; max-width: 410px;
            height: 85px; background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(35px) saturate(180%); border: 1px solid var(--border);
            border-radius: 32px; display: flex; justify-content: space-around; align-items: center;
            box-shadow: 0 25px 50px rgba(0,0,0,0.12); z-index: 1000;
        }
        .nav-link { text-decoration: none; color: #a1a1a6; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .nav-link.active { color: #0071e3; }
        .nav-link i { font-size: 1.4rem; }
        .nav-link span { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    </style>
</head>
<body>

<div class="container page-reveal">
    <div class="tier-card">
        <div class="tier-icon"><i class="fa-solid fa-crown"></i></div>
        <div style="text-align: left;">
            <p style="font-size: 0.65rem; font-weight: 800; opacity: 0.5; letter-spacing: 1px;">CURRENT NODE</p>
            <h3 style="font-weight: 800; font-size: 1.2rem;"><?php echo strtoupper($theme['name']); ?></h3>
        </div>
        <div style="margin-left: auto; text-align: right;">
            <p style="font-size: 0.65rem; font-weight: 800; opacity: 0.5; letter-spacing: 1px;">PROFIT RATE</p>
            <h3 style="color: var(--primary); font-weight: 800; font-size: 1.2rem;"><?php echo $theme['profit']; ?>%</h3>
        </div>
    </div>

    <div class="engine-card">
        <div class="orb-outer <?php echo !$can_mine ? 'orb-active' : ''; ?>" id="orb">
            <div class="scanner-ring"></div>
            <div class="core-sphere"><i class="fa-solid fa-atom" id="coreIcon"></i></div>
        </div>

        <div id="logStatus" class="status-msg">
            <?php 
                if($low_balance) echo '> INSUFFICIENT COLLATERAL (MIN $100)';
                else echo $can_mine ? '> SYSTEM READY' : '> NODE COOLDOWN'; 
            ?>
        </div>

        <div id="timerDisplay" class="timer-val" style="<?php echo $can_mine ? 'display:none;' : 'display:block;'; ?>">
            <?php echo $low_balance ? '---' : '00:00:00'; ?>
        </div>

        <?php if($can_mine && !$low_balance): ?>
            <button id="mineBtn" class="mine-btn" onclick="startSequence()">TRADE <?php echo strtoupper($theme['name']); ?> CYCLE</button>
        <?php endif; ?>
    </div>
</div>

<nav class="nav-dock">
    <a href="dashboard.php" class="nav-link"><i class="fa-solid fa-house-chimney"></i><span>Home</span></a>
    <a href="mining.php" class="nav-link active"><i class="fa-solid fa-atom"></i><span>Trading</span></a>
    <a href="team.php" class="nav-link"><i class="fa-solid fa-diagram-project"></i><span>Team</span></a>
    <a href="profile.php" class="nav-link"><i class="fa-solid fa-id-badge"></i><span>Profile</span></a>
</nav>

<script>
    let timeLeft = <?php echo $seconds_left; ?>;
    if(timeLeft > 0) runCooldown();

    function startSequence() {
        const btn = document.getElementById('mineBtn');
        const logs = document.getElementById('logStatus');
        const orb = document.getElementById('orb');
        const icon = document.getElementById('coreIcon');

        btn.style.display = 'none';
        orb.classList.add('orb-active');
        icon.classList.add('fa-spin');

        const logPoints = [
            { time: 0, msg: "> CONNECTING TO GLOBAL NODES..." },
            { time: 2, msg: "> ALLOCATING COMPUTATIONAL POWER..." },
            { time: 4, msg: "> DECRYPTING BLOCKCHAIN PACKETS..." },
            { time: 6, msg: "> SYNCHRONIZING PROFIT LEDGER..." },
            { time: 8, msg: "> AUTHORIZING TRANSACTION..." }
        ];

        logPoints.forEach(pt => {
            setTimeout(() => { logs.innerText = pt.msg; }, pt.time * 1000);
        });

        setTimeout(() => {
            fetch('process_mining.php')
            .then(res => res.json())
            .then(data => {
                if(data.status === 'success') {
                    logs.innerText = "> PROFIT ADDED: $" + data.earned;
                    alert("Cycle Complete: $" + data.earned + " added via Compounding.");
                    location.reload();
                } else {
                    alert(data.message);
                    location.reload();
                }
            })
            .catch(err => alert("Error: Make sure process_mining.php is in the same folder."));
        }, 10000);
    }

    function runCooldown() {
        const display = document.getElementById('timerDisplay');
        const interval = setInterval(() => {
            if(timeLeft <= 0) { clearInterval(interval); location.reload(); }
            let h = Math.floor(timeLeft / 3600).toString().padStart(2, '0');
            let m = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0');
            let s = (timeLeft % 60).toString().padStart(2, '0');
            display.innerText = `${h}:${m}:${s}`;
            timeLeft--;
        }, 1000);
    }
</script>
</body>
</html>
