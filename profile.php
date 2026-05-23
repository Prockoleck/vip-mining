<?php
require_once 'config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$user_id = $_SESSION['user_id'];

// Fetch user data - including total_recharge to determine Tier
$stmt = $conn->prepare("SELECT username, balance, total_recharge, profile_pic FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

$has_pfp = !empty($user['profile_pic']) && file_exists("uploads/" . $user['profile_pic']);

// --- 7-TIER DEPOSIT LOGIC ---
$recharge = $user['total_recharge'];
if ($recharge >= 10000) {
    $vip_tier = "Legendary";
    $vip_color = "linear-gradient(135deg, #ff0000, #4b0082)"; // Deep Red to Indigo
    $tier_icon = "fa-dragon";
} elseif ($recharge >= 5000) {
    $vip_tier = "Elite";
    $vip_color = "linear-gradient(135deg, #00f2fe, #4facfe)"; // Electric Blue
    $tier_icon = "fa-bolt";
} elseif ($recharge >= 1200) {
    $vip_tier = "Diamond";
    $vip_color = "linear-gradient(135deg, #e0c3fc, #8ec5fc)"; // Soft Purple/Blue
    $tier_icon = "fa-gem";
} elseif ($recharge >= 600) {
    $vip_tier = "Platinum";
    $vip_color = "linear-gradient(135deg, #e6e9f0, #eef1f5)"; // Bright Silver/White
    $vip_text = "#1d1d1f"; // Dark text for light background
    $tier_icon = "fa-shield-halved";
} elseif ($recharge >= 300) {
    $vip_tier = "Gold";
    $vip_color = "linear-gradient(135deg, #f6d365, #fda085)"; // Warm Gold
    $tier_icon = "fa-crown";
} elseif ($recharge >= 100) {
    $vip_tier = "Silver";
    $vip_color = "linear-gradient(135deg, #bdc3c7, #2c3e50)"; // Metallic Silver
    $tier_icon = "fa-medal";
} elseif ($recharge >= 50) {
    $vip_tier = "Bronze";
    $vip_color = "linear-gradient(135deg, #a87932, #52361b)"; // Bronze Brown
    $tier_icon = "fa-award";
} else {
    $vip_tier = "Newbie";
    $vip_color = "linear-gradient(135deg, #8e8e93, #636366)"; // Gray
    $tier_icon = "fa-user";
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Profile Terminal | VIP AI</title>
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
            color: var(--text-main); padding-bottom: 120px; display: flex; flex-direction: column; align-items: center;
            overflow-x: hidden;
        }

        /* --- Aurora Background --- */
        .aurora { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; filter: blur(100px); opacity: 0.4; }
        .blob { position: absolute; width: 500px; height: 500px; border-radius: 50%; animation: move 20s infinite alternate ease-in-out; }
        .b1 { background: var(--primary); top: -10%; left: -10%; }
        .b2 { background: #5e5ce6; bottom: -10%; right: -10%; animation-delay: -5s; }
        @keyframes move { from { transform: translate(0,0); } to { transform: translate(120px, 80px); } }

        .container { width: 100%; max-width: 440px; padding: 40px 24px; }

        /* --- Profile Card --- */
        .profile-card {
            background: var(--glass); backdrop-filter: blur(30px);
            border: 1px solid var(--glass-border); border-radius: 40px;
            padding: 40px 24px; text-align: center;
            box-shadow: 0 30px 60px rgba(0,0,0,0.06);
            margin-bottom: 25px;
            animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pfp-outer { position: relative; width: 130px; height: 130px; margin: 0 auto 20px; }
        .pfp-frame {
            width: 100%; height: 100%; border-radius: 45px;
            background: #fff; border: 2px solid var(--glass-border);
            padding: 5px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.08);
        }
        .pfp-frame img { width: 100%; height: 100%; object-fit: cover; border-radius: 40px; }
        .default-avatar { font-size: 4rem; color: #d1d1d6; margin-top: 25px; display: block; }

        .edit-pfp {
            position: absolute; bottom: -5px; right: -5px;
            background: var(--primary); color: white; width: 42px; height: 42px;
            border-radius: 15px; display: flex; align-items: center; justify-content: center;
            border: 4px solid #fff; cursor: pointer; box-shadow: 0 10px 20px rgba(0,113,227,0.2);
        }

        .user-name { font-size: 1.8rem; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }

        /* --- Fancy VIP Badge --- */
        .vip-badge {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 8px 20px; border-radius: 100px;
            background: <?php echo $vip_color; ?>;
            color: <?php echo isset($vip_text) ? $vip_text : 'white'; ?>; 
            font-size: 0.75rem; font-weight: 800;
            text-transform: uppercase; letter-spacing: 1.5px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            position: relative; overflow: hidden;
            animation: fadeIn 1s ease-out 0.4s both;
        }
        .vip-badge::after {
            content: ''; position: absolute; top: -50%; left: -50%;
            width: 200%; height: 200%; background: linear-gradient(60deg, transparent, rgba(255,255,255,0.4), transparent);
            transform: rotate(45deg); animation: shimmer 2.5s infinite;
        }
        @keyframes shimmer { 0% { left: -150%; } 100% { left: 150%; } }

        #uploadSubmit {
            margin: 20px auto 0; display: none; background: #34c759; color: white;
            border: none; padding: 10px 25px; border-radius: 15px; font-weight: 800;
            font-size: 0.8rem; cursor: pointer; animation: fadeIn 0.5s;
        }

        /* --- Quick Actions --- */
        .action-grid { 
            display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 25px;
            animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }
        .action-card {
            background: var(--glass); backdrop-filter: blur(20px);
            padding: 25px; border-radius: 30px; text-decoration: none;
            text-align: center; border: 1px solid var(--glass-border);
            transition: 0.3s;
        }
        .action-card:active { transform: scale(0.95); }
        .action-card i { font-size: 1.8rem; color: var(--primary); display: block; margin-bottom: 10px; }
        .action-card span { font-weight: 800; font-size: 0.9rem; color: var(--text-main); }

        /* --- Menu List --- */
        .menu-list {
            background: var(--glass); backdrop-filter: blur(20px);
            border-radius: 30px; border: 1px solid var(--glass-border);
            overflow: hidden; 
            animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }
        .menu-item {
            display: flex; align-items: center; padding: 22px 25px;
            text-decoration: none; color: var(--text-main);
            border-bottom: 1px solid rgba(0,0,0,0.03); transition: 0.2s;
        }
        .menu-item:active { background: rgba(0,0,0,0.02); }
        .menu-item i:first-child { width: 35px; font-size: 1.2rem; color: var(--primary); }
        .menu-item span { flex: 1; font-weight: 700; font-size: 0.95rem; }
        .menu-item i:last-child { font-size: 0.8rem; color: var(--text-dim); }

        /* --- Nav Dock --- */
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

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    </style>
</head>
<body>

<div class="aurora"><div class="blob b1"></div><div class="blob b2"></div></div>

<div class="container">
    <div class="profile-card">
        <form action="upload_pfp.php" method="POST" enctype="multipart/form-data">
            <div class="pfp-outer">
                <div class="pfp-frame">
                    <?php if($has_pfp): ?>
                        <img src="uploads/<?php echo $user['profile_pic']; ?>" id="pfpPreview">
                    <?php else: ?>
                        <i class="fa-solid fa-user-gear default-avatar" id="pfpIcon"></i>
                        <img src="" id="pfpPreview" style="display:none;">
                    <?php endif; ?>
                </div>
                <label for="pfpInput" class="edit-pfp"><i class="fa-solid fa-camera"></i></label>
                <input type="file" name="profile_image" id="pfpInput" accept="image/*" onchange="previewImage(event)" style="display:none;">
            </div>
            <button type="submit" id="uploadSubmit">APPLY CHANGES</button>
        </form>

        <h1 class="user-name"><?php echo htmlspecialchars($user['username']); ?></h1>
        
        <div class="vip-badge">
            <i class="fa-solid <?php echo $tier_icon; ?>"></i>
            <span><?php echo $vip_tier; ?> Member</span>
        </div>
        
    </div>

    <div class="action-grid">
        <a href="deposit.php" class="action-card">
            <i class="fa-solid fa-circle-arrow-up"></i>
            <span>Deposit</span>
        </a>
        <a href="withdraw.php" class="action-card">
            <i class="fa-solid fa-circle-arrow-down"></i>
            <span>Withdraw</span>
        </a>
    </div>

    <div class="menu-list">
        <a href="deposit_history.php" class="menu-item">
            <i class="fa-solid fa-receipt"></i>
            <span>Deposit Logs</span>
            <i class="fa-solid fa-chevron-right"></i>
        </a>
        <a href="withdraw_history.php" class="menu-item">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span>Withdrawal Logs</span>
            <i class="fa-solid fa-chevron-right"></i>
        </a>
        <a href="logout.php" class="menu-item" style="border-bottom:none;">
            <i class="fa-solid fa-power-off" style="color:#ff3b30;"></i>
            <span style="color:#ff3b30;">Logout Account</span>
            <i class="fa-solid fa-chevron-right"></i>
        </a>
    </div>
</div>

<nav class="nav-dock">
    <a href="dashboard.php" class="nav-link"><i class="fa-solid fa-house-chimney"></i><span>Home</span></a>
    <a href="mining.php" class="nav-link"><i class="fa-solid fa-atom"></i><span>Trading</span></a>
    <a href="team.php" class="nav-link"><i class="fa-solid fa-diagram-project"></i><span>Team</span></a>
    <a href="profile.php" class="nav-link active"><i class="fa-solid fa-id-badge"></i><span>Profile</span></a>
</nav>

<script>
    function previewImage(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function() {
                const img = document.getElementById('pfpPreview');
                const icon = document.getElementById('pfpIcon');
                if(icon) icon.style.display = 'none';
                img.src = reader.result;
                img.style.display = 'block';
                document.getElementById('uploadSubmit').style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    }
</script>

</body>
</html>
