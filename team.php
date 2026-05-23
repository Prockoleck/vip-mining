<?php
require_once 'config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$user_id = $_SESSION['user_id'];

// Fetch the actual referral code
$user_query = $conn->query("SELECT referral_code, balance FROM users WHERE id = $user_id");
$user_data = $user_query->fetch();
$my_ref_code = $user_data['referral_code'];
$my_balance = $user_data['balance'];

$invite_link = "https://vip-ai-mining.unaux.com/index.php?ref=" . $my_ref_code;

// --- Commission Logic (5%, 3%, 1%, and Flat $0.25 for Lvl 4) ---
$lvl1_res = $conn->query("SELECT id, username, total_recharge, created_at FROM users WHERE referrer_id = $user_id");
$lvl1_data = $lvl1_res->fetchAll();
$lvl1_count = count($lvl1_data);

$total_comm = 0;
foreach($lvl1_data as $u) { $total_comm += ($u['total_recharge'] * 0.05); }

$lvl2_count = 0;
$lvl3_count = 0;
$lvl4_count = 0;
$lvl2_ids = [];
$lvl3_ids = [];

if ($lvl1_count > 0) {
    $lvl1_ids = array_column($lvl1_data, 'id');
    $ids_string = implode(',', $lvl1_ids);
    
    // Level 2
    $lvl2_res = $conn->query("SELECT id, total_recharge FROM users WHERE referrer_id IN ($ids_string)");
    while($row = $lvl2_res->fetch()) {
        $lvl2_count++;
        $total_comm += ($row['total_recharge'] * 0.03);
        $lvl2_ids[] = $row['id'];
    }

    // Level 3
    if (!empty($lvl2_ids)) {
        $ids_string_2 = implode(',', $lvl2_ids);
        $lvl3_res = $conn->query("SELECT id, total_recharge FROM users WHERE referrer_id IN ($ids_string_2)");
        while($row = $lvl3_res->fetch()) {
            $lvl3_count++;
            $total_comm += ($row['total_recharge'] * 0.01);
            $lvl3_ids[] = $row['id'];
        }
    }

    // Level 4 - Flat $0.25 Reward logic
    if (!empty($lvl3_ids)) {
        $ids_string_3 = implode(',', $lvl3_ids);
        $lvl4_res = $conn->query("SELECT id FROM users WHERE referrer_id IN ($ids_string_3)");
        while($row = $lvl4_res->fetch()) {
            $lvl4_count++;
            $total_comm += 0.25; // Flat reward regardless of deposit
        }
    }
}

$total_team = $lvl1_count + $lvl2_count + $lvl3_count + $lvl4_count;
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Network Terminal | VIP AI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0071e3;
            --glass: rgba(255, 255, 255, 0.7);
            --glass-border: rgba(255, 255, 255, 0.8);
            --text-main: #1d1d1f;
            --text-dim: #86868b;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        body { 
            background: #fbfbfd; font-family: 'Plus Jakarta Sans', sans-serif; 
            color: var(--text-main); padding-bottom: 140px; display: flex; flex-direction: column; align-items: center;
            overflow-x: hidden;
        }

        /* --- Animated Aurora Background --- */
        .aurora { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; filter: blur(100px); opacity: 0.4; }
        .blob { position: absolute; width: 500px; height: 500px; border-radius: 50%; animation: move 20s infinite alternate ease-in-out; }
        .b1 { background: var(--primary); top: -10%; left: -10%; }
        .b2 { background: #5e5ce6; bottom: -10%; right: -10%; animation-delay: -5s; }
        @keyframes move { from { transform: translate(0,0); } to { transform: translate(120px, 80px); } }

        .container { width: 100%; max-width: 440px; padding: 40px 24px; }

        /* --- Entry Animations --- */
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .anim-1 { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-2 { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .anim-3 { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .anim-4 { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
        .anim-5 { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both; }
        .anim-6 { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both; }
        .anim-7 { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both; }

        /* --- UI Components --- */
        .network-hero { text-align: center; margin-bottom: 30px; }
        .network-hero p { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-dim); }
        .network-hero h1 { font-size: 3rem; font-weight: 800; letter-spacing: -2px; color: var(--primary); }

        .comm-card {
            background: linear-gradient(135deg, #1d1d1f, #3a3a3c);
            padding: 30px; border-radius: 35px; color: white;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15); margin-bottom: 30px;
            position: relative; overflow: hidden;
        }
        .comm-card h4 { font-size: 0.7rem; text-transform: uppercase; opacity: 0.7; letter-spacing: 1px; }
        .comm-card .amount { font-size: 2.2rem; font-weight: 800; margin: 8px 0; }
        .comm-card .subtext { font-size: 0.75rem; opacity: 0.6; font-weight: 600; }

        .ref-box {
            background: var(--glass); backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border); border-radius: 25px;
            padding: 20px; margin-bottom: 30px;
        }
        .ref-box label { font-size: 0.65rem; font-weight: 800; color: var(--primary); text-transform: uppercase; display: block; margin-bottom: 10px; }
        .copy-area { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.03); padding: 12px 16px; border-radius: 15px; }
        .copy-area span { font-size: 0.8rem; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%; }
        .copy-trigger { background: var(--primary); color: white; font-size: 0.7rem; font-weight: 800; padding: 8px 14px; border-radius: 10px; cursor: pointer; }

        .level-stack { display: flex; flex-direction: column; gap: 16px; }
        .level-row {
            background: var(--glass); backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border); border-radius: 28px;
            padding: 22px; display: flex; align-items: center; justify-content: space-between;
            transition: 0.3s;
        }
        .level-row:hover { transform: translateY(-5px); background: white; }
        
        .lvl-info { display: flex; align-items: center; gap: 15px; }
        .lvl-icon { width: 45px; height: 45px; border-radius: 14px; background: rgba(0,113,227,0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
        .lvl-text b { display: block; font-size: 1rem; font-weight: 800; }
        .lvl-text span { font-size: 0.7rem; font-weight: 700; color: var(--text-dim); }

        .lvl-badge { background: #34c759; color: white; font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 8px; }

        /* --- Navigation --- */
        .nav-dock {
            position: fixed; bottom: 30px; width: 92%; max-width: 410px;
            height: 85px; background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(35px) saturate(180%); border: 1px solid var(--glass-border);
            border-radius: 32px; display: flex; justify-content: space-around; align-items: center;
            box-shadow: 0 25px 50px rgba(0,0,0,0.12); z-index: 1000;
        }
        .nav-link { text-decoration: none; color: #a1a1a6; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .nav-link.active { color: var(--primary); }
        .nav-link i { font-size: 1.4rem; }
        .nav-link span { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }
    </style>
</head>
<body>

    <div class="aurora"><div class="blob b1"></div><div class="blob b2"></div></div>

    <div class="container">
        <div class="network-hero anim-1">
            <p>Total Nodes in Empire</p>
            <h1><?php echo $total_team; ?></h1>
        </div>

        <div class="comm-card anim-2">
            <h4>Total Network Revenue</h4>
            <div class="amount">$<?php echo number_format($total_comm, 2); ?></div>
            <div class="subtext">Aquired commission added to balance</div>
        </div>

        <div class="ref-box anim-3">
            <label>Invitation Protocol</label>
            <div class="copy-area" onclick="copyRef()">
                <span id="refLink"><?php echo $invite_link; ?></span>
                <div class="copy-trigger">COPY LINK</div>
            </div>
        </div>

        <div class="level-stack">
            <div class="level-row anim-4">
                <div class="lvl-info">
                    <div class="lvl-icon"><i class="fa-solid fa-users"></i></div>
                    <div class="lvl-text">
                        <b>Level 1 Members</b>
                        <span><?php echo $lvl1_count; ?> Direct Partners</span>
                    </div>
                </div>
                <div class="lvl-badge">5% REWARD</div>
            </div>

            <div class="level-row anim-5">
                <div class="lvl-info">
                    <div class="lvl-icon"><i class="fa-solid fa-network-wired"></i></div>
                    <div class="lvl-text">
                        <b>Level 2 Members</b>
                        <span><?php echo $lvl2_count; ?> Secondary Partners</span>
                    </div>
                </div>
                <div class="lvl-badge">3% REWARD</div>
            </div>

            <div class="level-row anim-6">
                <div class="lvl-info">
                    <div class="lvl-icon"><i class="fa-solid fa-sitemap"></i></div>
                    <div class="lvl-text">
                        <b>Level 3 Members</b>
                        <span><?php echo $lvl3_count; ?> Ternary Partners</span>
                    </div>
                </div>
                <div class="lvl-badge">1% REWARD</div>
            </div>

            <div class="level-row anim-7">
                <div class="lvl-info">
                    <div class="lvl-icon"><i class="fa-solid fa-diagram-project"></i></div>
                    <div class="lvl-text">
                        <b>Level 4 Members</b>
                        <span><?php echo $lvl4_count; ?> Quaternary Partners</span>
                    </div>
                </div>
                <div class="lvl-badge">$0.25 FLAT</div>
            </div>
        </div>
    </div>

    <nav class="nav-dock">
        <a href="dashboard.php" class="nav-link"><i class="fa-solid fa-house-chimney"></i><span>Home</span></a>
        <a href="mining.php" class="nav-link"><i class="fa-solid fa-atom"></i><span>Trading</span></a>
        <a href="team.php" class="nav-link active"><i class="fa-solid fa-diagram-project"></i><span>Team</span></a>
        <a href="profile.php" class="nav-link"><i class="fa-solid fa-id-badge"></i><span>Profile</span></a>
    </nav>

    <script>
    function copyRef() {
        const text = document.getElementById('refLink').innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert("Partner link secured to clipboard.");
        });
    }
    </script>

</body>
</html>
