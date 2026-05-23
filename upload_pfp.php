<?php
require_once 'config.php';
session_start();

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['profile_image'])) {
    $user_id = $_SESSION['user_id'];
    $file = $_FILES['profile_image'];

    // 1. Create uploads folder if it doesn't exist
    if (!is_dir('uploads')) {
        mkdir('uploads', 0777, true);
    }

    // 2. Validate file
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif'];

    if (in_array($ext, $allowed)) {
        $new_name = "profile_" . $user_id . "_" . time() . "." . $ext;
        $target = "uploads/" . $new_name;

        if (move_uploaded_file($file['tmp_name'], $target)) {
            // 3. Update database using your correct column name: profile_pic
            $stmt = $conn->prepare("UPDATE users SET profile_pic = ? WHERE id = ?");
            $stmt->execute([$new_name, $user_id]);
            
            if ($stmt->rowCount()) {
                // Success! Redirect back to profile
                header("Location: profile.php?status=success");
                exit();
            } else {
                echo "Database Error: Unable to update profile picture.";
            }
        } else {
            echo "Error: Could not move uploaded file.";
        }
    } else {
        echo "Error: Invalid file type. Only JPG, PNG, and GIF allowed.";
    }
} else {
    header("Location: profile.php");
}
?>
