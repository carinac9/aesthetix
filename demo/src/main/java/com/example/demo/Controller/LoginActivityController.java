package com.example.demo.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Entity.LoginActivity;
import com.example.demo.Repository.LoginActivityRepository;

@RestController
@RequestMapping("/api/users")
public class LoginActivityController {
    
    @Autowired
    private LoginActivityRepository loginActivityRepository;

    @GetMapping("/login-activity/{userId}")
    public ResponseEntity<List<LoginActivity>> getLoginActivity(@PathVariable Long userId) {
        List<LoginActivity> logs = loginActivityRepository.findTop10ByUserIdOrderByTimestampDesc(userId);
        return ResponseEntity.ok(logs);
    }
}
