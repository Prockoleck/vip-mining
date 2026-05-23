<?php
require_once 'config.php';
session_start();

$error = "";
$success = "";

// Capture Referral Code from URL
$ref_from_url = "";
if (isset($_GET['ref'])) {
    $ref_from_url = $_GET['ref'];
}

// Handle Signup/Login logic remains the same...
if (isset($_POST['signup'])) {
    $user = $_POST['username'];
    $pass = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $applied_ref = $_POST['referrer_code'];
    $new_ref_code = substr(md5(uniqid()), 0, 8); 

    $check = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $check->execute([$user]);
    if ($check->rowCount() > 0) {
        $error = "Username already taken!";
    } else {
        $referrer_id = 0;
        if (!empty($applied_ref)) {
            $ref_check = $conn->prepare("SELECT id FROM users WHERE referral_code = ?");
            $ref_check->execute([$applied_ref]);
            if ($ref_check->rowCount() > 0) {
                $ref_row = $ref_check->fetch();
                $referrer_id = $ref_row['id'];
            }
        }
        $sql = "INSERT INTO users (username, password, referral_code, referrer_id, balance, total_recharge) 
                VALUES (?, ?, ?, ?, 0.00, 0.00)";
        $stmt = $conn->prepare($sql);
        if ($stmt->execute([$user, $pass, $new_ref_code, $referrer_id])) {
            session_unset();
            session_destroy();
            session_start();
            $_SESSION['user'] = $user;
            $_SESSION['user_id'] = $conn->lastInsertId();
            header("Location: dashboard.php");
            exit();
        } else { $error = "System Error."; }
    }
}

if (isset($_POST['login'])) {
    $user = $_POST['username'];
    $pass = $_POST['password'];
    $result = $conn->prepare("SELECT * FROM users WHERE username = ?");
    $result->execute([$user]);
    if ($result->rowCount() > 0) {
        $row = $result->fetch();
        if (password_verify($pass, $row['password'])) {
            $_SESSION['user'] = $user;
            $_SESSION['user_id'] = $row['id'];
            header("Location: dashboard.php");
            exit();
        } else { $error = "Invalid Password!"; }
    } else { $error = "User not found!"; }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>VIP AI Mining | Secure Node</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        /* APPLE "AURORA" THEME V2.0 
           Fixed Alignment & Dynamic Blurred Background
        */
        :root {
            --apple-blue: #0071e3;
            --apple-glow: rgba(0, 113, 227, 0.4);
            --glass: rgba(255, 255, 255, 0.6);
            --text: #1d1d1f;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }

        body {
            background: #ffffff;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: var(--text);
            height: 100vh;
            width: 100vw;
            display: flex;
            justify-content: center; /* ALIGN CENTER HORIZONTAL */
            align-items: center;    /* ALIGN CENTER VERTICAL */
            overflow: hidden;
            position: relative;
        }

        /* DYNAMIC BLURRED CIRCLES BACKGROUND */
        .aurora-container {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            z-index: -1;
            background: #fbfbfd;
            filter: blur(80px);
        }

        .blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(60px);
            opacity: 0.4;
            animation: move 20s infinite alternate ease-in-out;
        }

        .blob-1 { width: 400px; height: 400px; background: #0071e3; top: -100px; left: -100px; }
        .blob-2 { width: 500px; height: 500px; background: #5e5ce6; bottom: -150px; right: -150px; animation-delay: -5s; }
        .blob-3 { width: 300px; height: 300px; background: #64d2ff; top: 40%; left: 30%; animation-duration: 25s; }

        @keyframes move {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(100px, 50px) scale(1.2); }
        }

        /* CENTERED FORM CONTAINER */
        .auth-container {
            width: 92%;
            max-width: 420px;
            background: var(--glass);
            backdrop-filter: blur(30px) saturate(200%);
            -webkit-backdrop-filter: blur(30px) saturate(200%);
            border: 1px solid rgba(255, 255, 255, 0.7);
            border-radius: 32px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.04);
            text-align: center;
            z-index: 10;
        }

        .logo h1 { font-size: 2rem; font-weight: 800; letter-spacing: -1.5px; margin-bottom: 5px; }
        .logo p { color: #86868b; font-size: 0.9rem; font-weight: 600; margin-bottom: 35px; }

        /* BEAUTIFUL FIELDS */
        .input-group { text-align: left; margin-bottom: 20px; }
        .input-group label {
            display: block; font-size: 0.7rem; font-weight: 800;
            color: #86868b; margin-bottom: 8px; margin-left: 5px;
            text-transform: uppercase; letter-spacing: 1px;
        }

        input {
            width: 100%; padding: 18px 20px;
            background: rgba(0, 0, 0, 0.03);
            border: 1.5px solid transparent;
            border-radius: 18px;
            font-size: 1rem; font-family: inherit; font-weight: 600;
            color: var(--text); outline: none; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        input:focus {
            background: #ffffff;
            border-color: var(--apple-blue);
            box-shadow: 0 0 15px var(--apple-glow);
            transform: scale(1.01);
        }

        .btn-apple {
            width: 100%; padding: 18px;
            background: var(--apple-blue);
            color: white; border: none; border-radius: 18px;
            font-size: 1rem; font-weight: 700; cursor: pointer;
            transition: 0.3s; margin-top: 10px;
        }

        .btn-apple:hover { opacity: 0.9; transform: translateY(-2px); }
        .btn-apple:active { transform: scale(0.98); }

        .error-msg {
            background: rgba(255, 59, 48, 0.1); color: #ff3b30;
            padding: 12px; border-radius: 12px; font-size: 0.8rem;
            font-weight: 700; margin-bottom: 20px;
        }

        .toggle-text { margin-top: 25px; font-size: 0.9rem; color: #86868b; font-weight: 600; }
        .toggle-text span { color: var(--apple-blue); cursor: pointer; font-weight: 800; }

        .hidden { display: none; }

        /* SLIDE ANIMATION */
        .slide-fade { animation: slideUp 0.6s ease-out; }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>

    <div class="aurora-container">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
    </div>

    <div class="auth-container slide-fade">
        <div class="logo">
            <h1>VIP AI MINING</h1>
            <p>Enterprise Crypto Portal</p>
        </div>

        <?php if($error): ?>
            <div class="error-msg"><?php echo $error; ?></div>
        <?php endif; ?>

        <div id="login-box">
            <form action="" method="POST">
                <div class="input-group">
                    <label>Username</label>
                    <input type="text" name="username" placeholder="Username" required>
                </div>
                <div class="input-group">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="••••••••" required>
                </div>
                <button type="submit" name="login" class="btn-apple">LOGIN</button>
            </form>
            <p class="toggle-text">New here? <span onclick="toggleAuth()">Create Account</span></p>
        </div>

        <div id="signup-box" class="hidden">
            <form action="" method="POST">
                <div class="input-group">
                    <label>Username</label>
                    <input type="text" name="username" placeholder="Choose unique name" required>
                </div>
                <div class="input-group">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="Complex password" required>
                </div>
                <div class="input-group">
                    <label>Referral Code</label>
                    <input type="text" name="referrer_code" value="<?php echo $ref_from_url; ?>" placeholder="Optional Link" <?php echo !empty($ref_from_url) ? 'readonly' : ''; ?>>
                </div>
                <button type="submit" name="signup" class="btn-apple">SIGNUP</button>
            </form>
            <p class="toggle-text">Registered? <span onclick="toggleAuth()">Login</span></p>
        </div>
    </div>

    <script>
        function toggleAuth() {
            const login = document.getElementById('login-box');
            const signup = document.getElementById('signup-box');
            login.classList.toggle('hidden');
            signup.classList.toggle('hidden');
        }
        <?php if(!empty($ref_from_url)) echo "toggleAuth();"; ?>
    </script>
</body>
</html>
