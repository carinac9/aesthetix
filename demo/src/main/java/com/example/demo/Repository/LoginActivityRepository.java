package com.example.demo.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.Entity.LoginActivity;

public interface LoginActivityRepository extends JpaRepository<LoginActivity, Long> {
    List<LoginActivity> findTop10ByUserIdOrderByTimestampDesc(Long userId);
    Optional<LoginActivity> findTopByUserIdOrderByTimestampDesc(Long userId);
}
