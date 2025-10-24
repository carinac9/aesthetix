package com.example.demo.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.Entity.RoomProject;

public interface RoomProjectRepository extends JpaRepository<RoomProject, Long> {
    List<RoomProject> findByUserId(Integer userId);
}
