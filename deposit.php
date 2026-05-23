<?php
require_once 'config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$user_id = $_SESSION['user_id'];
$admin_wallet = "0x153777e1127BBa3a0C7bD88CD04EC61468e2628D";
$show_success = false;
$error_msg = "";

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['amount'])) {
    $amount = floatval($_POST['amount']);
    
    if ($amount < 50) {
        $error_msg = "Minimum deposit is 50 USDT.";
    } else {
        $stmt = $conn->prepare("INSERT INTO deposits (user_id, amount, status) VALUES (?, ?, 'pending')");
        $stmt->execute([$user_id, $amount]);
        
        if ($stmt->rowCount()) {
            $show_success = true;
        } else {
            $error_msg = "Database error: Unable to process deposit.";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Recharge | VIP AI</title>
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
        body { background: #fbfbfd; font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); min-height: 100vh; display: flex; flex-direction: column; align-items: center; }

        /* Aurora Background */
        .aurora { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; filter: blur(100px); opacity: 0.4; }
        .blob { position: absolute; width: 500px; height: 500px; border-radius: 50%; animation: move 20s infinite alternate ease-in-out; }
        .b1 { background: var(--primary); top: -10%; left: -10%; }
        .b2 { background: #5e5ce6; bottom: -10%; right: -10%; animation-delay: -5s; }
        @keyframes move { from { transform: translate(0,0); } to { transform: translate(100px, 80px); } }

        .container { width: 100%; max-width: 440px; padding: 30px 24px; }

        /* Header */
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; }
        .back-link { width: 45px; height: 45px; background: var(--glass); border-radius: 15px; display: flex; align-items: center; justify-content: center; color: var(--text); border: 1px solid var(--glass-border); text-decoration: none; }

        /* Main Card */
        .deposit-card {
            background: var(--glass); backdrop-filter: blur(30px);
            border: 1px solid var(--glass-border); border-radius: 35px;
            padding: 30px 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.05);
            text-align: center; animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .qr-wrap {
            width: 180px; height: 180px; margin: 0 auto 25px;
            padding: 15px; background: #fff; border-radius: 30px;
            box-shadow: 0 10px 30px rgba(0, 113, 227, 0.1);
        }
        .qr-wrap img { width: 100%; border-radius: 15px; }

        .address-box {
            background: rgba(0,0,0,0.03); border: 1px dashed var(--primary);
            padding: 15px; border-radius: 20px; margin-bottom: 25px;
            cursor: pointer; position: relative; text-align: left;
        }
        .address-box small { display: block; font-size: 0.65rem; font-weight: 800; color: var(--primary); text-transform: uppercase; margin-bottom: 4px; }
        .address-box span { font-size: 0.75rem; font-weight: 700; word-break: break-all; color: var(--text); padding-right: 30px; display: block; }
        .address-box i { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: var(--primary); }

        /* Form Styling */
        .input-group { text-align: left; margin-bottom: 25px; }
        .input-group label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; margin-left: 5px; margin-bottom: 8px; }
        .field-wrapper { position: relative; }
        .field-wrapper i { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--primary); }
        .input-field {
            width: 100%; padding: 18px 18px 18px 45px; border-radius: 20px;
            border: 1px solid var(--glass-border); background: rgba(255,255,255,0.5);
            font-family: inherit; font-size: 1rem; font-weight: 700; outline: none; transition: 0.3s;
        }
        .input-field:focus { border-color: var(--primary); background: #fff; box-shadow: 0 10px 20px rgba(0, 113, 227, 0.05); }

        .btn-confirm {
            width: 100%; background: var(--primary); color: #fff; border: none;
            padding: 22px; border-radius: 22px; font-weight: 800; font-size: 1rem;
            box-shadow: 0 15px 30px rgba(0, 113, 227, 0.3); cursor: pointer; transition: 0.2s;
            margin-top: 10px;
        }
        .btn-confirm:active { transform: scale(0.96); }

        /* Guidelines */
        .guide-card {
            margin-top: 25px; background: #1d1d1f; border-radius: 28px; padding: 20px;
            display: flex; gap: 15px; color: white;
        }
        .guide-card p { font-size: 0.7rem; opacity: 0.8; line-height: 1.6; font-weight: 500; }
        .guide-card b { color: var(--primary); }
    </style>
</head>
<body>

    <div class="aurora"><div class="blob b1"></div><div class="blob b2"></div></div>

    <div class="container">
        <div class="header">
            <a href="dashboard.php" class="back-link"><i class="fa-solid fa-chevron-left"></i></a>
            <h2 style="font-weight: 800; font-size: 1.2rem; letter-spacing: -0.5px;">Recharge Assets</h2>
            <div style="width:45px;"></div>
        </div>

        <div class="deposit-card">
            <div class="qr-wrap">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=<?php echo $admin_wallet; ?>" alt="QR">
            </div>

            <div class="address-box" onclick="copyAddr()">
                <small>USDT BEP20 (BSC Network)</small>
                <span id="walletAddr"><?php echo $admin_wallet; ?></span>
                <i class="fa-solid fa-copy"></i>
            </div>

            <form method="POST">
                <div class="input-group">
                    <label>Amount to Recharge</label>
                    <div class="field-wrapper">
                        <i class="fa-solid fa-dollar-sign"></i>
                        <input type="number" name="amount" id="amountInput" class="input-field" placeholder="50.00" required step="0.01">
                    </div>
                </div>

                <button type="submit" class="btn-confirm">Recharge Completed</button>
            </form>
        </div>

        <div class="guide-card">
            <i class="fa-solid fa-circle-info" style="color:var(--primary); font-size: 1.1rem;"></i>
            <div>
                <p>• Transfer <b>USDT (BEP20)</b> only. Other tokens will be lost.</p>
                <p>• Verification time: <b>2-4 hours</b> typically.</p>
                <p>• Minimum amount: <b>50 USDT</b>.</p>
            </div>
        </div>
    </div>

    <script>
        function copyAddr() {
            const txt = document.getElementById('walletAddr').innerText;
            navigator.clipboard.writeText(txt).then(() => {
                alert("Address Copied! Use BEP20 network only.");
            });
        }

        <?php if($show_success): ?>
            alert("Protocol Initiated! Funds will appear in 2-4 hours.");
            window.location.href = "dashboard.php";
        <?php elseif(!empty($error_msg)): ?>
            alert("Error: <?php echo $error_msg; ?>");
        <?php endif; ?>
    </script>

</body>
</html>
