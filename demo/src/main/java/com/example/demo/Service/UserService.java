package com.example.demo.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.example.demo.Entity.User;
import com.example.demo.Repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender; 

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public User updateUser(Long id, User userDetails) {
        return userRepository.findById(id).map(user -> {
            user.setName(userDetails.getName());
            user.setEmail(userDetails.getEmail());
            user.setDescription(userDetails.getDescription());
            user.setCity(userDetails.getCity());
            user.setCountry(userDetails.getCountry());
            user.setDateOfBirth(userDetails.getDateOfBirth());
            user.setZodiacSign(userDetails.getZodiacSign());
            user.setProfilePicture(userDetails.getProfilePicture()); 

            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with ID: " + id);
        }
        userRepository.deleteById(id);
    }

    public User updateProfilePicture(Long id, String profilePicture) {
        return userRepository.findById(id).map(user -> {
            user.setProfilePicture(profilePicture);
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
    }

    public User loginUser(String email, String password) {
        return userRepository.findAll().stream()
                .filter(user -> user.getEmail().equals(email) && user.getPasswordHash().equals(password))
                .findFirst()
                .orElse(null);
    }

    public String generatePasswordResetToken(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found. If this email is registered, you will receive a reset link.");
        }

        User user = userOptional.get();
        String resetToken = UUID.randomUUID().toString();
        user.setPasswordResetToken(resetToken);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

      
        sendResetEmail(user.getEmail(), resetToken);

        return resetToken;
    }


    public void resetPassword(String token, String newPassword) {
        Optional<User> userOptional = userRepository.findByPasswordResetToken(token);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("Invalid or expired reset token");
        }

        User user = userOptional.get();
        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset token has expired");
        }

        user.setPasswordHash(newPassword); 
        user.setPasswordResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    private void sendResetEmail(String toEmail, String token) {
        String resetLink = token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("🔑 Reset Your Password - aesthetix");
        message.setText("""
                        Hello,

                        We received a request to reset your password.

                        To reset your password, use the token below:
                        """ +
                        resetLink + "\n\n" +
                        "This token is valid for 15 minutes.\n\n" +
                        "If you did not request this change, please ignore this email.\n\n" +
                        "Best regards,\n" +
                        "aesthetix Team :3");

        mailSender.send(message);
    }
}
